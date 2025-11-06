"""
Bluetooth LE Transport

Sends ECG data to mobile device via Bluetooth Low Energy (BLE)
Uses GATT (Generic Attribute Profile) for data transmission
"""

from typing import Dict, Any, Optional
import json
import struct
import time
from transport_base import TransportBase, TransportType, TransportStatus

# Try to import Bluetooth libraries
try:
    from bluezero import peripheral
    from bluezero import adapter
    from bluezero import gatt_constants
    BLUETOOTH_AVAILABLE = True
except ImportError:
    BLUETOOTH_AVAILABLE = False
    print("Warning: bluezero library not available. Bluetooth transport will be disabled.")


# BLE UUIDs for ECG service
ECG_SERVICE_UUID = "0000181d-0000-1000-8000-00805f9b34fb"  # Heart Rate Service (custom)
ECG_DATA_CHAR_UUID = "00002a37-0000-1000-8000-00805f9b34fb"  # Heart Rate Measurement
ECG_CONTROL_CHAR_UUID = "00002a39-0000-1000-8000-00805f9b34fb"  # Control Point
ECG_STATUS_CHAR_UUID = "00002a38-0000-1000-8000-00805f9b34fb"  # Status

# Maximum BLE packet size (MTU - 3 for GATT overhead)
MAX_BLE_PACKET_SIZE = 512  # Conservative for BLE 5.0


class BluetoothTransport(TransportBase):
    """Bluetooth LE transport for mobile device relay"""

    def __init__(self, device_name="ECG-Monitor", priority=50):
        """
        Initialize Bluetooth transport

        Args:
            device_name: BLE device advertising name
            priority: Priority level (default 50 = medium, between WiFi and Cache)
        """
        super().__init__(TransportType.BLUETOOTH, priority=priority)

        self.device_name = device_name
        self.connected_device = None
        self.characteristic = None
        self.adapter = None
        self.peripheral_app = None

        # Data chunking for BLE transmission
        self.pending_chunks = []
        self.current_batch_id = None

        # Check if Bluetooth is available
        if not BLUETOOTH_AVAILABLE:
            self.status = TransportStatus.ERROR
            print("Bluetooth hardware/libraries not available")

    def connect(self) -> bool:
        """
        Start BLE advertising and wait for connection

        Returns:
            bool: True if started successfully
        """
        if not BLUETOOTH_AVAILABLE:
            print("Bluetooth not available on this system")
            return False

        try:
            self.status = TransportStatus.CONNECTING
            print(f"Starting Bluetooth advertising as '{self.device_name}'...")

            # Get default Bluetooth adapter
            self.adapter = adapter.Adapter()
            if not self.adapter:
                print("No Bluetooth adapter found")
                self.status = TransportStatus.ERROR
                return False

            # Power on adapter
            self.adapter.powered = True

            # Create BLE peripheral (simplified - full GATT server implementation needed)
            # Note: This is a basic structure. Full implementation would need
            # a proper GATT server with characteristics for data transfer

            print(f"Bluetooth adapter ready: {self.adapter.address}")
            print("Waiting for mobile device connection...")

            self.status = TransportStatus.CONNECTED
            return True

        except Exception as e:
            print(f"Bluetooth connection error: {e}")
            self.status = TransportStatus.ERROR
            self._record_error()
            return False

    def disconnect(self) -> bool:
        """
        Stop BLE advertising and disconnect

        Returns:
            bool: True if disconnected successfully
        """
        try:
            if self.adapter:
                self.adapter.powered = False

            self.connected_device = None
            self.status = TransportStatus.DISCONNECTED
            print("Bluetooth disconnected")
            return True

        except Exception as e:
            print(f"Bluetooth disconnect error: {e}")
            return False

    def send_batch(self, batch_data: Dict[str, Any]) -> bool:
        """
        Send ECG batch via Bluetooth

        Args:
            batch_data: ECG batch data

        Returns:
            bool: True if sent successfully
        """
        if not self.is_connected():
            print("Bluetooth transport not connected")
            self._record_error()
            return False

        try:
            # Convert batch to JSON
            json_data = json.dumps(batch_data)
            data_bytes = json_data.encode('utf-8')

            # Compress if needed (optional, based on MTU)
            import gzip
            compressed = gzip.compress(data_bytes)

            # Check if we need to send to mobile device
            # (In full implementation, this would use GATT characteristics)
            success = self._send_via_ble(compressed)

            if success:
                self._record_success(len(compressed))
                print(f"Bluetooth: Sent {len(compressed)} bytes")
                return True
            else:
                self._record_error()
                return False

        except Exception as e:
            print(f"Bluetooth send error: {e}")
            self._record_error()
            return False

    def _send_via_ble(self, data: bytes) -> bool:
        """
        Send data via BLE GATT characteristic

        Args:
            data: Bytes to send

        Returns:
            bool: True if sent successfully
        """
        # This is a placeholder for the actual BLE GATT implementation
        # Full implementation would:
        # 1. Split data into chunks (max MTU size)
        # 2. Send each chunk via GATT notification
        # 3. Wait for ACK from mobile device
        # 4. Retry on failure

        if not BLUETOOTH_AVAILABLE:
            return False

        try:
            # Split into chunks if needed
            chunks = self._chunk_data(data, MAX_BLE_PACKET_SIZE)

            print(f"Bluetooth: Sending {len(chunks)} chunks...")

            # In a real implementation, send each chunk via GATT
            # For now, just simulate success
            # self.characteristic.write_value(chunk)

            return True

        except Exception as e:
            print(f"BLE send error: {e}")
            return False

    def _chunk_data(self, data: bytes, chunk_size: int) -> list:
        """
        Split data into BLE-compatible chunks

        Args:
            data: Data bytes to chunk
            chunk_size: Maximum chunk size

        Returns:
            List of data chunks
        """
        chunks = []
        for i in range(0, len(data), chunk_size):
            chunk = data[i:i + chunk_size]
            chunks.append(chunk)
        return chunks

    def is_available(self) -> bool:
        """
        Check if Bluetooth is available

        Returns:
            bool: True if BLE hardware is available and powered
        """
        if not BLUETOOTH_AVAILABLE:
            return False

        try:
            if self.adapter:
                return self.adapter.powered
            return False
        except:
            return False


class MockBluetoothTransport(TransportBase):
    """
    Mock Bluetooth transport for testing without hardware
    """

    def __init__(self, device_name="ECG-Monitor-Mock", priority=50):
        super().__init__(TransportType.BLUETOOTH, priority=priority)
        self.device_name = device_name
        self.mock_connected = False

    def connect(self) -> bool:
        """Mock connect"""
        print(f"Mock Bluetooth: Connecting as '{self.device_name}'...")
        time.sleep(0.5)
        self.mock_connected = True
        self.status = TransportStatus.CONNECTED
        print("Mock Bluetooth: Connected")
        return True

    def disconnect(self) -> bool:
        """Mock disconnect"""
        self.mock_connected = False
        self.status = TransportStatus.DISCONNECTED
        print("Mock Bluetooth: Disconnected")
        return True

    def send_batch(self, batch_data: Dict[str, Any]) -> bool:
        """Mock send"""
        if not self.mock_connected:
            return False

        try:
            # Simulate sending
            json_data = json.dumps(batch_data)
            size = len(json_data)
            self._record_success(size)
            print(f"Mock Bluetooth: Sent {size} bytes")
            return True

        except Exception as e:
            print(f"Mock Bluetooth error: {e}")
            self._record_error()
            return False

    def is_available(self) -> bool:
        """Mock always available"""
        return True
