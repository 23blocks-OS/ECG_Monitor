"""
ECG API Handler Lambda Function

Provides REST API endpoints for the web dashboard:
- GET /api/live - Latest ECG data
- GET /api/alerts - Recent alerts
- GET /api/history - Historical data
"""

import json
import os
import boto3
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


def decimal_default(obj):
    """JSON serializer for Decimal objects"""
    if isinstance(obj, boto3.dynamodb.types.Decimal):
        return float(obj)
    raise TypeError
