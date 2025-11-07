"""
ECG API Handler Lambda Function

Provides REST API endpoints for the web dashboard:
- GET /api/live - Latest ECG data
- GET /api/alerts - Recent alerts
- GET /api/history - Historical data
- GET /api/export - Export ECG data for a time period
"""

import json
import os
import boto3
import csv
import io
from datetime import datetime, timedelta
from boto3.dynamodb.conditions import Key

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

# Environment variables
SESSIONS_TABLE = os.environ['SESSIONS_TABLE']
ALERTS_TABLE = os.environ['ALERTS_TABLE']
ANALYSIS_TABLE = os.environ['ANALYSIS_TABLE']
RAW_DATA_BUCKET = os.environ['RAW_DATA_BUCKET']

sessions_table = dynamodb.Table(SESSIONS_TABLE)
alerts_table = dynamodb.Table(ALERTS_TABLE)
analysis_table = dynamodb.Table(ANALYSIS_TABLE)


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
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    }

    # Route request
    path = event['path']
    method = event['httpMethod']

    try:
        if path == '/api/live' and method == 'GET':
            result = get_live_data(event)
        elif path == '/api/alerts' and method == 'GET':
            result = get_alerts(event)
        elif path == '/api/history' and method == 'GET':
            result = get_history(event)
        elif path == '/api/export' and method == 'GET':
            result = export_data(event)
        elif path.startswith('/api/analysis/') and method == 'GET':
            batch_id = path.split('/')[-1]
            result = get_analysis(batch_id)
        else:
            result = {
                'statusCode': 404,
                'body': json.dumps({'error': 'Not found'})
            }

        result['headers'] = headers
        return result

    except Exception as e:
        print(f"Error handling request: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }


def get_live_data(event):
    """
    GET /api/live
    Returns latest ECG data (last 10 seconds)
    """
    # For POC, return mock live data
    # In production, query DynamoDB or S3 for most recent batch

    # Query sessions table for latest session
    try:
        # This is simplified - in production you'd have device_id parameter
        device_id = event.get('queryStringParameters', {}).get('device_id', 'ecg-device-001')

        response = sessions_table.get_item(Key={'session_id': device_id})

        if 'Item' in response:
            session = response['Item']
            # Convert Decimal to float for JSON serialization
            session = json.loads(json.dumps(session, default=decimal_default))
        else:
            session = {
                'device_id': device_id,
                'status': 'no_data',
                'last_update': 0
            }

        # Generate mock waveform data (downsampled for dashboard)
        # In production, fetch from S3 and downsample
        waveform = generate_mock_waveform()

        return {
            'statusCode': 200,
            'body': json.dumps({
                'device_id': device_id,
                'timestamp': int(datetime.utcnow().timestamp() * 1000),
                'status': session.get('status', 'active'),
                'metrics': {
                    'heart_rate_bpm': session.get('last_heart_rate', 72),
                    'hrv_rmssd': 42.5,
                    'signal_quality': 0.92
                },
                'waveform': waveform
            })
        }

    except Exception as e:
        print(f"Error getting live data: {e}")
        raise


def get_alerts(event):
    """
    GET /api/alerts
    Returns recent alerts (last 24 hours)
    """
    params = event.get('queryStringParameters') or {}
    device_id = params.get('device_id', 'ecg-device-001')
    hours = int(params.get('hours', 24))

    try:
        # Query alerts for device in time range
        cutoff_time = int((datetime.utcnow() - timedelta(hours=hours)).timestamp() * 1000)

        response = alerts_table.query(
            IndexName='DeviceTimestampIndex',
            KeyConditionExpression=Key('device_id').eq(device_id) & Key('timestamp').gt(cutoff_time),
            ScanIndexForward=False,  # Sort descending
            Limit=50
        )

        alerts = response['Items']
        alerts = json.loads(json.dumps(alerts, default=decimal_default))

        return {
            'statusCode': 200,
            'body': json.dumps({
                'device_id': device_id,
                'alerts': alerts,
                'count': len(alerts)
            })
        }

    except Exception as e:
        print(f"Error getting alerts: {e}")
        raise


def get_history(event):
    """
    GET /api/history?start=<timestamp>&end=<timestamp>
    Returns historical metrics
    """
    params = event.get('queryStringParameters') or {}
    device_id = params.get('device_id', 'ecg-device-001')

    # Default to last hour
    end_time = int(params.get('end', datetime.utcnow().timestamp() * 1000))
    start_time = int(params.get('start', (datetime.utcnow() - timedelta(hours=1)).timestamp() * 1000))

    try:
        # Query analysis table for historical data
        response = analysis_table.query(
            IndexName='DeviceAnalysisIndex',
            KeyConditionExpression=Key('device_id').eq(device_id) & Key('analysis_timestamp').between(start_time, end_time),
            ScanIndexForward=True,  # Sort ascending
            Limit=100
        )

        items = response['Items']
        items = json.loads(json.dumps(items, default=decimal_default))

        # Transform to time series data
        history = []
        for item in items:
            history.append({
                'timestamp': item['analysis_timestamp'],
                'heart_rate_bpm': item['metrics'].get('heart_rate_bpm', 0),
                'hrv_rmssd': item['metrics'].get('hrv_rmssd', 0),
                'signal_quality': item['metrics'].get('signal_quality_score', 0),
                'severity': item.get('analysis', {}).get('severity', 'low')
            })

        return {
            'statusCode': 200,
            'body': json.dumps({
                'device_id': device_id,
                'start_time': start_time,
                'end_time': end_time,
                'history': history,
                'count': len(history)
            })
        }

    except Exception as e:
        print(f"Error getting history: {e}")
        raise


def get_analysis(batch_id):
    """
    GET /api/analysis/{batch_id}
    Returns detailed analysis for a batch
    """
    try:
        response = analysis_table.get_item(Key={'batch_id': batch_id})

        if 'Item' in response:
            analysis = response['Item']
            analysis = json.loads(json.dumps(analysis, default=decimal_default))

            return {
                'statusCode': 200,
                'body': json.dumps(analysis)
            }
        else:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Analysis not found'})
            }

    except Exception as e:
        print(f"Error getting analysis: {e}")
        raise


def generate_mock_waveform():
    """
    Generate mock ECG waveform for dashboard
    Returns 100 downsampled points for each channel
    """
    import math

    points = 100
    waveform = {
        'channel_1': [],
        'channel_2': [],
        'channel_3': []
    }

    for i in range(points):
        # Simulate ECG waveform (simplified)
        t = i / points
        # Basic sine wave with some noise for QRS complexes
        val1 = int(math.sin(t * 12 * math.pi) * 100 + (math.sin(t * 120 * math.pi) * 20))
        val2 = int(math.sin(t * 12 * math.pi + 0.5) * 90 + (math.sin(t * 120 * math.pi) * 15))
        val3 = int(math.sin(t * 12 * math.pi + 1.0) * 95 + (math.sin(t * 120 * math.pi) * 18))

        waveform['channel_1'].append(val1)
        waveform['channel_2'].append(val2)
        waveform['channel_3'].append(val3)

    return waveform


def export_data(event):
    """
    GET /api/export?user_id=<id>&device_id=<id>&start=<timestamp>&end=<timestamp>&format=<json|csv>
    Export ECG data for a specified time period in raw format
    """
    params = event.get('queryStringParameters') or {}

    # Required parameters
    user_id = params.get('user_id')
    if not user_id:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'user_id is required'})
        }

    # Optional parameters with defaults
    device_id = params.get('device_id')
    export_format = params.get('format', 'json').lower()

    # Default to last 24 hours if not specified
    end_time = int(params.get('end', datetime.utcnow().timestamp() * 1000))
    start_time = int(params.get('start', (datetime.utcnow() - timedelta(hours=24)).timestamp() * 1000))

    # Validate format
    if export_format not in ['json', 'csv']:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'format must be either "json" or "csv"'})
        }

    try:
        # Query sessions table for the time range
        sessions = []
        if device_id:
            # Query by device_id
            response = sessions_table.query(
                IndexName='DeviceIndex',
                KeyConditionExpression=Key('device_id').eq(device_id) & Key('start_timestamp').between(start_time, end_time),
                FilterExpression=Key('user_id').eq(user_id),
                ScanIndexForward=True
            )
            sessions = response['Items']
        else:
            # Query by user_id only
            response = sessions_table.query(
                IndexName='UserIndex',
                KeyConditionExpression=Key('user_id').eq(user_id) & Key('start_timestamp').between(start_time, end_time),
                ScanIndexForward=True
            )
            sessions = response['Items']

        # Query analysis table for detailed metrics
        analysis_data = []
        if device_id:
            response = analysis_table.query(
                IndexName='DeviceAnalysisIndex',
                KeyConditionExpression=Key('device_id').eq(device_id) & Key('analysis_timestamp').between(start_time, end_time),
                FilterExpression=Key('user_id').eq(user_id),
                ScanIndexForward=True
            )
            analysis_data = response['Items']
        else:
            response = analysis_table.query(
                IndexName='UserAnalysisIndex',
                KeyConditionExpression=Key('user_id').eq(user_id) & Key('analysis_timestamp').between(start_time, end_time),
                ScanIndexForward=True
            )
            analysis_data = response['Items']

        # Query alerts table
        alerts = []
        if device_id:
            response = alerts_table.query(
                IndexName='DeviceTimestampIndex',
                KeyConditionExpression=Key('device_id').eq(device_id) & Key('timestamp').between(start_time, end_time),
                FilterExpression=Key('user_id').eq(user_id),
                ScanIndexForward=True
            )
            alerts = response['Items']
        else:
            response = alerts_table.query(
                IndexName='UserTimestampIndex',
                KeyConditionExpression=Key('user_id').eq(user_id) & Key('timestamp').between(start_time, end_time),
                ScanIndexForward=True
            )
            alerts = response['Items']

        # Convert Decimal to float for JSON serialization
        sessions = json.loads(json.dumps(sessions, default=decimal_default))
        analysis_data = json.loads(json.dumps(analysis_data, default=decimal_default))
        alerts = json.loads(json.dumps(alerts, default=decimal_default))

        # Try to fetch raw waveform data from S3 for each analysis batch
        for analysis in analysis_data:
            batch_id = analysis.get('batch_id')
            device = analysis.get('device_id')
            if batch_id and device:
                try:
                    # Construct S3 key: device_id/year/month/day/batch_id.json
                    analysis_dt = datetime.fromtimestamp(analysis['analysis_timestamp'] / 1000)
                    s3_key = f"{device}/{analysis_dt.year}/{analysis_dt.month:02d}/{analysis_dt.day:02d}/{batch_id}.json"

                    s3_response = s3.get_object(Bucket=RAW_DATA_BUCKET, Key=s3_key)
                    raw_data = json.loads(s3_response['Body'].read().decode('utf-8'))

                    # Add raw waveform data to analysis
                    analysis['raw_waveform'] = raw_data.get('waveform', {})
                except Exception as e:
                    # If S3 fetch fails, continue without waveform data
                    print(f"Could not fetch S3 data for {batch_id}: {e}")
                    analysis['raw_waveform'] = None

        # Prepare export data
        export_data_obj = {
            'export_metadata': {
                'user_id': user_id,
                'device_id': device_id,
                'start_time': start_time,
                'end_time': end_time,
                'start_date': datetime.fromtimestamp(start_time / 1000).isoformat(),
                'end_date': datetime.fromtimestamp(end_time / 1000).isoformat(),
                'export_timestamp': datetime.utcnow().isoformat(),
                'format': export_format,
                'total_sessions': len(sessions),
                'total_analysis_records': len(analysis_data),
                'total_alerts': len(alerts)
            },
            'sessions': sessions,
            'analysis': analysis_data,
            'alerts': alerts
        }

        # Return data in requested format
        if export_format == 'json':
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Content-Disposition': f'attachment; filename="ecg_export_{user_id}_{start_time}_{end_time}.json"'
                },
                'body': json.dumps(export_data_obj, indent=2)
            }
        else:  # CSV format
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': f'attachment; filename="ecg_export_{user_id}_{start_time}_{end_time}.csv"'
                },
                'body': convert_to_csv(export_data_obj)
            }

    except Exception as e:
        print(f"Error exporting data: {e}")
        raise


def convert_to_csv(export_data):
    """
    Convert export data to CSV format
    Creates separate sections for sessions, analysis, and alerts
    """
    output = io.StringIO()

    # Write metadata header
    output.write("# ECG Data Export\n")
    metadata = export_data['export_metadata']
    for key, value in metadata.items():
        output.write(f"# {key}: {value}\n")
    output.write("\n")

    # Write sessions data
    output.write("# SESSIONS\n")
    if export_data['sessions']:
        sessions = export_data['sessions']
        writer = csv.DictWriter(output, fieldnames=sessions[0].keys())
        writer.writeheader()
        writer.writerows(sessions)
    output.write("\n")

    # Write analysis data (flattened, excluding raw waveforms for CSV)
    output.write("# ANALYSIS\n")
    if export_data['analysis']:
        # Flatten the analysis data for CSV
        flattened_analysis = []
        for record in export_data['analysis']:
            flat_record = {
                'batch_id': record.get('batch_id'),
                'device_id': record.get('device_id'),
                'user_id': record.get('user_id'),
                'analysis_timestamp': record.get('analysis_timestamp'),
                'analysis_date': datetime.fromtimestamp(record.get('analysis_timestamp', 0) / 1000).isoformat(),
                'heart_rate_bpm': record.get('metrics', {}).get('heart_rate_bpm'),
                'hrv_rmssd': record.get('metrics', {}).get('hrv_rmssd'),
                'signal_quality_score': record.get('metrics', {}).get('signal_quality_score'),
                'severity': record.get('analysis', {}).get('severity'),
                'has_raw_waveform': record.get('raw_waveform') is not None
            }
            flattened_analysis.append(flat_record)

        if flattened_analysis:
            writer = csv.DictWriter(output, fieldnames=flattened_analysis[0].keys())
            writer.writeheader()
            writer.writerows(flattened_analysis)
    output.write("\n")

    # Write alerts data
    output.write("# ALERTS\n")
    if export_data['alerts']:
        # Flatten alerts
        flattened_alerts = []
        for alert in export_data['alerts']:
            flat_alert = {
                'alert_id': alert.get('alert_id'),
                'device_id': alert.get('device_id'),
                'user_id': alert.get('user_id'),
                'timestamp': alert.get('timestamp'),
                'date': datetime.fromtimestamp(alert.get('timestamp', 0) / 1000).isoformat(),
                'severity': alert.get('severity'),
                'summary': alert.get('summary')
            }
            flattened_alerts.append(flat_alert)

        if flattened_alerts:
            writer = csv.DictWriter(output, fieldnames=flattened_alerts[0].keys())
            writer.writeheader()
            writer.writerows(flattened_alerts)

    output.write("\n")
    output.write("# Note: Raw waveform data is only available in JSON format export\n")

    return output.getvalue()


def decimal_default(obj):
    """JSON serializer for Decimal objects"""
    if isinstance(obj, boto3.dynamodb.types.Decimal):
        return float(obj)
    raise TypeError
