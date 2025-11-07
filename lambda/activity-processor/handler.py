"""
Activity File Processor Lambda Function

Triggered by S3 upload events to process activity files:
- Downloads file from S3
- Parses FIT, GPX, or TCX format
- Extracts activity data and time-series
- Stores parsed data in DynamoDB
- Triggers automatic matching with ECG sessions
"""

import json
import os
import uuid
import boto3
import tempfile
from datetime import datetime, timedelta
from decimal import Decimal

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
lambda_client = boto3.client('lambda')

# Environment variables
ACTIVITY_UPLOADS_TABLE = os.environ['ACTIVITY_UPLOADS_TABLE']
ACTIVITIES_TABLE = os.environ['ACTIVITIES_TABLE']
ACTIVITY_MATCHER_FUNCTION = os.environ.get('ACTIVITY_MATCHER_FUNCTION', '')

uploads_table = dynamodb.Table(ACTIVITY_UPLOADS_TABLE)
activities_table = dynamodb.Table(ACTIVITIES_TABLE)


def lambda_handler(event, context):
    """
    Handle S3 upload events
    """
    print(f"Received S3 event: {json.dumps(event)}")

    try:
        for record in event['Records']:
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']

            print(f"Processing file: s3://{bucket}/{key}")

            # Parse S3 key to get upload metadata
            # Format: {user_id}/{source}/{upload_id}/{filename}
            parts = key.split('/')
            if len(parts) < 4:
                print(f"Invalid S3 key format: {key}")
                continue

            user_id = parts[0]
            source = parts[1]
            upload_id = parts[2]
            filename = parts[3]

            # Get upload record
            upload_response = uploads_table.get_item(Key={'upload_id': upload_id})
            if 'Item' not in upload_response:
                print(f"Upload record not found: {upload_id}")
                continue

            upload = upload_response['Item']
            file_type = upload['file_type']

            # Update status to processing
            uploads_table.update_item(
                Key={'upload_id': upload_id},
                UpdateExpression='SET processing_status = :status',
                ExpressionAttributeValues={':status': 'processing'}
            )

            try:
                # Download file to temp directory
                with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
                    s3.download_fileobj(bucket, key, tmp_file)
                    tmp_path = tmp_file.name

                # Parse file based on type
                activities = []
                if file_type == 'fit':
                    activities = parse_fit_file(tmp_path, user_id, upload_id, source)
                elif file_type == 'gpx':
                    activities = parse_gpx_file(tmp_path, user_id, upload_id, source)
                elif file_type == 'tcx':
                    activities = parse_tcx_file(tmp_path, user_id, upload_id, source)
                elif file_type == 'json':
                    activities = parse_json_file(tmp_path, user_id, upload_id, source)

                # Clean up temp file
                os.unlink(tmp_path)

                # Store activities in DynamoDB
                for activity in activities:
                    activities_table.put_item(Item=activity)

                # Update upload status to completed
                uploads_table.update_item(
                    Key={'upload_id': upload_id},
                    UpdateExpression='SET processing_status = :status, activities_count = :count',
                    ExpressionAttributeValues={
                        ':status': 'completed',
                        ':count': len(activities)
                    }
                )

                print(f"Successfully processed {len(activities)} activities from {filename}")

                # Trigger automatic matching if function is configured
                if ACTIVITY_MATCHER_FUNCTION:
                    for activity in activities:
                        try:
                            lambda_client.invoke(
                                FunctionName=ACTIVITY_MATCHER_FUNCTION,
                                InvocationType='Event',  # Async
                                Payload=json.dumps({
                                    'activity_id': activity['activity_id'],
                                    'user_id': user_id
                                })
                            )
                        except Exception as e:
                            print(f"Error triggering matcher: {e}")

            except Exception as e:
                print(f"Error processing file: {e}")
                import traceback
                traceback.print_exc()

                # Update upload status to failed
                uploads_table.update_item(
                    Key={'upload_id': upload_id},
                    UpdateExpression='SET processing_status = :status, error_message = :error',
                    ExpressionAttributeValues={
                        ':status': 'failed',
                        ':error': str(e)
                    }
                )

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Processing complete'})
        }

    except Exception as e:
        print(f"Error in handler: {e}")
        import traceback
        traceback.print_exc()
        raise


def parse_fit_file(file_path, user_id, upload_id, source):
    """
    Parse FIT file and extract activity data
    """
    try:
        from fitparse import FitFile
    except ImportError:
        print("fitparse not installed, creating placeholder activity")
        return create_placeholder_activity(file_path, user_id, upload_id, source, 'fit')

    try:
        fitfile = FitFile(file_path)
        activities = []

        # Get activity sessions
        for record in fitfile.get_messages('session'):
            activity_data = extract_fit_session(record, fitfile, user_id, upload_id, source)
            if activity_data:
                activities.append(activity_data)

        # If no sessions found, try to extract from records
        if not activities:
            activity_data = extract_fit_records(fitfile, user_id, upload_id, source)
            if activity_data:
                activities.append(activity_data)

        return activities if activities else [create_placeholder_activity(file_path, user_id, upload_id, source, 'fit')]

    except Exception as e:
        print(f"Error parsing FIT file: {e}")
        return [create_placeholder_activity(file_path, user_id, upload_id, source, 'fit')]


def extract_fit_session(session, fitfile, user_id, upload_id, source):
    """Extract activity data from FIT session record"""
    activity_id = str(uuid.uuid4())
    timestamp = int(datetime.utcnow().timestamp())

    # Extract basic session data
    session_data = {}
    for field in session:
        session_data[field.name] = field.value

    start_time = session_data.get('start_time')
    if start_time:
        start_timestamp = int(start_time.timestamp())
    else:
        start_timestamp = timestamp

    total_elapsed_time = session_data.get('total_elapsed_time', 0)
    end_timestamp = start_timestamp + int(total_elapsed_time)

    # Extract time-series data from records
    time_series = extract_fit_time_series(fitfile, start_timestamp)

    # Build activity record
    activity = {
        'activity_id': activity_id,
        'user_id': user_id,
        'upload_id': upload_id,
        'source': source,
        'start_timestamp': start_timestamp,
        'end_timestamp': end_timestamp,
        'duration_seconds': int(total_elapsed_time),
        'activity_type': session_data.get('sport', 'unknown'),
        'total_distance_meters': Decimal(str(session_data.get('total_distance', 0))),
        'avg_heart_rate': session_data.get('avg_heart_rate'),
        'max_heart_rate': session_data.get('max_heart_rate'),
        'avg_speed': Decimal(str(session_data.get('avg_speed', 0))),
        'max_speed': Decimal(str(session_data.get('max_speed', 0))),
        'avg_cadence': session_data.get('avg_cadence'),
        'avg_power': session_data.get('avg_power'),
        'calories': session_data.get('total_calories'),
        'elevation_gain': Decimal(str(session_data.get('total_ascent', 0))),
        'elevation_loss': Decimal(str(session_data.get('total_descent', 0))),
        'has_ecg_match': False,
        'ecg_match_count': 0,
        'time_series': time_series,
        'ttl': int((datetime.utcnow() + timedelta(days=365)).timestamp())
    }

    # Remove None values
    return {k: v for k, v in activity.items() if v is not None}


def extract_fit_time_series(fitfile, start_timestamp):
    """Extract time-series data from FIT file records"""
    time_series = {
        'timestamps': [],
        'heart_rates': [],
        'distances': [],
        'speeds': [],
        'elevations': [],
        'cadences': [],
        'positions': []
    }

    try:
        for record in fitfile.get_messages('record'):
            record_data = {}
            for field in record:
                record_data[field.name] = field.value

            timestamp = record_data.get('timestamp')
            if timestamp:
                time_series['timestamps'].append(int(timestamp.timestamp()))

            if 'heart_rate' in record_data and record_data['heart_rate']:
                time_series['heart_rates'].append(record_data['heart_rate'])

            if 'distance' in record_data and record_data['distance']:
                time_series['distances'].append(float(record_data['distance']))

            if 'speed' in record_data and record_data['speed']:
                time_series['speeds'].append(float(record_data['speed']))

            if 'altitude' in record_data and record_data['altitude']:
                time_series['elevations'].append(float(record_data['altitude']))

            if 'cadence' in record_data and record_data['cadence']:
                time_series['cadences'].append(record_data['cadence'])

            lat = record_data.get('position_lat')
            lon = record_data.get('position_long')
            if lat and lon:
                time_series['positions'].append({
                    'lat': float(lat) * (180 / 2**31),  # Convert semicircles to degrees
                    'lon': float(lon) * (180 / 2**31)
                })

        # Remove empty arrays
        time_series = {k: v for k, v in time_series.items() if v}

    except Exception as e:
        print(f"Error extracting time series: {e}")

    return time_series


def extract_fit_records(fitfile, user_id, upload_id, source):
    """Extract activity from raw records when no session data"""
    # This is a simplified version - implement if needed
    return None


def parse_gpx_file(file_path, user_id, upload_id, source):
    """Parse GPX file and extract activity data"""
    try:
        import gpxpy
        import gpxpy.gpx
    except ImportError:
        print("gpxpy not installed, creating placeholder activity")
        return [create_placeholder_activity(file_path, user_id, upload_id, source, 'gpx')]

    try:
        with open(file_path, 'r') as gpx_file:
            gpx = gpxpy.parse(gpx_file)

        activities = []

        for track in gpx.tracks:
            activity_data = extract_gpx_track(track, user_id, upload_id, source)
            if activity_data:
                activities.append(activity_data)

        return activities if activities else [create_placeholder_activity(file_path, user_id, upload_id, source, 'gpx')]

    except Exception as e:
        print(f"Error parsing GPX file: {e}")
        return [create_placeholder_activity(file_path, user_id, upload_id, source, 'gpx')]


def extract_gpx_track(track, user_id, upload_id, source):
    """Extract activity data from GPX track"""
    activity_id = str(uuid.uuid4())

    # Collect all track points
    points = []
    for segment in track.segments:
        points.extend(segment.points)

    if not points:
        return None

    start_time = points[0].time
    end_time = points[-1].time

    if not start_time or not end_time:
        return None

    start_timestamp = int(start_time.timestamp())
    end_timestamp = int(end_time.timestamp())
    duration = end_timestamp - start_timestamp

    # Extract time-series data
    time_series = {
        'timestamps': [],
        'heart_rates': [],
        'elevations': [],
        'positions': []
    }

    total_distance = 0
    prev_point = None

    for point in points:
        if point.time:
            time_series['timestamps'].append(int(point.time.timestamp()))

        if point.elevation:
            time_series['elevations'].append(float(point.elevation))

        time_series['positions'].append({
            'lat': float(point.latitude),
            'lon': float(point.longitude)
        })

        # Extract heart rate from extensions if available
        if hasattr(point, 'extensions') and point.extensions:
            for ext in point.extensions:
                if 'hr' in ext.tag.lower() or 'heartrate' in ext.tag.lower():
                    try:
                        hr = int(ext.text)
                        time_series['heart_rates'].append(hr)
                    except:
                        pass

        # Calculate distance
        if prev_point:
            total_distance += point.distance_2d(prev_point)
        prev_point = point

    # Remove empty arrays
    time_series = {k: v for k, v in time_series.items() if v}

    # Calculate average HR if available
    avg_hr = None
    max_hr = None
    if time_series.get('heart_rates'):
        avg_hr = sum(time_series['heart_rates']) / len(time_series['heart_rates'])
        max_hr = max(time_series['heart_rates'])

    activity = {
        'activity_id': activity_id,
        'user_id': user_id,
        'upload_id': upload_id,
        'source': source,
        'activity_name': track.name or 'GPX Activity',
        'start_timestamp': start_timestamp,
        'end_timestamp': end_timestamp,
        'duration_seconds': duration,
        'total_distance_meters': Decimal(str(total_distance)) if total_distance else None,
        'start_lat': Decimal(str(points[0].latitude)),
        'start_lon': Decimal(str(points[0].longitude)),
        'end_lat': Decimal(str(points[-1].latitude)),
        'end_lon': Decimal(str(points[-1].longitude)),
        'avg_heart_rate': int(avg_hr) if avg_hr else None,
        'max_heart_rate': int(max_hr) if max_hr else None,
        'has_ecg_match': False,
        'ecg_match_count': 0,
        'time_series': time_series,
        'ttl': int((datetime.utcnow() + timedelta(days=365)).timestamp())
    }

    return {k: v for k, v in activity.items() if v is not None}


def parse_tcx_file(file_path, user_id, upload_id, source):
    """Parse TCX file and extract activity data"""
    # Placeholder - implement TCX parsing
    print("TCX parsing not yet implemented")
    return [create_placeholder_activity(file_path, user_id, upload_id, source, 'tcx')]


def parse_json_file(file_path, user_id, upload_id, source):
    """Parse Strava JSON export"""
    # Placeholder - implement JSON parsing for Strava bulk export
    print("JSON parsing not yet implemented")
    return [create_placeholder_activity(file_path, user_id, upload_id, source, 'json')]


def create_placeholder_activity(file_path, user_id, upload_id, source, file_type):
    """Create a placeholder activity when parsing fails or libraries not available"""
    activity_id = str(uuid.uuid4())
    timestamp = int(datetime.utcnow().timestamp())

    return {
        'activity_id': activity_id,
        'user_id': user_id,
        'upload_id': upload_id,
        'source': source,
        'activity_name': f'Uploaded {file_type.upper()} file',
        'activity_type': 'unknown',
        'start_timestamp': timestamp,
        'end_timestamp': timestamp,
        'duration_seconds': 0,
        'has_ecg_match': False,
        'ecg_match_count': 0,
        'ttl': int((datetime.utcnow() + timedelta(days=365)).timestamp())
    }
