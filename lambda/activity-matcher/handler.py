"""
Activity-ECG Matcher Lambda Function

Automatically matches activity data with ECG recording sessions based on:
- Time overlap
- User ID
- Heart rate correlation (if available)

Calculates match quality score and creates matches above threshold.
"""

import json
import os
import uuid
import boto3
from datetime import datetime
from boto3.dynamodb.conditions import Key
from decimal import Decimal
import statistics

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')

# Environment variables
ACTIVITIES_TABLE = os.environ['ACTIVITIES_TABLE']
SESSIONS_TABLE = os.environ['SESSIONS_TABLE']
MATCHES_TABLE = os.environ['ACTIVITY_MATCHES_TABLE']

activities_table = dynamodb.Table(ACTIVITIES_TABLE)
sessions_table = dynamodb.Table(SESSIONS_TABLE)
matches_table = dynamodb.Table(MATCHES_TABLE)

# Matching thresholds
MIN_OVERLAP_PERCENT = 50  # Minimum 50% time overlap
MIN_MATCH_QUALITY = 70    # Minimum quality score for auto-match
SUGGEST_MATCH_QUALITY = 50  # Suggest matches above this score


def lambda_handler(event, context):
    """
    Find and create matches between activity and ECG sessions
    """
    print(f"Received event: {json.dumps(event)}")

    try:
        activity_id = event.get('activity_id')
        user_id = event.get('user_id')

        if not activity_id or not user_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'activity_id and user_id required'})
            }

        # Get activity details
        activity_response = activities_table.get_item(Key={'activity_id': activity_id})
        if 'Item' not in activity_response:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Activity not found'})
            }

        activity = activity_response['Item']

        # Find overlapping ECG sessions
        matches = find_matching_sessions(activity, user_id)

        # Create match records for high-quality matches
        created_matches = []
        for match in matches:
            if match['match_quality'] >= MIN_MATCH_QUALITY:
                match_record = create_match_record(match)
                created_matches.append(match_record)

        # Update activity match status
        if created_matches:
            activities_table.update_item(
                Key={'activity_id': activity_id},
                UpdateExpression='SET has_ecg_match = :true, ecg_match_count = :count',
                ExpressionAttributeValues={
                    ':true': True,
                    ':count': len(created_matches)
                }
            )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'activity_id': activity_id,
                'matches_found': len(matches),
                'matches_created': len(created_matches),
                'matches': [json.loads(json.dumps(m, default=decimal_default)) for m in created_matches]
            })
        }

    except Exception as e:
        print(f"Error in matcher: {e}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }


def find_matching_sessions(activity, user_id):
    """
    Find ECG sessions that overlap with the activity
    """
    start_timestamp = int(activity['start_timestamp'])
    end_timestamp = int(activity['end_timestamp'])
    duration = end_timestamp - start_timestamp

    # Add buffer of 1 hour before and after for searching
    search_start = start_timestamp - 3600
    search_end = end_timestamp + 3600

    try:
        # Query sessions for this user in the time range
        response = sessions_table.query(
            IndexName='UserIndex',
            KeyConditionExpression=Key('user_id').eq(user_id) & Key('start_timestamp').between(search_start, search_end)
        )

        sessions = response['Items']
        print(f"Found {len(sessions)} potential sessions")

        matches = []
        for session in sessions:
            match_data = calculate_match_quality(activity, session)
            if match_data and match_data['match_quality'] >= SUGGEST_MATCH_QUALITY:
                matches.append(match_data)

        # Sort by match quality descending
        matches.sort(key=lambda x: x['match_quality'], reverse=True)

        return matches

    except Exception as e:
        print(f"Error finding sessions: {e}")
        return []


def calculate_match_quality(activity, session):
    """
    Calculate match quality between activity and ECG session

    Quality score (0-100):
    - Time overlap: 0-40 points
    - Heart rate correlation: 0-40 points
    - Data completeness: 0-20 points
    """
    activity_start = int(activity['start_timestamp'])
    activity_end = int(activity['end_timestamp'])
    activity_duration = activity_end - activity_start

    session_start = int(session['start_timestamp'])
    session_end = session_start + int(session.get('duration_seconds', 0))

    # Calculate time overlap
    overlap_start = max(activity_start, session_start)
    overlap_end = min(activity_end, session_end)

    if overlap_end <= overlap_start:
        return None  # No overlap

    overlap_duration = overlap_end - overlap_start

    # Calculate overlap percentage relative to activity duration
    overlap_percent = (overlap_duration / activity_duration) * 100

    if overlap_percent < MIN_OVERLAP_PERCENT:
        return None  # Insufficient overlap

    # Score components
    overlap_score = min(40, (overlap_percent / 100) * 40)  # 0-40 points

    # Heart rate correlation score
    hr_score = 0
    hr_correlation = None
    avg_hr_diff = None

    activity_hr = activity.get('avg_heart_rate')
    session_hr = session.get('avg_heart_rate')

    if activity_hr and session_hr:
        # Simple correlation based on average HR difference
        hr_diff = abs(float(activity_hr) - float(session_hr))
        avg_hr_diff = hr_diff

        # Perfect match (0 diff) = 40 points, decreases with difference
        # Allow up to 20 BPM difference
        if hr_diff <= 20:
            hr_score = 40 * (1 - (hr_diff / 20))
            hr_correlation = 1 - (hr_diff / 20)  # Simplified correlation
        else:
            hr_score = 0
            hr_correlation = 0

    # Data completeness score
    completeness_score = 0
    if activity.get('time_series'):
        completeness_score += 10
    if session.get('metrics'):
        completeness_score += 10

    # Total quality score
    match_quality = int(overlap_score + hr_score + completeness_score)

    return {
        'activity_id': activity['activity_id'],
        'session_id': session['session_id'],
        'user_id': activity['user_id'],
        'match_quality': match_quality,
        'overlap_start': overlap_start,
        'overlap_end': overlap_end,
        'overlap_duration': overlap_duration,
        'overlap_percent': overlap_percent,
        'hr_correlation': hr_correlation,
        'avg_hr_diff': avg_hr_diff
    }


def create_match_record(match_data):
    """
    Create a match record in DynamoDB
    """
    match_id = str(uuid.uuid4())
    timestamp = int(datetime.utcnow().timestamp())

    match_record = {
        'match_id': match_id,
        'activity_id': match_data['activity_id'],
        'session_id': match_data['session_id'],
        'user_id': match_data['user_id'],
        'match_timestamp': timestamp,
        'match_type': 'automatic',
        'match_quality': match_data['match_quality'],
        'overlap_start': match_data['overlap_start'],
        'overlap_end': match_data['overlap_end'],
        'overlap_duration': match_data['overlap_duration'],
        'verified': False
    }

    # Add optional fields
    if match_data.get('hr_correlation') is not None:
        match_record['hr_correlation'] = Decimal(str(match_data['hr_correlation']))
    if match_data.get('avg_hr_diff') is not None:
        match_record['avg_hr_diff'] = Decimal(str(match_data['avg_hr_diff']))

    matches_table.put_item(Item=match_record)

    return match_record


def decimal_default(obj):
    """JSON serializer for Decimal objects"""
    if isinstance(obj, Decimal):
        return float(obj) if obj % 1 else int(obj)
    raise TypeError
