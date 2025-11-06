"""
ECG Preprocessor Lambda Function

Processes raw ECG batches from SQS:
1. Decompress and validate data
2. Compute derived metrics (HR, HRV, QRS)
3. Store processed data
4. Queue for AI analysis
"""

import json
import gzip
import base64
import os
import boto3
import uuid
from datetime import datetime
from decimal import Decimal

# Initialize AWS clients
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')

# Environment variables
SESSIONS_TABLE = os.environ['SESSIONS_TABLE']
ANALYSIS_QUEUE_URL = os.environ['ANALYSIS_QUEUE_URL']
PROCESSED_BUCKET = os.environ['PROCESSED_BUCKET']

sessions_table = dynamodb.Table(SESSIONS_TABLE)


def lambda_handler(event, context):
    """
    Process SQS messages containing ECG data batches
    """
    print(f"Received {len(event['Records'])} messages")

    for record in event['Records']:
        try:
            process_ecg_batch(record)
        except Exception as e:
            print(f"Error processing record: {e}")
            # Let it fail so SQS can retry
            raise

    return {
        'statusCode': 200,
        'body': json.dumps({'processed': len(event['Records'])})
    }


def process_ecg_batch(record):
    """Process a single ECG batch"""
    # Parse SQS message
    body = json.loads(record['body'])
    print(f"Processing batch from device: {body.get('device_id')}")

    # Decompress if needed
    if body.get('compressed'):
        raw_data = decompress_data(body['data'])
    else:
        raw_data = body

    # Validate data
    if not validate_ecg_data(raw_data):
        print("Invalid ECG data, skipping")
        return

    # Compute metrics
    metrics = compute_metrics(raw_data)

    # Create processed batch object
    batch_id = str(uuid.uuid4())
    processed_batch = {
        'batch_id': batch_id,
        'device_id': raw_data['device_id'],
        'timestamp': raw_data.get('start_timestamp', int(datetime.utcnow().timestamp() * 1000)),
        'duration_seconds': raw_data.get('duration_seconds', 10),
        'metrics': metrics,
        'flags': detect_flags(metrics),
        's3_raw_path': raw_data.get('s3_path', '')
    }

    # Store processed metrics in S3
    store_processed_data(processed_batch)

    # Update session in DynamoDB
    update_session(processed_batch)

    # Queue for AI analysis (every 10th batch or if flags detected)
    should_analyze = (
        processed_batch['flags'].get('irregular_rhythm', False) or
        processed_batch['flags'].get('noisy_signal', False) or
        int(batch_id.split('-')[0], 16) % 10 == 0  # Analyze ~10% of batches
    )

    if should_analyze:
        queue_for_analysis(processed_batch)

    print(f"Processed batch {batch_id} with HR: {metrics['heart_rate_bpm']} BPM")


def decompress_data(compressed_data):
    """Decompress gzipped base64 data"""
    try:
        decoded = base64.b64decode(compressed_data)
        decompressed = gzip.decompress(decoded)
        return json.loads(decompressed)
    except Exception as e:
        print(f"Error decompressing data: {e}")
        raise


def validate_ecg_data(data):
    """Validate ECG data structure"""
    required_fields = ['device_id', 'channels']
    return all(field in data for field in required_fields)


def compute_metrics(data):
    """
    Compute derived ECG metrics

    In a real implementation, this would use scipy for signal processing.
    For POC, we'll compute simplified metrics.
    """
    # Get sample rate
    sample_rate = data.get('sample_rate', 250)
    duration = data.get('duration_seconds', 10)

    # For POC: simplified heart rate calculation
    # In production, use QRS detection algorithm
    num_samples = len(data['channels']['channel_1']) if 'channel_1' in data['channels'] else 2500

    # Estimate heart rate (simplified)
    # Assume ~1 QRS per second at 60 BPM
    estimated_qrs = int(duration * 1.2)  # Assume 72 BPM average
    heart_rate_bpm = (estimated_qrs / duration) * 60

    # Simplified R-R intervals (in ms)
    rr_intervals = [int(60000 / heart_rate_bpm)] * estimated_qrs

    # Heart Rate Variability metrics
    hrv_rmssd = compute_rmssd(rr_intervals)
    hrv_sdnn = compute_sdnn(rr_intervals)

    return {
        'heart_rate_bpm': int(heart_rate_bpm),
        'rr_intervals_ms': rr_intervals,
        'hrv_rmssd': round(hrv_rmssd, 2),
        'hrv_sdnn': round(hrv_sdnn, 2),
        'qrs_count': estimated_qrs,
        'avg_qrs_width_ms': 95,  # Typical value
        'signal_quality_score': 0.85  # Simplified
    }


def compute_rmssd(rr_intervals):
    """Compute RMSSD (Root Mean Square of Successive Differences)"""
    if len(rr_intervals) < 2:
        return 0.0

    diffs = [abs(rr_intervals[i+1] - rr_intervals[i]) for i in range(len(rr_intervals)-1)]
    squared_diffs = [d**2 for d in diffs]
    mean_squared = sum(squared_diffs) / len(squared_diffs)
    return mean_squared ** 0.5


def compute_sdnn(rr_intervals):
    """Compute SDNN (Standard Deviation of NN intervals)"""
    if len(rr_intervals) < 2:
        return 0.0

    mean_rr = sum(rr_intervals) / len(rr_intervals)
    variance = sum((rr - mean_rr)**2 for rr in rr_intervals) / len(rr_intervals)
    return variance ** 0.5


def detect_flags(metrics):
    """Detect anomalies in metrics"""
    flags = {
        'missed_beats': False,
        'noisy_signal': metrics['signal_quality_score'] < 0.7,
        'irregular_rhythm': False
    }

    # Check for bradycardia or tachycardia
    hr = metrics['heart_rate_bpm']
    if hr < 40 or hr > 180:
        flags['irregular_rhythm'] = True

    # Check HRV
    if metrics['hrv_rmssd'] > 100 or metrics['hrv_sdnn'] > 100:
        flags['irregular_rhythm'] = True

    return flags


def store_processed_data(batch):
    """Store processed batch in S3"""
    key = f"processed/{datetime.utcnow().strftime('%Y/%m/%d/%H')}/{batch['batch_id']}.json"

    s3.put_object(
        Bucket=PROCESSED_BUCKET,
        Key=key,
        Body=json.dumps(batch, default=str),
        ContentType='application/json'
    )

    batch['s3_processed_path'] = f"s3://{PROCESSED_BUCKET}/{key}"


def update_session(batch):
    """Update session metadata in DynamoDB"""
    try:
        sessions_table.update_item(
            Key={'session_id': batch['device_id']},  # Using device_id as session_id for simplicity
            UpdateExpression='SET last_update = :ts, last_heart_rate = :hr, batches_received = if_not_exists(batches_received, :zero) + :one',
            ExpressionAttributeValues={
                ':ts': batch['timestamp'],
                ':hr': batch['metrics']['heart_rate_bpm'],
                ':zero': 0,
                ':one': 1
            }
        )
    except Exception as e:
        print(f"Error updating session: {e}")


def queue_for_analysis(batch):
    """Queue batch for AI analysis"""
    message = {
        'batch_id': batch['batch_id'],
        'device_id': batch['device_id'],
        'timestamp': batch['timestamp'],
        'metrics': batch['metrics'],
        'flags': batch['flags'],
        's3_path': batch.get('s3_processed_path', '')
    }

    sqs.send_message(
        QueueUrl=ANALYSIS_QUEUE_URL,
        MessageBody=json.dumps(message, default=str)
    )

    print(f"Queued batch {batch['batch_id']} for AI analysis")
