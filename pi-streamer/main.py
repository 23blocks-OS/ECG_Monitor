#!/usr/bin/env python3
"""
ECG Monitor - Cloud Streamer

Streams ECG data from local buffer to AWS IoT Core
"""

import sys
import time
import signal
import argparse
import yaml
from pathlib import Path

# Try to import AWS IoT SDK
try:
    from iot_client import IoTClient
    AWS_IOT_AVAILABLE = True
except ImportError:
    from iot_client import MockIoTClient as IoTClient
    AWS_IOT_AVAILABLE = False
    print("Warning: AWS IoT SDK not available, using mock mode")

from data_compressor import DataCompressor
sys.path.append(str(Path(__file__).parent.parent / 'pi-collector'))
from buffer_manager import ECGBuffer


class ECGStreamer:
    """Cloud streaming service for ECG data"""

    def __init__(self, config_path):
        """
        Initialize streamer

        Args:
            config_path: Path to configuration YAML file
        """
        self.config = self.load_config(config_path)
        self.running = False

        # Initialize components
        self.iot_client = None
        self.compressor = None
        self.buffer = None

        # Statistics
        self.batches_sent = 0
        self.batches_failed = 0
        self.bytes_sent = 0
        self.start_time = None

    def load_config(self, config_path):
        """Load configuration from YAML file"""
        try:
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)
            print(f"Loaded configuration from {config_path}")
            return config
        except Exception as e:
            print(f"Error loading config: {e}")
            sys.exit(1)

    def initialize(self):
        """Initialize all components"""
        print("Initializing ECG Streamer...")

        # Initialize IoT client
        iot_config = self.config['aws_iot']
        use_mock = not AWS_IOT_AVAILABLE or self.config.get('use_mock', False)

        if use_mock:
            print("Using MOCK IoT client")
            self.iot_client = IoTClient(
                endpoint=iot_config['endpoint'],
                client_id=iot_config['client_id'],
                topic_prefix=iot_config['topic_prefix'],
                cert_path='',
                key_path='',
                ca_path=''
            )
        else:
            print("Using REAL AWS IoT Core client")
            self.iot_client = IoTClient(
                endpoint=iot_config['endpoint'],
                client_id=iot_config['client_id'],
                cert_path=iot_config['cert_path'],
                key_path=iot_config['key_path'],
                ca_path=iot_config['ca_path'],
                topic_prefix=iot_config['topic_prefix']
            )

        # Connect to IoT Core
        if not self.iot_client.connect(retry_attempts=self.config['streaming']['retry_attempts']):
            print("Fatal: Could not connect to AWS IoT Core")
            sys.exit(1)

        # Initialize compressor
        streaming_config = self.config['streaming']
        if streaming_config['compression']:
            self.compressor = DataCompressor(compression_level=6)
        else:
            self.compressor = None

        # Initialize buffer manager (to read cached batches)
        buf_config = self.config['buffer']
        self.buffer = ECGBuffer(
            buffer_seconds=buf_config['size_seconds'],
            sampling_rate=self.config['ecg']['sampling_rate_hz'],
            cache_dir=buf_config['cache_directory'],
            max_cache_mb=buf_config['max_cache_size_mb']
        )

        print("ECG Streamer initialized successfully")

    def start(self):
        """Start streaming"""
        self.running = True
        self.start_time = time.time()

        print(f"\n{'='*60}")
        print("Starting ECG data streaming")
        print(f"Endpoint: {self.config['aws_iot']['endpoint']}")
        print(f"Client ID: {self.config['aws_iot']['client_id']}")
        print(f"Compression: {'enabled' if self.compressor else 'disabled'}")
        print(f"{'='*60}\n")

        # Send initial heartbeat
        self.iot_client.send_heartbeat({
            'firmware_version': '1.0.0',
            'sampling_rate': self.config['ecg']['sampling_rate_hz']
        })

        try:
            self.streaming_loop()
        except KeyboardInterrupt:
            print("\nReceived interrupt signal")
        except Exception as e:
            print(f"\nError in streaming loop: {e}")
            import traceback
            traceback.print_exc()
        finally:
            self.stop()

    def streaming_loop(self):
        """Main streaming loop"""
        batch_interval = self.config['streaming']['batch_size_seconds']
        heartbeat_interval = self.config.get('health', {}).get('heartbeat_interval_seconds', 60)
        last_heartbeat = time.time()

        while self.running:
            # Process cached batches first (offline recovery)
            self.process_cached_batches()

            # Send heartbeat periodically
            if time.time() - last_heartbeat >= heartbeat_interval:
                self.iot_client.send_heartbeat({
                    'batches_sent': self.batches_sent,
                    'batches_failed': self.batches_failed,
                    'bytes_sent': self.bytes_sent
                })
                last_heartbeat = time.time()

            # Wait for next batch
            time.sleep(batch_interval)

    def process_cached_batches(self):
        """Process batches from disk cache"""
        cached = self.buffer.get_cached_batches()

        if not cached:
            return

        print(f"Found {len(cached)} cached batches to send")

        for filepath, timestamp in cached:
            if not self.running:
                break

            # Load batch
            batch = self.buffer.load_cached_batch(filepath)
            if not batch:
                continue

            # Send batch
            success = self.send_batch(batch)

            if success:
                # Delete from cache
                self.buffer.delete_cached_batch(filepath)
                self.batches_sent += 1
            else:
                # Keep in cache, try again later
                self.batches_failed += 1
                print(f"Failed to send batch, keeping in cache")
                break  # Don't try more if one fails

    def send_batch(self, batch_data):
        """
        Send batch to IoT Core

        Args:
            batch_data: Dict with batch data

        Returns:
            bool: True if sent successfully
        """
        try:
            # Compress if enabled
            if self.compressor:
                payload = self.compressor.compress_batch(batch_data)
                print(f"Compressed batch: {payload['original_size']} → "
                      f"{payload['compressed_size']} bytes "
                      f"({payload['compression_ratio']}% reduction)")
            else:
                payload = batch_data

            # Publish to IoT Core
            topic_suffix = f"{self.config['aws_iot']['client_id']}/data"
            success = self.iot_client.publish(topic_suffix, payload)

            if success:
                if self.compressor:
                    self.bytes_sent += payload['compressed_size']
                else:
                    self.bytes_sent += len(str(payload))

            return success

        except Exception as e:
            print(f"Error sending batch: {e}")
            return False

    def stop(self):
        """Stop streaming and cleanup"""
        print("\nStopping ECG Streamer...")
        self.running = False

        if self.iot_client:
            # Send final heartbeat
            try:
                self.iot_client.send_heartbeat({'status': 'offline'})
            except Exception:
                pass

            self.iot_client.disconnect()

        # Print final statistics
        if self.start_time:
            elapsed = time.time() - self.start_time
            print(f"\n{'='*60}")
            print("Streaming Statistics:")
            print(f"  Runtime: {elapsed:.1f} seconds")
            print(f"  Batches sent: {self.batches_sent}")
            print(f"  Batches failed: {self.batches_failed}")
            print(f"  Bytes sent: {self.bytes_sent:,}")
            if elapsed > 0:
                print(f"  Average throughput: {self.bytes_sent / elapsed:.1f} bytes/sec")
            print(f"{'='*60}\n")

        print("ECG Streamer stopped")


def signal_handler(sig, frame):
    """Handle termination signals"""
    print("\nReceived termination signal")
    sys.exit(0)


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='ECG Monitor Cloud Streamer')
    parser.add_argument(
        '--config',
        default='../config/pi-config.yaml',
        help='Path to configuration file'
    )
    parser.add_argument(
        '--mock',
        action='store_true',
        help='Use mock IoT client (for testing)'
    )

    args = parser.parse_args()

    # Setup signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Create and run streamer
    streamer = ECGStreamer(args.config)

    if args.mock:
        streamer.config['use_mock'] = True

    streamer.initialize()
    streamer.start()


if __name__ == '__main__':
    main()
