"""
Connection Manager

Manages multiple transport methods with automatic fallback
Priority order: WiFi > Bluetooth > Cache
"""

from typing import List, Dict, Any, Optional
from transport_base import TransportBase, TransportType, TransportStatus
from transport_wifi import WiFiTransport
from transport_bluetooth import BluetoothTransport, MockBluetoothTransport
from transport_base import CacheTransport
import time
import threading


class ConnectionManager:
    """
    Manages multiple data transports with automatic fallback
    """

    def __init__(self, config: Dict[str, Any], buffer_manager):
        """
        Initialize connection manager

        Args:
            config: Configuration dictionary
            buffer_manager: ECGBuffer instance for caching
        """
        self.config = config
        self.buffer_manager = buffer_manager
        self.transports: List[TransportBase] = []
        self.active_transport: Optional[TransportBase] = None

        # Statistics
        self.total_batches_sent = 0
        self.total_bytes_sent = 0
        self.transport_switches = 0

        # Connection monitoring
        self.monitor_thread = None
        self.monitoring = False

        print("Connection Manager initialized")

    def add_transport(self, transport: TransportBase):
        """
        Add a transport to the manager

        Args:
            transport: Transport instance to add
        """
        self.transports.append(transport)
        # Sort by priority (highest first)
        self.transports.sort(key=lambda t: t.priority, reverse=True)
        print(f"Added transport: {transport.transport_type.value} (priority: {transport.priority})")

    def initialize_transports(self):
        """Initialize all configured transports"""
        print("\nInitializing transports...")

        # 1. Initialize WiFi transport (highest priority)
        if self.config.get('enable_wifi', True):
            aws_config = self.config.get('aws_iot', {})
            use_mock = self.config.get('use_mock', False)

            wifi = WiFiTransport(
                endpoint=aws_config.get('endpoint', ''),
                client_id=aws_config.get('client_id', 'ecg-device-001'),
                cert_path=aws_config.get('cert_path', ''),
                key_path=aws_config.get('key_path', ''),
                ca_path=aws_config.get('ca_path', ''),
                topic_prefix=aws_config.get('topic_prefix', 'ecg'),
                use_mock=use_mock,
                priority=100  # Highest
            )
            self.add_transport(wifi)

        # 2. Initialize Bluetooth transport (medium priority)
        if self.config.get('enable_bluetooth', False):
            use_mock = self.config.get('use_mock', False)

            if use_mock:
                bluetooth = MockBluetoothTransport(
                    device_name=self.config.get('bluetooth_device_name', 'ECG-Monitor'),
                    priority=50  # Medium
                )
            else:
                bluetooth = BluetoothTransport(
                    device_name=self.config.get('bluetooth_device_name', 'ECG-Monitor'),
                    priority=50  # Medium
                )

            self.add_transport(bluetooth)

        # 3. Initialize cache transport (always enabled, lowest priority)
        cache = CacheTransport(self.buffer_manager)
        self.add_transport(cache)

        print(f"Initialized {len(self.transports)} transports")

    def connect_all(self):
        """Attempt to connect all transports"""
        print("\nConnecting transports...")

        for transport in self.transports:
            print(f"Connecting {transport.transport_type.value}...")
            success = transport.connect()

            if success:
                print(f"  ✓ {transport.transport_type.value} connected")
            else:
                print(f"  ✗ {transport.transport_type.value} failed to connect")

        # Select the best available transport
        self._select_best_transport()

    def _select_best_transport(self):
        """Select the best available transport based on priority"""
        previous_transport = self.active_transport

        # Find highest priority connected transport
        for transport in self.transports:
            if transport.is_connected() and transport.is_available():
                self.active_transport = transport

                if previous_transport != transport:
                    self.transport_switches += 1
                    print(f"\n→ Active transport: {transport.transport_type.value} "
                          f"(priority: {transport.priority})")

                return

        # Fallback to cache if nothing else available
        self.active_transport = self.transports[-1]  # Cache is always last
        print("→ Active transport: CACHE (fallback)")

    def send_batch(self, batch_data: Dict[str, Any]) -> bool:
        """
        Send ECG batch using best available transport

        Args:
            batch_data: ECG batch data

        Returns:
            bool: True if sent successfully via any transport
        """
        if not self.active_transport:
            print("No active transport available")
            return False

        # Try active transport first
        success = self._try_send_with_transport(self.active_transport, batch_data)

        if success:
            self.total_batches_sent += 1
            return True

        # If active transport failed, try fallback
        print(f"Active transport failed, trying fallback...")
        self._select_best_transport()

        # Try with new active transport
        if self.active_transport:
            success = self._try_send_with_transport(self.active_transport, batch_data)
            if success:
                self.total_batches_sent += 1
                return True

        print("All transports failed")
        return False

    def _try_send_with_transport(self, transport: TransportBase,
                                  batch_data: Dict[str, Any]) -> bool:
        """
        Try to send batch with specific transport

        Args:
            transport: Transport to use
            batch_data: Data to send

        Returns:
            bool: True if sent successfully
        """
        try:
            print(f"Sending via {transport.transport_type.value}...")

            success = transport.send_batch(batch_data)

            if success:
                self.total_bytes_sent += transport.bytes_sent
                return True
            else:
                return False

        except Exception as e:
            print(f"Error sending via {transport.transport_type.value}: {e}")
            return False

    def process_cached_batches(self):
        """
        Process any cached batches when connection is restored
        Sends cached data via best available non-cache transport
        """
        # Find cache transport
        cache_transport = None
        for t in self.transports:
            if t.transport_type == TransportType.CACHE:
                cache_transport = t
                break

        if not cache_transport:
            return

        # Get cached batches
        cached = cache_transport.get_cached_batches()
        if not cached:
            return

        print(f"\nProcessing {len(cached)} cached batches...")

        # Find best non-cache transport
        best_transport = None
        for transport in self.transports:
            if (transport.transport_type != TransportType.CACHE and
                transport.is_connected() and transport.is_available()):
                best_transport = transport
                break

        if not best_transport:
            print("No online transport available for cached batches")
            return

        # Send cached batches
        sent_count = 0
        for filepath, timestamp in cached:
            # Load batch
            batch_data = cache_transport.load_cached_batch(filepath)
            if not batch_data:
                continue

            # Try to send via best transport
            success = self._try_send_with_transport(best_transport, batch_data)

            if success:
                # Delete from cache after successful send
                cache_transport.delete_cached_batch(filepath)
                sent_count += 1
                print(f"  ✓ Sent cached batch {sent_count}/{len(cached)}")
            else:
                # If one fails, stop trying (probably still offline)
                print(f"  ✗ Failed to send cached batch, stopping")
                break

        if sent_count > 0:
            print(f"Successfully sent {sent_count} cached batches")

    def start_monitoring(self, check_interval=30):
        """
        Start background thread to monitor transports

        Args:
            check_interval: Seconds between transport checks
        """
        if self.monitoring:
            return

        self.monitoring = True
        self.monitor_thread = threading.Thread(
            target=self._monitor_transports,
            args=(check_interval,),
            daemon=True
        )
        self.monitor_thread.start()
        print(f"Started transport monitoring (every {check_interval}s)")

    def _monitor_transports(self, check_interval):
        """
        Background thread to monitor transport availability

        Args:
            check_interval: Seconds between checks
        """
        while self.monitoring:
            time.sleep(check_interval)

            # Check all transports and switch if needed
            self._select_best_transport()

            # Try to send cached data if we're online
            if (self.active_transport and
                self.active_transport.transport_type != TransportType.CACHE):
                self.process_cached_batches()

    def stop_monitoring(self):
        """Stop transport monitoring thread"""
        self.monitoring = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=5)
        print("Stopped transport monitoring")

    def disconnect_all(self):
        """Disconnect all transports"""
        print("\nDisconnecting transports...")

        for transport in self.transports:
            try:
                transport.disconnect()
                print(f"  ✓ {transport.transport_type.value} disconnected")
            except Exception as e:
                print(f"  ✗ Error disconnecting {transport.transport_type.value}: {e}")

        self.active_transport = None

    def get_status(self) -> Dict[str, Any]:
        """Get connection manager status"""
        return {
            'active_transport': self.active_transport.transport_type.value if self.active_transport else None,
            'total_batches_sent': self.total_batches_sent,
            'total_bytes_sent': self.total_bytes_sent,
            'transport_switches': self.transport_switches,
            'transports': [t.get_status() for t in self.transports]
        }

    def print_status(self):
        """Print detailed status information"""
        print("\n" + "="*60)
        print("CONNECTION MANAGER STATUS")
        print("="*60)

        status = self.get_status()

        print(f"\nActive Transport: {status['active_transport']}")
        print(f"Total Batches Sent: {status['total_batches_sent']}")
        print(f"Total Bytes Sent: {status['total_bytes_sent']:,}")
        print(f"Transport Switches: {status['transport_switches']}")

        print("\nTransport Details:")
        for t_status in status['transports']:
            print(f"\n  {t_status['type'].upper()}:")
            print(f"    Status: {t_status['status']}")
            print(f"    Priority: {t_status['priority']}")
            print(f"    Messages: {t_status['messages_sent']}")
            print(f"    Bytes: {t_status['bytes_sent']:,}")
            print(f"    Errors: {t_status['errors']}")

        print("="*60 + "\n")
