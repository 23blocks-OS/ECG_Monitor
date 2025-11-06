"""
ECG Alert Worker Lambda Function

Monitors DynamoDB Streams for new alerts and sends email notifications
"""

import json
import os
import boto3
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
ses = boto3.client('ses')

# Environment variables
ALERT_EMAIL = os.environ['ALERT_EMAIL']
FROM_EMAIL = os.environ['FROM_EMAIL']
ALERTS_TABLE = os.environ['ALERTS_TABLE']

alerts_table = dynamodb.Table(ALERTS_TABLE)

# Cooldown period to avoid alert spam (15 minutes)
ALERT_COOLDOWN_MINUTES = 15


def lambda_handler(event, context):
    """
    Process DynamoDB Stream events for new alerts
    """
    print(f"Received {len(event['Records'])} stream records")

    for record in event['Records']:
        if record['eventName'] == 'INSERT':
            try:
                process_alert(record['dynamodb']['NewImage'])
            except Exception as e:
                print(f"Error processing alert: {e}")
                # Don't raise - let other alerts process

    return {
        'statusCode': 200,
        'body': json.dumps({'processed': len(event['Records'])})
    }


def process_alert(alert_image):
    """Process a new alert from DynamoDB Stream"""
    # Convert DynamoDB format to Python dict
    alert = {
        'alert_id': alert_image['alert_id']['S'],
        'device_id': alert_image['device_id']['S'],
        'timestamp': int(alert_image['timestamp']['N']),
        'severity': alert_image['severity']['S'],
        'type': alert_image['type']['S'],
        'arrhythmias': json.loads(alert_image['arrhythmias']['S']) if 'arrhythmias' in alert_image else [],
        'anomalies': json.loads(alert_image['anomalies']['S']) if 'anomalies' in alert_image else [],
        'summary': alert_image.get('summary', {}).get('S', ''),
        'recommendations': json.loads(alert_image['recommendations']['S']) if 'recommendations' in alert_image else [],
        'confidence': float(alert_image.get('confidence', {}).get('N', 0.0)),
        'heart_rate_bpm': int(alert_image.get('heart_rate_bpm', {}).get('N', 0))
    }

    print(f"Processing alert {alert['alert_id']} with severity {alert['severity']}")

    # Check if we should send notification (cooldown logic)
    if should_send_notification(alert):
        send_email_notification(alert)
        mark_notification_sent(alert['alert_id'])
    else:
        print(f"Skipping notification due to cooldown period")


def should_send_notification(alert):
    """Check if notification should be sent (respect cooldown)"""
    # For critical alerts, always send
    if alert['severity'] == 'critical':
        return True

    # Check recent alerts for same device
    try:
        cutoff_time = int((datetime.utcnow() - timedelta(minutes=ALERT_COOLDOWN_MINUTES)).timestamp() * 1000)

        response = alerts_table.query(
            IndexName='DeviceTimestampIndex',
            KeyConditionExpression='device_id = :device_id AND #ts > :cutoff',
            ExpressionAttributeNames={'#ts': 'timestamp'},
            ExpressionAttributeValues={
                ':device_id': alert['device_id'],
                ':cutoff': cutoff_time
            },
            FilterExpression='notification_sent = :true',
            ExpressionAttributeValues={
                **{':device_id': alert['device_id'], ':cutoff': cutoff_time},
                ':true': True
            },
            Limit=1
        )

        if response['Items']:
            print(f"Found recent alert within cooldown period")
            return False

    except Exception as e:
        print(f"Error checking cooldown: {e}")
        # If error, send notification to be safe
        return True

    return True


def send_email_notification(alert):
    """Send email notification via SES"""
    try:
        subject = f"[ECG Alert] {alert['severity'].upper()} - Heart Monitoring Alert"

        # Build email body
        body_html = build_email_html(alert)
        body_text = build_email_text(alert)

        # Send email
        response = ses.send_email(
            Source=FROM_EMAIL,
            Destination={
                'ToAddresses': [ALERT_EMAIL]
            },
            Message={
                'Subject': {
                    'Data': subject,
                    'Charset': 'UTF-8'
                },
                'Body': {
                    'Text': {
                        'Data': body_text,
                        'Charset': 'UTF-8'
                    },
                    'Html': {
                        'Data': body_html,
                        'Charset': 'UTF-8'
                    }
                }
            }
        )

        print(f"Sent email notification for alert {alert['alert_id']}: {response['MessageId']}")

    except Exception as e:
        print(f"Error sending email: {e}")
        raise


def build_email_text(alert):
    """Build plain text email body"""
    timestamp = datetime.utcfromtimestamp(alert['timestamp'] / 1000).strftime('%Y-%m-%d %H:%M:%S')

    text = f"""ECG Monitor Alert

Time: {timestamp} UTC
Severity: {alert['severity'].upper()}
Device: {alert['device_id']}
Heart Rate: {alert['heart_rate_bpm']} BPM

Analysis Summary:
{alert['summary']}

"""

    if alert['arrhythmias']:
        text += f"\nArrhythmias Detected:\n"
        for arrhythmia in alert['arrhythmias']:
            text += f"- {arrhythmia}\n"

    if alert['anomalies']:
        text += f"\nAnomalies:\n"
        for anomaly in alert['anomalies']:
            text += f"- {anomaly}\n"

    if alert['recommendations']:
        text += f"\nRecommendations:\n"
        for rec in alert['recommendations']:
            text += f"- {rec}\n"

    text += f"\nConfidence: {alert['confidence']:.0%}"

    text += f"""

---
IMPORTANT: This is a personal health monitoring system, NOT a medical device.
Always consult healthcare professionals for medical decisions.

ECG Monitor System
Alert ID: {alert['alert_id']}
"""

    return text


def build_email_html(alert):
    """Build HTML email body"""
    timestamp = datetime.utcfromtimestamp(alert['timestamp'] / 1000).strftime('%Y-%m-%d %H:%M:%S')

    severity_colors = {
        'low': '#28a745',
        'medium': '#ffc107',
        'high': '#fd7e14',
        'critical': '#dc3545'
    }
    color = severity_colors.get(alert['severity'], '#6c757d')

    html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: {color}; color: white; padding: 20px; border-radius: 5px; }}
        .content {{ padding: 20px; background-color: #f8f9fa; margin-top: 20px; border-radius: 5px; }}
        .metric {{ margin: 10px 0; }}
        .metric strong {{ display: inline-block; width: 150px; }}
        .section {{ margin: 20px 0; }}
        .list-item {{ margin: 5px 0; padding-left: 20px; }}
        .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }}
        .warning {{ background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ECG Monitor Alert</h1>
            <p style="margin: 0; font-size: 18px;">Severity: {alert['severity'].upper()}</p>
        </div>

        <div class="content">
            <div class="section">
                <h2>Alert Details</h2>
                <div class="metric"><strong>Time:</strong> {timestamp} UTC</div>
                <div class="metric"><strong>Device:</strong> {alert['device_id']}</div>
                <div class="metric"><strong>Heart Rate:</strong> {alert['heart_rate_bpm']} BPM</div>
                <div class="metric"><strong>Confidence:</strong> {alert['confidence']:.0%}</div>
            </div>

            <div class="section">
                <h2>Analysis Summary</h2>
                <p>{alert['summary']}</p>
            </div>
"""

    if alert['arrhythmias']:
        html += """
            <div class="section">
                <h2>Arrhythmias Detected</h2>
"""
        for arrhythmia in alert['arrhythmias']:
            html += f'                <div class="list-item">• {arrhythmia}</div>\n'
        html += "            </div>\n"

    if alert['anomalies']:
        html += """
            <div class="section">
                <h2>Anomalies</h2>
"""
        for anomaly in alert['anomalies']:
            html += f'                <div class="list-item">• {anomaly}</div>\n'
        html += "            </div>\n"

    if alert['recommendations']:
        html += """
            <div class="section">
                <h2>Recommendations</h2>
"""
        for rec in alert['recommendations']:
            html += f'                <div class="list-item">• {rec}</div>\n'
        html += "            </div>\n"

    html += f"""
        </div>

        <div class="warning">
            <strong>⚠️ IMPORTANT:</strong> This is a personal health monitoring system, NOT a medical device.
            Always consult healthcare professionals for medical decisions.
        </div>

        <div class="footer">
            <p>ECG Monitor System<br>
            Alert ID: {alert['alert_id']}</p>
        </div>
    </div>
</body>
</html>
"""

    return html


def mark_notification_sent(alert_id):
    """Mark alert as notification sent in DynamoDB"""
    try:
        alerts_table.update_item(
            Key={'alert_id': alert_id},
            UpdateExpression='SET notification_sent = :true, notification_timestamp = :ts',
            ExpressionAttributeValues={
                ':true': True,
                ':ts': int(datetime.utcnow().timestamp() * 1000)
            }
        )
        print(f"Marked alert {alert_id} as notification sent")
    except Exception as e:
        print(f"Error marking notification sent: {e}")
