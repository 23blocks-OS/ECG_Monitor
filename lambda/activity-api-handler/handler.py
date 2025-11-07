"""
Activity API Handler Lambda Function

Provides REST API endpoints for Garmin/Strava activity data:
- POST /api/activities/upload - Generate pre-signed S3 URL for upload
- GET /api/activities - List user activities
- GET /api/activities/{id} - Get activity details
- POST /api/activities/match - Match activity with ECG session
- GET /api/activities/matches - Get user matches
"""

import json
import os
import uuid
import boto3
from datetime import datetime, timedelta
from boto3.dynamodb.conditions import Key
from decimal import Decimal

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

# Environment variables
ACTIVITY_UPLOADS_TABLE = os.environ['ACTIVITY_UPLOADS_TABLE']
ACTIVITIES_TABLE = os.environ['ACTIVITIES_TABLE']
ACTIVITY_MATCHES_TABLE = os.environ['ACTIVITY_MATCHES_TABLE']
ACTIVITY_FILES_BUCKET = os.environ['ACTIVITY_FILES_BUCKET']

uploads_table = dynamodb.Table(ACTIVITY_UPLOADS_TABLE)
activities_table = dynamodb.Table(ACTIVITIES_TABLE)
matches_table = dynamodb.Table(ACTIVITY_MATCHES_TABLE)


def lambda_handler(event, context):
    """
    Handle API Gateway requests
    """
    print(f"Received {event['httpMethod']} {event['path']}")

    # CORS headers
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    }

    # Handle OPTIONS for CORS
    if event['httpMethod'] == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }

    # Route request
    path = event['path']
    method = event['httpMethod']

    try:
        if path == '/api/activities/upload' and method == 'POST':
            result = create_upload(event)
        elif path == '/api/activities' and method == 'GET':
            result = list_activities(event)
        elif path.startswith('/api/activities/') and method == 'GET':
            # Check if it's a specific activity or a sub-path
            parts = path.split('/')
            if len(parts) == 4:  # /api/activities/{id}
                activity_id = parts[3]
                result = get_activity(activity_id)
            else:
                result = {'statusCode': 404, 'body': json.dumps({'error': 'Not found'})}
        elif path == '/api/activities/match' and method == 'POST':
            result = create_match(event)
        elif path == '/api/activities/matches' and method == 'GET':
            result = list_matches(event)
        else:
            result = {
                'statusCode': 404,
                'body': json.dumps({'error': 'Not found'})
            }

        result['headers'] = headers
        return result

    except Exception as e:
        print(f"Error handling request: {e}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }


def create_upload(event):
    """
    POST /api/activities/upload
    Creates upload record and returns pre-signed S3 URL
    """
    try:
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('user_id')
        source = body.get('source')  # 'garmin' or 'strava'
        file_name = body.get('file_name')
        file_type = body.get('file_type')  # 'fit', 'gpx', 'tcx', 'json'

        if not all([user_id, source, file_name, file_type]):
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing required fields'})
            }

        # Generate upload ID
        upload_id = str(uuid.uuid4())
        timestamp = int(datetime.utcnow().timestamp())

        # Generate S3 key
        s3_key = f"{user_id}/{source}/{upload_id}/{file_name}"

        # Create upload record
        upload_record = {
            'upload_id': upload_id,
            'user_id': user_id,
            'upload_timestamp': timestamp,
            'source': source,
            'file_name': file_name,
            'file_type': file_type,
            's3_key': s3_key,
            's3_bucket': ACTIVITY_FILES_BUCKET,
            'processing_status': 'pending',
            'activities_count': 0,
            'ttl': int((datetime.utcnow() + timedelta(days=365)).timestamp())
        }

        uploads_table.put_item(Item=upload_record)

        # Generate pre-signed URL for upload (valid for 15 minutes)
        presigned_url = s3.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': ACTIVITY_FILES_BUCKET,
                'Key': s3_key,
                'ContentType': get_content_type(file_type)
            },
            ExpiresIn=900
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'upload_id': upload_id,
                'status': 'pending',
                's3_url': presigned_url,
                's3_key': s3_key
            })
        }

    except Exception as e:
        print(f"Error creating upload: {e}")
        raise


def list_activities(event):
    """
    GET /api/activities?user_id={user_id}&start={timestamp}&end={timestamp}
    Returns user activities
    """
    try:
        params = event.get('queryStringParameters') or {}
        user_id = params.get('user_id')

        if not user_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'user_id required'})
            }

        # Query activities for user
        query_params = {
            'IndexName': 'UserActivitiesIndex',
            'KeyConditionExpression': Key('user_id').eq(user_id),
            'ScanIndexForward': False,  # Sort descending by timestamp
            'Limit': int(params.get('limit', 50))
        }

        # Add time range filters if provided
        start = params.get('start')
        end = params.get('end')
        if start and end:
            query_params['KeyConditionExpression'] &= Key('start_timestamp').between(int(start), int(end))
        elif start:
            query_params['KeyConditionExpression'] &= Key('start_timestamp').gte(int(start))
        elif end:
            query_params['KeyConditionExpression'] &= Key('start_timestamp').lte(int(end))

        response = activities_table.query(**query_params)
        activities = response['Items']

        # Convert Decimal to native types
        activities = json.loads(json.dumps(activities, default=decimal_default))

        return {
            'statusCode': 200,
            'body': json.dumps({
                'activities': activities,
                'count': len(activities)
            })
        }

    except Exception as e:
        print(f"Error listing activities: {e}")
        raise


def get_activity(activity_id):
    """
    GET /api/activities/{activity_id}
    Returns activity details with full time-series data
    """
    try:
        response = activities_table.get_item(Key={'activity_id': activity_id})

        if 'Item' in response:
            activity = response['Item']
            activity = json.loads(json.dumps(activity, default=decimal_default))

            return {
                'statusCode': 200,
                'body': json.dumps(activity)
            }
        else:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Activity not found'})
            }

    except Exception as e:
        print(f"Error getting activity: {e}")
        raise


def create_match(event):
    """
    POST /api/activities/match
    Creates a match between activity and ECG session
    """
    try:
        body = json.loads(event.get('body', '{}'))
        activity_id = body.get('activity_id')
        session_id = body.get('session_id')
        user_id = body.get('user_id')
        match_type = body.get('match_type', 'manual')
        notes = body.get('notes', '')

        if not all([activity_id, session_id, user_id]):
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing required fields'})
            }

        # Get activity details
        activity_response = activities_table.get_item(Key={'activity_id': activity_id})
        if 'Item' not in activity_response:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Activity not found'})
            }

        activity = activity_response['Item']

        # Create match record
        match_id = str(uuid.uuid4())
        timestamp = int(datetime.utcnow().timestamp())

        match_record = {
            'match_id': match_id,
            'activity_id': activity_id,
            'session_id': session_id,
            'user_id': user_id,
            'match_timestamp': timestamp,
            'match_type': match_type,
            'match_quality': 0,  # Will be calculated by matcher
            'overlap_start': int(activity.get('start_timestamp', 0)),
            'overlap_end': int(activity.get('end_timestamp', 0)),
            'overlap_duration': int(activity.get('duration_seconds', 0)),
            'notes': notes,
            'verified': False
        }

        matches_table.put_item(Item=match_record)

        # Update activity match count
        activities_table.update_item(
            Key={'activity_id': activity_id},
            UpdateExpression='SET has_ecg_match = :true, ecg_match_count = ecg_match_count + :inc',
            ExpressionAttributeValues={
                ':true': True,
                ':inc': 1
            }
        )

        match_record = json.loads(json.dumps(match_record, default=decimal_default))

        return {
            'statusCode': 200,
            'body': json.dumps(match_record)
        }

    except Exception as e:
        print(f"Error creating match: {e}")
        raise


def list_matches(event):
    """
    GET /api/activities/matches?user_id={user_id}
    Returns user matches
    """
    try:
        params = event.get('queryStringParameters') or {}
        user_id = params.get('user_id')
        activity_id = params.get('activity_id')
        session_id = params.get('session_id')

        if not user_id and not activity_id and not session_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'user_id, activity_id, or session_id required'})
            }

        # Query based on provided parameter
        if activity_id:
            response = matches_table.query(
                IndexName='ActivityMatchesIndex',
                KeyConditionExpression=Key('activity_id').eq(activity_id)
            )
        elif session_id:
            response = matches_table.query(
                IndexName='SessionMatchesIndex',
                KeyConditionExpression=Key('session_id').eq(session_id)
            )
        else:  # user_id
            response = matches_table.query(
                IndexName='UserMatchesIndex',
                KeyConditionExpression=Key('user_id').eq(user_id),
                ScanIndexForward=False,
                Limit=50
            )

        matches = response['Items']
        matches = json.loads(json.dumps(matches, default=decimal_default))

        return {
            'statusCode': 200,
            'body': json.dumps({
                'matches': matches,
                'count': len(matches)
            })
        }

    except Exception as e:
        print(f"Error listing matches: {e}")
        raise


def get_content_type(file_type):
    """Get content type for file upload"""
    content_types = {
        'fit': 'application/octet-stream',
        'gpx': 'application/gpx+xml',
        'tcx': 'application/vnd.garmin.tcx+xml',
        'json': 'application/json'
    }
    return content_types.get(file_type, 'application/octet-stream')


def decimal_default(obj):
    """JSON serializer for Decimal objects"""
    if isinstance(obj, Decimal):
        return float(obj) if obj % 1 else int(obj)
    raise TypeError
