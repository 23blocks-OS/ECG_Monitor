#!/usr/bin/env python3
"""
ECG Monitor - Multi-Transport Streamer

Main script for collecting and streaming ECG data
Supports WiFi, Bluetooth, and offline caching
"""

import sys
import time
import signal
import argparse
import yaml
from pathlib import Path

# Add pi-collector to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / 'pi-collector'))

# Import collector components
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

# Import streaming components
from connection_manager import ConnectionManager


class ECGStreamingCollector:
    """
    ECG data collector with multi-transport streaming
    """

    def __init__(self, config_path):
        """
        Initialize collector and streamer

        Args:
            config_path: Path to configuration YAML file
        """
        self.config = self.load_config(config_path)
        self.running = False

        # Core components
        self.ecg_reader = None
        self.signal_processor = None
        self.buffer = None
        self.connection_manager = None

        # Statistics
        self.samples_collected = 0
        self.batches_created = 0
        self.batches_sent = 0
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
        print("\n" + "="*60)
        print("ECG MULTI-TRANSPORT STREAMING COLLECTOR")
        print("="*60 + "\n")

        # Determine if we should use mock hardware
        use_mock = not HARDWARE_AVAILABLE or self.config.get('use_mock', False)

        # 1. Initialize ECG reader
        print("Initializing ECG reader...")
        hw_config = self.config['hardware']
        ecg_config = self.config['ecg']

        if use_mock:
            print("  Using MOCK ECG reader (no hardware)")
            self.ecg_reader = MockCJMCU1293(
                sampling_rate=ecg_config['sampling_rate_hz']
            )
        else:
            print("  Using REAL CJMCU-1293 hardware")
            self.ecg_reader = CJMCU1293(
                spi_bus=hw_config['spi_bus'],
                spi_device=hw_config['spi_device'],
                spi_speed_hz=hw_config['spi_speed_hz'],
                gpio_reset=hw_config['gpio_reset_pin'],
                gpio_drdy=hw_config['gpio_drdy_pin'],
                sampling_rate=ecg_config['sampling_rate_hz']
            )

        self.ecg_reader.initialize()

        # 2. Initialize signal processor
        print("Initializing signal processor...")
        proc_config = self.config['processing']
        self.signal_processor = ECGSignalProcessor(
            sampling_rate=ecg_config['sampling_rate_hz'],
            notch_freq=proc_config['notch_frequency_hz'],
            bandpass_low=proc_config['bandpass_low_hz'],
            bandpass_high=proc_config['bandpass_high_hz']
        )

        # 3. Initialize buffer
        print("Initializing buffer...")
        buf_config = self.config['buffer']
        self.buffer = ECGBuffer(
            buffer_seconds=buf_config['size_seconds'],
            sampling_rate=ecg_config['sampling_rate_hz'],
            cache_dir=buf_config['cache_directory'],
            max_cache_mb=buf_config['max_cache_size_mb']
        )

        # 4. Initialize connection manager with transports
        print("Initializing connection manager...")
        self.connection_manager = ConnectionManager(self.config, self.buffer)
        self.connection_manager.initialize_transports()

        # 5. Connect all transports
        self.connection_manager.connect_all()

        # 6. Start transport monitoring
        self.connection_manager.start_monitoring(check_interval=30)

        print("\n✓ All components initialized successfully\n")

    def start(self):
        """Start data collection and streaming"""
        self.running = True
        self.start_time = time.time()

        print("="*60)
        print("STARTING ECG DATA COLLECTION & STREAMING")
        print("="*60)
        print(f"Sampling rate: {self.config['ecg']['sampling_rate_hz']} Hz")
        print(f"Channels: {self.config['ecg']['channels']}")
        print(f"Batch interval: {self.config['streaming']['batch_size_seconds']}s")
        print(f"WiFi: {'Enabled' if self.config.get('enable_wifi', True) else 'Disabled'}")
        print(f"Bluetooth: {'Enabled' if self.config.get('enable_bluetooth', False) else 'Disabled'}")
        print("="*60 + "\n")

        try:
            self.collection_loop()
        except KeyboardInterrupt:
            print("\n\nReceived interrupt signal")
        except Exception as e:
            print(f"\nError in collection loop: {e}")
            import traceback
            traceback.print_exc()
        finally:
            self.stop()

    def collection_loop(self):
        """Main collection and streaming loop"""
        batch_interval = self.config['streaming']['batch_size_seconds']
        last_batch_time = time.time()
        last_status_time = time.time()

        while self.running:
            # Read one sample
            try:
                ch1, ch2, ch3 = self.ecg_reader.read_sample()
                timestamp = int(time.time() * 1000)

                # Add to buffer
                self.buffer.add_sample(ch1, ch2, ch3, timestamp)
                self.samples_collected += 1

            except Exception as e:
                print(f"Error reading sample: {e}")
                time.sleep(0.1)
                continue

            # Check if it's time to create and send a batch
            current_time = time.time()
            if current_time - last_batch_time >= batch_interval:
                self.create_and_send_batch()
                last_batch_time = current_time

            # Print status every 10 seconds
            if current_time - last_status_time >= 10:
                self.print_progress()
                last_status_time = current_time

    def create_and_send_batch(self):
        """Create batch and send via connection manager"""
        batch_seconds = self.config['streaming']['batch_size_seconds']

        # Get batch from buffer
        raw_batch = self.buffer.get_batch(batch_seconds)
        if not raw_batch:
            print("Not enough samples for batch yet")
            return

        self.batches_created += 1

        # Apply signal processing
        if (self.config['processing']['enable_notch_filter'] or
            self.config['processing']['enable_bandpass_filter']):
            try:
                processed_channels = self.signal_processor.process_batch(
                    raw_batch['channels']
                )
                raw_batch['channels'] = processed_channels

                # Calculate signal quality
                quality = self.signal_processor.calculate_signal_quality(
                    raw_batch['channels']['channel_1']
                )
                raw_batch['signal_quality'] = quality

            except Exception as e:
                print(f"Error processing signals: {e}")
                raw_batch['signal_quality'] = 0.5

        # Add batch metadata
        raw_batch['batch_id'] = f"batch_{int(time.time()*1000)}"

        # Send via connection manager (handles transport selection)
        success = self.connection_manager.send_batch(raw_batch)

        if success:
            self.batches_sent += 1
            # Clear processed samples from buffer only if sent successfully
            # (or cached for later)
            self.buffer.clear_batch_samples(raw_batch['num_samples'])

    def print_progress(self):
        """Print collection progress"""
        elapsed = time.time() - self.start_time
        sample_rate = self.samples_collected / elapsed if elapsed > 0 else 0

        print(f"\n[{time.strftime('%H:%M:%S')}] Progress:")
        print(f"  Samples: {self.samples_collected} ({sample_rate:.1f} Hz)")
        print(f"  Batches: {self.batches_created} created, {self.batches_sent} sent")
        print(f"  Runtime: {elapsed:.1f}s")

    def stop(self):
        """Stop data collection and cleanup"""
        print("\n\nStopping ECG Streaming Collector...")
        self.running = False

        # Stop monitoring
        if self.connection_manager:
            self.connection_manager.stop_monitoring()

        # Close hardware
        if self.ecg_reader:
            self.ecg_reader.close()

        # Print final statistics
        if self.start_time:
            self.print_final_stats()

        # Disconnect all transports
        if self.connection_manager:
            self.connection_manager.disconnect_all()

        print("\nECG Streaming Collector stopped")

    def print_final_stats(self):
        """Print final statistics"""
        elapsed = time.time() - self.start_time

        print("\n" + "="*60)
        print("FINAL STATISTICS")
        print("="*60)
        print(f"\nRuntime: {elapsed:.1f} seconds ({elapsed/60:.1f} minutes)")
        print(f"Samples collected: {self.samples_collected:,}")
        print(f"Batches created: {self.batches_created}")
        print(f"Batches sent: {self.batches_sent}")

        if elapsed > 0:
            print(f"Average sample rate: {self.samples_collected / elapsed:.1f} Hz")
            print(f"Batch rate: {self.batches_created / elapsed * 60:.1f} batches/min")

        # Print connection manager statistics
        if self.connection_manager:
            print("\n")
            self.connection_manager.print_status()

        # Print buffer status
        if self.buffer:
            status = self.buffer.get_buffer_status()
            print("\nBuffer Status:")
            print(f"  In-memory samples: {status['samples_in_memory']}")
            print(f"  Cached batches: {status['cached_batches']}")
            print(f"  Cache size: {status['cache_size_mb']:.1f} MB")

        print("="*60 + "\n")


def signal_handler(sig, frame):
    """Handle termination signals"""
    print("\nReceived termination signal")
    sys.exit(0)


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='ECG Monitor - Multi-Transport Streaming Collector'
    )
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
    parser.add_argument(
        '--enable-bluetooth',
        action='store_true',
        help='Enable Bluetooth transport'
    )
    parser.add_argument(
        '--disable-wifi',
        action='store_true',
        help='Disable WiFi transport (test Bluetooth/cache only)'
    )

    args = parser.parse_args()

    # Setup signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Create and configure collector
    collector = ECGStreamingCollector(args.config)

    # Apply command-line overrides
    if args.mock:
        collector.config['use_mock'] = True

    if args.enable_bluetooth:
        collector.config['enable_bluetooth'] = True

    if args.disable_wifi:
        collector.config['enable_wifi'] = False

    # Initialize and start
    collector.initialize()
    collector.start()


if __name__ == '__main__':
    main()
