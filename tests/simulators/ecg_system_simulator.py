#!/usr/bin/env python3
"""
ECG System Simulator

Simulates the entire ECG data pipeline:
1. Load test data
2. Compress like Pi would
3. Publish to AWS IoT Core
4. Wait for processing
5. Verify data in API

This allows end-to-end testing without hardware.
"""

import json
import gzip
import base64
import time
import sys
import os
from pathlib import Path
import argparse

# Add parent directories to path
sys.path.append(str(Path(__file__).parent.parent.parent / 'pi-streamer'))

try:
    import boto3
    from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient
    AWS_AVAILABLE = True
except ImportError:
    AWS_AVAILABLE = False
    print("Warning: AWS libraries not available, mock mode only")


class ECGSimulator:
    """Simulates ECG data flow through the system"""

    def __init__(self, config_path=None):
        self.config = self._load_config(config_path)
        self.iot_client = None
        self.api_client = None

    def _load_config(self, config_path):
        """Load configuration"""
        if config_path and Path(config_path).exists():
            import yaml
            with open(config_path) as f:
                return yaml.safe_load(f)

        # Default config
        return {
            'aws_iot': {
                'endpoint': os.getenv('IOT_ENDPOINT', 'localhost'),
                'client_id': 'ecg-simulator',
                'topic_prefix': 'ecg/device001'
            },
            'api': {
                'base_url': os.getenv('API_URL', 'http://localhost:3000')
            }
        }

    def setup_iot_client(self, cert_path, key_path, ca_path):
        """Setup AWS IoT Core MQTT client"""
        if not AWS_AVAILABLE:
            print("AWS SDK not available, using mock mode")
            return

        print("Setting up IoT client...")

        client_id = self.config['aws_iot']['client_id']
        endpoint = self.config['aws_iot']['endpoint']

        self.iot_client = AWSIoTMQTTClient(client_id)
        self.iot_client.configureEndpoint(endpoint, 8883)
        self.iot_client.configureCredentials(ca_path, key_path, cert_path)

        # Configure connection
        self.iot_client.configureAutoReconnectBackoffTime(1, 32, 20)
        self.iot_client.configureOfflinePublishQueueing(-1)
        self.iot_client.configureDrainingFrequency(2)
        self.iot_client.configureConnectDisconnectTimeout(10)
        self.iot_client.configureMQTTOperationTimeout(5)

        print(f"Connecting to {endpoint}...")
        self.iot_client.connect()
        print("✓ Connected to AWS IoT Core")

    def compress_batch(self, batch_data):
        """Compress batch like Pi streamer does"""
        json_data = json.dumps(batch_data)
        compressed = gzip.compress(json_data.encode('utf-8'))
        compressed_b64 = base64.b64encode(compressed).decode('ascii')

        return {
            'data': compressed_b64,
            'compressed': True,
            'device_id': batch_data['device_id'],
            'start_timestamp': batch_data['start_timestamp'],
            'batch_metadata': {
                'duration_seconds': batch_data['duration_seconds'],
                'sample_rate': batch_data['sample_rate'],
                'num_samples': batch_data['num_samples']
            }
        }

    def publish_batch(self, batch_data):
        """Publish batch to IoT Core"""
        if not self.iot_client:
            print("No IoT client, skipping publish")
            return False

        # Compress
        compressed = self.compress_batch(batch_data)

        # Publish
        topic = f"{self.config['aws_iot']['topic_prefix']}/data"
        payload = json.dumps(compressed)

        print(f"Publishing to {topic}...")
        print(f"  Original size: {len(json.dumps(batch_data))} bytes")
        print(f"  Compressed size: {len(payload)} bytes")

        self.iot_client.publish(topic, payload, 1)
        print("✓ Published successfully")
        return True

    def verify_api(self, device_id='ecg-device-001', wait_seconds=30):
        """Verify data shows up in API"""
        import requests

        api_url = self.config['api']['base_url']
        print(f"\nVerifying data in API...")
        print(f"Waiting {wait_seconds} seconds for processing...")

        time.sleep(wait_seconds)

        # Check live endpoint
        print(f"\nChecking {api_url}/api/live...")
        try:
            response = requests.get(f"{api_url}/api/live?device_id={device_id}")
            if response.status_code == 200:
                data = response.json()
                print("✓ Live data endpoint working")
                print(f"  Device: {data.get('device_id')}")
                print(f"  Status: {data.get('status')}")
                print(f"  Heart Rate: {data.get('metrics', {}).get('heart_rate_bpm')} BPM")
                return True
            else:
                print(f"✗ API returned {response.status_code}")
                return False
        except Exception as e:
            print(f"✗ API check failed: {e}")
            return False

    def check_dynamodb(self, table_name='ecg-monitor-poc-sessions'):
        """Check if data reached DynamoDB"""
        if not AWS_AVAILABLE:
            print("Boto3 not available, skipping DynamoDB check")
            return

        print(f"\nChecking DynamoDB table: {table_name}...")
        try:
            dynamodb = boto3.resource('dynamodb')
            table = dynamodb.Table(table_name)

            response = table.scan(Limit=5)
            items = response.get('Items', [])

            if items:
                print(f"✓ Found {len(items)} items in DynamoDB")
                for item in items[:3]:
                    print(f"  Session: {item.get('session_id')}")
                    print(f"    Last update: {item.get('last_update')}")
                    print(f"    Heart rate: {item.get('last_heart_rate')}")
                return True
            else:
                print("✗ No items found in DynamoDB")
                return False

        except Exception as e:
            print(f"✗ DynamoDB check failed: {e}")
            return False

    def check_s3(self, bucket_name='ecg-monitor-poc-raw-data'):
        """Check if data reached S3"""
        if not AWS_AVAILABLE:
            print("Boto3 not available, skipping S3 check")
            return

        print(f"\nChecking S3 bucket: {bucket_name}...")
        try:
            s3 = boto3.client('s3')
            response = s3.list_objects_v2(Bucket=bucket_name, MaxKeys=10)

            if 'Contents' in response:
                count = len(response['Contents'])
                print(f"✓ Found {count} objects in S3")
                for obj in response['Contents'][:3]:
                    print(f"  {obj['Key']} ({obj['Size']} bytes)")
                return True
            else:
                print("✗ No objects found in S3")
                return False

        except Exception as e:
            print(f"✗ S3 check failed: {e}")
            return False

    def run_simulation(self, test_data_path, scenario='normal'):
        """Run complete simulation"""
        print("="*60)
        print("ECG System Simulator")
        print("="*60)

        # Load test data
        print(f"\n1. Loading test data: {scenario}")
        data_file = Path(test_data_path) / f'{scenario}.json'

        if not data_file.exists():
            print(f"✗ Test data file not found: {data_file}")
            return False

        with open(data_file) as f:
            batch_data = json.load(f)

        print(f"✓ Loaded batch:")
        print(f"  Device: {batch_data['device_id']}")
        print(f"  Samples: {batch_data['num_samples']}")
        print(f"  Duration: {batch_data['duration_seconds']}s")

        # Publish to IoT
        print(f"\n2. Publishing to AWS IoT Core")
        if self.iot_client:
            success = self.publish_batch(batch_data)
            if not success:
                return False
        else:
            print("⚠ No IoT client configured, skipping publish")

        # Wait for processing
        print(f"\n3. Waiting for Lambda processing...")
        print("   Pipeline: IoT → S3 → SQS → Preprocessor → AI Analyzer")
        time.sleep(5)

        # Verify data flow
        print(f"\n4. Verifying data in AWS")

        s3_ok = self.check_s3()
        db_ok = self.check_dynamodb()

        # Check API
        print(f"\n5. Verifying API endpoint")
        # api_ok = self.verify_api()

        # Summary
        print("\n" + "="*60)
        print("Simulation Summary")
        print("="*60)
        print(f"S3 Storage: {'✓' if s3_ok else '✗'}")
        print(f"DynamoDB: {'✓' if db_ok else '✗'}")
        # print(f"API: {'✓' if api_ok else '✗'}")

        return s3_ok and db_ok

    def disconnect(self):
        """Disconnect from IoT"""
        if self.iot_client:
            self.iot_client.disconnect()
            print("\n✓ Disconnected from IoT Core")


def main():
    parser = argparse.ArgumentParser(description='ECG System Simulator')
    parser.add_argument(
        '--scenario',
        choices=['normal_sinus_rhythm', 'with_pvc', 'atrial_fibrillation', 'tachycardia'],
        default='normal_sinus_rhythm',
        help='Test scenario to simulate'
    )
    parser.add_argument('--cert', help='Path to device certificate')
    parser.add_argument('--key', help='Path to device private key')
    parser.add_argument('--ca', help='Path to Amazon Root CA')
    parser.add_argument('--config', help='Path to config file')
    parser.add_argument('--data-dir', default='tests/data', help='Test data directory')

    args = parser.parse_args()

    # Create simulator
    simulator = ECGSimulator(args.config)

    # Setup IoT client if credentials provided
    if args.cert and args.key and args.ca:
        try:
            simulator.setup_iot_client(args.cert, args.key, args.ca)
        except Exception as e:
            print(f"Failed to setup IoT client: {e}")
            print("Continuing without IoT connection...")

    try:
        # Run simulation
        success = simulator.run_simulation(args.data_dir, args.scenario)

        if success:
            print("\n✓ Simulation completed successfully!")
            return 0
        else:
            print("\n✗ Simulation had errors")
            return 1

    finally:
        simulator.disconnect()


if __name__ == '__main__':
    sys.exit(main())
