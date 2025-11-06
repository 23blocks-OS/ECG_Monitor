"""
ECG AI Analyzer Lambda Function

Uses Claude API to analyze ECG data for:
- Arrhythmia detection
- Pattern recognition
- Anomaly detection
"""

import json
import os
import boto3
import uuid
from datetime import datetime
from anthropic import Anthropic

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
secrets = boto3.client('secretsmanager')

# Environment variables
CLAUDE_API_SECRET_ARN = os.environ['CLAUDE_API_SECRET_ARN']
ANALYSIS_TABLE = os.environ['ANALYSIS_TABLE']
ALERTS_TABLE = os.environ['ALERTS_TABLE']
PROCESSED_BUCKET = os.environ['PROCESSED_BUCKET']

analysis_table = dynamodb.Table(ANALYSIS_TABLE)
alerts_table = dynamodb.Table(ALERTS_TABLE)

# Cache Claude client
claude_client = None


def get_claude_client():
    """Get Claude API client (with caching)"""
    global claude_client
    if claude_client is None:
        secret = secrets.get_secret_value(SecretId=CLAUDE_API_SECRET_ARN)
        secret_data = json.loads(secret['SecretString'])
        claude_client = Anthropic(api_key=secret_data['api_key'])
    return claude_client


def lambda_handler(event, context):
    """
    Process SQS messages containing ECG batches for AI analysis
    """
    print(f"Received {len(event['Records'])} batches for analysis")

    for record in event['Records']:
        try:
            analyze_batch(record)
        except Exception as e:
            print(f"Error analyzing batch: {e}")
            raise

    return {
        'statusCode': 200,
        'body': json.dumps({'analyzed': len(event['Records'])})
    }


def analyze_batch(record):
    """Analyze a single ECG batch with Claude"""
    batch_data = json.loads(record['body'])
    batch_id = batch_data['batch_id']
    device_id = batch_data['device_id']
    metrics = batch_data['metrics']
    flags = batch_data.get('flags', {})

    print(f"Analyzing batch {batch_id} from device {device_id}")

    # Build prompt for Claude
    prompt = build_analysis_prompt(batch_data)

    # Call Claude API
    try:
        client = get_claude_client()
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4096,
            temperature=0.3,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        # Parse Claude's response
        analysis_text = response.content[0].text
        analysis = parse_claude_response(analysis_text)

    except Exception as e:
        print(f"Error calling Claude API: {e}")
        analysis = {
            'error': str(e),
            'arrhythmias_detected': [],
            'pattern': 'unknown',
            'severity': 'low',
            'confidence': 0.0
        }

    # Store analysis results
    analysis_record = {
        'batch_id': batch_id,
        'device_id': device_id,
        'analysis_timestamp': int(datetime.utcnow().timestamp() * 1000),
        'model': 'claude-3-5-sonnet-20241022',
        'metrics': metrics,
        'analysis': analysis,
        'flags': flags
    }

    store_analysis(analysis_record)

    # Create alert if severity warrants it
    if analysis.get('severity') in ['medium', 'high', 'critical']:
        create_alert(analysis_record)

    print(f"Completed analysis for batch {batch_id}: severity={analysis.get('severity')}")


def build_analysis_prompt(batch_data):
    """Build prompt for Claude API"""
    metrics = batch_data['metrics']
    flags = batch_data.get('flags', {})

    prompt = f"""You are an expert cardiologist analyzing ECG data from a personal health monitoring device.

Patient Context:
- Device: Personal ECG monitor (3-lead, continuous monitoring)
- Time: {datetime.utcfromtimestamp(batch_data['timestamp']/1000).strftime('%Y-%m-%d %H:%M:%S')} UTC
- Activity: Unknown (could be rest, exercise, or daily activities)
- This is NOT for clinical diagnosis, but for personal health awareness

ECG Metrics (10-second window):
- Heart Rate: {metrics['heart_rate_bpm']} BPM
- Heart Rate Variability (RMSSD): {metrics['hrv_rmssd']} ms
- Heart Rate Variability (SDNN): {metrics['hrv_sdnn']} ms
- QRS Count: {metrics['qrs_count']}
- Average QRS Width: {metrics['avg_qrs_width_ms']} ms
- R-R Intervals (ms): {metrics['rr_intervals_ms']}
- Signal Quality: {metrics['signal_quality_score']}/1.0

Automated Flags:
- Noisy Signal: {'Yes' if flags.get('noisy_signal') else 'No'}
- Irregular Rhythm: {'Yes' if flags.get('irregular_rhythm') else 'No'}
- Missed Beats: {'Yes' if flags.get('missed_beats') else 'No'}

Please analyze this ECG data and provide:

1. **Arrhythmia Detection**: Identify any irregular rhythms (AFib, PVCs, PACs, bradycardia, tachycardia, etc.)
2. **Pattern Classification**: Is this rest, exercise, stress response, or something else?
3. **Anomalies**: Any concerning patterns or unusual findings?
4. **Severity**: Rate as low, medium, high, or critical
5. **Confidence**: Your confidence level (0.0 to 1.0)
6. **Summary**: Brief explanation in 1-2 sentences
7. **Recommendations**: Any suggested actions for the user

Respond ONLY with a valid JSON object in this exact format:
{{
  "arrhythmias_detected": ["list of arrhythmia names or empty array"],
  "pattern": "rest|exercise|stress|other",
  "anomalies": ["list of anomalies or empty array"],
  "severity": "low|medium|high|critical",
  "confidence": 0.85,
  "summary": "Brief explanation here",
  "recommendations": ["list of recommendations or empty array"]
}}"""

    return prompt


def parse_claude_response(response_text):
    """Parse Claude's JSON response"""
    try:
        # Try to extract JSON from response
        # Claude might wrap it in markdown code blocks
        if '```json' in response_text:
            json_str = response_text.split('```json')[1].split('```')[0].strip()
        elif '```' in response_text:
            json_str = response_text.split('```')[1].split('```')[0].strip()
        else:
            json_str = response_text.strip()

        analysis = json.loads(json_str)
        return analysis

    except Exception as e:
        print(f"Error parsing Claude response: {e}")
        print(f"Raw response: {response_text[:500]}")

        # Return default structure
        return {
            'arrhythmias_detected': [],
            'pattern': 'unknown',
            'anomalies': [],
            'severity': 'low',
            'confidence': 0.0,
            'summary': 'Error parsing AI response',
            'recommendations': []
        }


def store_analysis(analysis_record):
    """Store analysis in DynamoDB"""
    try:
        # Convert floats to Decimal for DynamoDB
        analysis_record_db = json.loads(
            json.dumps(analysis_record, default=str),
            parse_float=lambda x: round(float(x), 4)
        )

        analysis_table.put_item(Item=analysis_record_db)
        print(f"Stored analysis for batch {analysis_record['batch_id']}")

    except Exception as e:
        print(f"Error storing analysis: {e}")
        raise


def create_alert(analysis_record):
    """Create alert in DynamoDB"""
    try:
        alert_id = str(uuid.uuid4())
        alert = {
            'alert_id': alert_id,
            'batch_id': analysis_record['batch_id'],
            'device_id': analysis_record['device_id'],
            'timestamp': analysis_record['analysis_timestamp'],
            'severity': analysis_record['analysis']['severity'],
            'type': 'arrhythmia',
            'arrhythmias': analysis_record['analysis'].get('arrhythmias_detected', []),
            'anomalies': analysis_record['analysis'].get('anomalies', []),
            'summary': analysis_record['analysis'].get('summary', ''),
            'recommendations': analysis_record['analysis'].get('recommendations', []),
            'confidence': float(analysis_record['analysis'].get('confidence', 0.0)),
            'heart_rate_bpm': analysis_record['metrics']['heart_rate_bpm'],
            'notification_sent': False,
            'user_acknowledged': False
        }

        # Convert to DynamoDB format
        alert_db = json.loads(
            json.dumps(alert, default=str),
            parse_float=lambda x: round(float(x), 4)
        )

        alerts_table.put_item(Item=alert_db)
        print(f"Created alert {alert_id} for batch {analysis_record['batch_id']}")

    except Exception as e:
        print(f"Error creating alert: {e}")
        raise
