"""
Transport Base Classes

Abstract base for different data transport methods (WiFi, Bluetooth, etc.)
"""

from abc import ABC, abstractmethod
from enum import Enum
from typing import Dict, Optional, Any
import time


class TransportType(Enum):
    """Transport type enumeration"""
    WIFI = "wifi"
    BLUETOOTH = "bluetooth"
    CACHE = "cache"


class TransportStatus(Enum):
    """Transport connection status"""
    CONNECTED = "connected"
    CONNECTING = "connecting"
    DISCONNECTED = "disconnected"
    ERROR = "error"


class TransportBase(ABC):
    """Abstract base class for data transports"""

    def __init__(self, transport_type: TransportType, priority: int = 0):
        """
        Initialize transport

        Args:
            transport_type: Type of transport
            priority: Priority level (higher = preferred, 0 = lowest)
        """
        self.transport_type = transport_type
        self.priority = priority
        self.status = TransportStatus.DISCONNECTED
        self.last_send_time = 0
        self.bytes_sent = 0
        self.messages_sent = 0
        self.errors = 0

    @abstractmethod
    def connect(self) -> bool:
        """
        Establish connection

        Returns:
            bool: True if connected successfully
        """
        pass

    @abstractmethod
    def disconnect(self) -> bool:
        """
        Close connection

        Returns:
            bool: True if disconnected successfully
        """
        pass

    @abstractmethod
    def send_batch(self, batch_data: Dict[str, Any]) -> bool:
        """
        Send ECG data batch

        Args:
            batch_data: Dict containing ECG batch data

        Returns:
            bool: True if sent successfully
        """
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """
        Check if transport is available for use

        Returns:
            bool: True if transport can be used
        """
        pass

    def is_connected(self) -> bool:
        """Check if transport is connected"""
        return self.status == TransportStatus.CONNECTED

    def get_status(self) -> Dict[str, Any]:
        """Get transport status information"""
        return {
            'type': self.transport_type.value,
            'status': self.status.value,
            'priority': self.priority,
            'bytes_sent': self.bytes_sent,
            'messages_sent': self.messages_sent,
            'errors': self.errors,
            'last_send_time': self.last_send_time
        }

    def _record_success(self, num_bytes: int):
        """Record successful transmission"""
        self.bytes_sent += num_bytes
        self.messages_sent += 1
        self.last_send_time = time.time()

    def _record_error(self):
        """Record transmission error"""
        self.errors += 1


class CacheTransport(TransportBase):
    """
    Cache transport for offline storage
    Always available as fallback
    """

    def __init__(self, buffer_manager):
        """
        Initialize cache transport

        Args:
            buffer_manager: ECGBuffer instance for caching
        """
        super().__init__(TransportType.CACHE, priority=1)  # Lowest priority
        self.buffer_manager = buffer_manager
        self.status = TransportStatus.CONNECTED  # Always "connected"

    def connect(self) -> bool:
        """Cache is always available"""
        self.status = TransportStatus.CONNECTED
        return True

    def disconnect(self) -> bool:
        """Cache doesn't disconnect"""
        return True

    def send_batch(self, batch_data: Dict[str, Any]) -> bool:
        """
        Cache batch to disk

        Args:
            batch_data: ECG batch data

        Returns:
            bool: True if cached successfully
        """
        try:
            success = self.buffer_manager.cache_batch(batch_data)
            if success:
                # Estimate size (rough approximation)
                import json
                size = len(json.dumps(batch_data))
                self._record_success(size)
                return True
            else:
                self._record_error()
                return False

        except Exception as e:
            print(f"Cache transport error: {e}")
            self._record_error()
            return False

    def is_available(self) -> bool:
        """Cache is always available if buffer manager is enabled"""
        return self.buffer_manager.cache_enabled

    def get_cached_batches(self):
        """Get list of cached batches"""
        return self.buffer_manager.get_cached_batches()

    def load_cached_batch(self, filepath):
        """Load a cached batch"""
        return self.buffer_manager.load_cached_batch(filepath)

    def delete_cached_batch(self, filepath):
        """Delete a cached batch after successful transmission"""
        return self.buffer_manager.delete_cached_batch(filepath)
