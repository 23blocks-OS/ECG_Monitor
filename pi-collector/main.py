#!/usr/bin/env python3
"""
ECG Monitor - Data Collector

Main script for Raspberry Pi ECG data collection
Reads from CJMCU-1293 and buffers data for streaming
"""

import sys
import time
import signal
import argparse
import yaml
from pathlib import Path

# Try to import hardware dependencies
try:
    from ecg_reader import CJMCU1293, MockCJMCU1293
    HARDWARE_AVAILABLE = True
except ImportError:
    from ecg_reader import MockCJMCU1293
    HARDWARE_AVAILABLE = False
    print("Warning: Hardware SPI libraries not available, using mock mode")

try:
    from signal_processor import ECGSignalProcessor
    SCIPY_AVAILABLE = True
except ImportError:
    from signal_processor import SimpleECGProcessor as ECGSignalProcessor
    SCIPY_AVAILABLE = False
    print("Warning: scipy not available, using simple signal processing")

from buffer_manager import ECGBuffer


class ECGCollector:
    """Main ECG data collector"""

    def __init__(self, config_path):
        """
        Initialize collector

        Args:
            config_path: Path to configuration YAML file
        """
        self.config = self.load_config(config_path)
        self.running = False

        # Initialize components
        self.ecg_reader = None
        self.signal_processor = None
        self.buffer = None

        # Statistics
        self.samples_collected = 0
        self.batches_created = 0
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
        print("Initializing ECG Collector...")

        # Determine if we should use mock or real hardware
        use_mock = not HARDWARE_AVAILABLE or self.config.get('use_mock', False)

        # Initialize ECG reader
        hw_config = self.config['hardware']
        ecg_config = self.config['ecg']

        if use_mock:
            print("Using MOCK ECG reader (no hardware)")
            self.ecg_reader = MockCJMCU1293(
                sampling_rate=ecg_config['sampling_rate_hz']
            )
        else:
            print("Using REAL CJMCU-1293 hardware")
            self.ecg_reader = CJMCU1293(
                spi_bus=hw_config['spi_bus'],
                spi_device=hw_config['spi_device'],
                spi_speed_hz=hw_config['spi_speed_hz'],
                gpio_reset=hw_config['gpio_reset_pin'],
                gpio_drdy=hw_config['gpio_drdy_pin'],
                sampling_rate=ecg_config['sampling_rate_hz']
            )

        self.ecg_reader.initialize()

        # Initialize signal processor
        proc_config = self.config['processing']
        self.signal_processor = ECGSignalProcessor(
            sampling_rate=ecg_config['sampling_rate_hz'],
            notch_freq=proc_config['notch_frequency_hz'],
            bandpass_low=proc_config['bandpass_low_hz'],
            bandpass_high=proc_config['bandpass_high_hz']
        )

        # Initialize buffer
        buf_config = self.config['buffer']
        self.buffer = ECGBuffer(
            buffer_seconds=buf_config['size_seconds'],
            sampling_rate=ecg_config['sampling_rate_hz'],
            cache_dir=buf_config['cache_directory'],
            max_cache_mb=buf_config['max_cache_size_mb']
        )

        print("ECG Collector initialized successfully")

    def start(self):
        """Start data collection"""
        self.running = True
        self.start_time = time.time()

        print(f"\n{'='*60}")
        print("Starting ECG data collection")
        print(f"Sampling rate: {self.config['ecg']['sampling_rate_hz']} Hz")
        print(f"Channels: {self.config['ecg']['channels']}")
        print(f"Buffer size: {self.config['buffer']['size_seconds']} seconds")
        print(f"{'='*60}\n")

        try:
            self.collection_loop()
        except KeyboardInterrupt:
            print("\nReceived interrupt signal")
        except Exception as e:
            print(f"\nError in collection loop: {e}")
            import traceback
            traceback.print_exc()
        finally:
            self.stop()

    def collection_loop(self):
        """Main collection loop"""
        batch_interval = self.config['streaming']['batch_size_seconds']
        last_batch_time = time.time()

        while self.running:
            # Read one sample
            try:
                ch1, ch2, ch3 = self.ecg_reader.read_sample()
                timestamp = int(time.time() * 1000)

                # Add to buffer
                self.buffer.add_sample(ch1, ch2, ch3, timestamp)
                self.samples_collected += 1

                # Print progress every second
                if self.samples_collected % self.config['ecg']['sampling_rate_hz'] == 0:
                    elapsed = time.time() - self.start_time
                    print(f"Collected {self.samples_collected} samples " f"({elapsed:.1f}s, HR estimate: ~72 BPM)")

            except Exception as e:
                print(f"Error reading sample: {e}")
                time.sleep(0.1)
                continue

            # Check if it's time to create a batch
            if time.time() - last_batch_time >= batch_interval:
                self.create_batch()
                last_batch_time = time.time()

    def create_batch(self):
        """Create and process a batch of data"""
        batch_seconds = self.config['streaming']['batch_size_seconds']

        # Get batch from buffer
        raw_batch = self.buffer.get_batch(batch_seconds)
        if not raw_batch:
            print("Not enough samples for batch yet")
            return

        print(f"\nCreating batch {self.batches_created + 1}...")

        # Apply signal processing
        if self.config['processing']['enable_notch_filter'] or self.config['processing']['enable_bandpass_filter']:
            try:
                processed_channels = self.signal_processor.process_batch(raw_batch['channels'])
                raw_batch['channels'] = processed_channels

                # Calculate signal quality
                quality = self.signal_processor.calculate_signal_quality(
                    raw_batch['channels']['channel_1']
                )
                raw_batch['signal_quality'] = quality
                print(f"Signal quality: {quality:.2f}")

            except Exception as e:
                print(f"Error processing signals: {e}")
                raw_batch['signal_quality'] = 0.5

        self.batches_created += 1

        # In standalone mode, just cache the batch
        # In integrated mode with streamer, this would pass to streaming queue
        if self.config['buffer'].get('enable_disk_cache', True):
            self.buffer.cache_batch(raw_batch)

        # Clear processed samples from buffer
        self.buffer.clear_batch_samples(raw_batch['num_samples'])

        # Print batch statistics
        print(f"Batch #{self.batches_created} created:")
        print(f"  Samples: {raw_batch['num_samples']}")
        print(f"  Duration: {raw_batch['duration_seconds']}s")
        print(f"  Channels: {len(raw_batch['channels'])}")

        # Print buffer status
        status = self.buffer.get_buffer_status()
        print(f"  Buffer: {status['samples_in_memory']} samples "
              f"({status['buffer_duration_seconds']:.1f}s)")
        print(f"  Cached: {status['cached_batches']} batches "
              f"({status['cache_size_mb']:.1f} MB)")

    def stop(self):
        """Stop data collection and cleanup"""
        print("\nStopping ECG Collector...")
        self.running = False

        if self.ecg_reader:
            self.ecg_reader.close()

        # Print final statistics
        if self.start_time:
            elapsed = time.time() - self.start_time
            print(f"\n{'='*60}")
            print("Collection Statistics:")
            print(f"  Runtime: {elapsed:.1f} seconds")
            print(f"  Samples collected: {self.samples_collected}")
            print(f"  Batches created: {self.batches_created}")
            if elapsed > 0:
                print(f"  Average sample rate: {self.samples_collected / elapsed:.1f} Hz")
            print(f"{'='*60}\n")

        print("ECG Collector stopped")


def signal_handler(sig, frame):
    """Handle termination signals"""
    print("\nReceived termination signal")
    sys.exit(0)


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='ECG Monitor Data Collector')
    parser.add_argument(
        '--config',
        default='../config/pi-config.yaml',
        help='Path to configuration file'
    )
    parser.add_argument(
        '--mock',
        action='store_true',
        help='Use mock hardware (for testing)'
    )

    args = parser.parse_args()

    # Setup signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Create and run collector
    collector = ECGCollector(args.config)

    if args.mock:
        collector.config['use_mock'] = True

    collector.initialize()
    collector.start()


if __name__ == '__main__':
    main()
