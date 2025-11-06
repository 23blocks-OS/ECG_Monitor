"""
WiFi Transport

Sends data to AWS IoT Core via WiFi/MQTT
"""

from typing import Dict, Any
from transport_base import TransportBase, TransportType, TransportStatus
from iot_client import IoTClient, MockIoTClient
import json


class WiFiTransport(TransportBase):
    """WiFi transport using AWS IoT Core MQTT"""

    def __init__(self, endpoint, client_id, cert_path, key_path, ca_path,
                 topic_prefix="ecg", use_mock=False, priority=100):
        """
        Initialize WiFi transport

        Args:
            endpoint: AWS IoT endpoint
            client_id: MQTT client ID
            cert_path: Path to device certificate
            key_path: Path to device private key
            ca_path: Path to Amazon Root CA
            topic_prefix: MQTT topic prefix
            use_mock: Use mock client for testing
            priority: Priority level (default 100 = highest)
        """
        super().__init__(TransportType.WIFI, priority=priority)

        # Create IoT client
        if use_mock:
            self.iot_client = MockIoTClient(
                endpoint=endpoint,
                client_id=client_id,
                topic_prefix=topic_prefix
            )
        else:
            self.iot_client = IoTClient(
                endpoint=endpoint,
                client_id=client_id,
                cert_path=cert_path,
                key_path=key_path,
                ca_path=ca_path,
                topic_prefix=topic_prefix
            )

        self.device_id = client_id

    def connect(self) -> bool:
        """
        Connect to AWS IoT Core

        Returns:
            bool: True if connected successfully
        """
        self.status = TransportStatus.CONNECTING

        try:
            success = self.iot_client.connect(retry_attempts=3)
            if success:
                self.status = TransportStatus.CONNECTED
                print(f"WiFi transport connected to AWS IoT Core")
                return True
            else:
                self.status = TransportStatus.ERROR
                self._record_error()
                return False

        except Exception as e:
            print(f"WiFi transport connection error: {e}")
            self.status = TransportStatus.ERROR
            self._record_error()
            return False

    def disconnect(self) -> bool:
        """
        Disconnect from AWS IoT Core

        Returns:
            bool: True if disconnected successfully
        """
        try:
            self.iot_client.disconnect()
            self.status = TransportStatus.DISCONNECTED
            return True

        except Exception as e:
            print(f"WiFi transport disconnect error: {e}")
            return False

    def send_batch(self, batch_data: Dict[str, Any]) -> bool:
        """
        Send ECG batch via MQTT

        Args:
            batch_data: ECG batch data

        Returns:
            bool: True if sent successfully
        """
        if not self.is_connected():
            print("WiFi transport not connected")
            self._record_error()
            return False

        try:
            # Publish to MQTT topic: ecg/{device_id}/data
            topic_suffix = f"{self.device_id}/data"
            success = self.iot_client.publish(topic_suffix, batch_data, qos=1)

            if success:
                # Estimate size
                size = len(json.dumps(batch_data))
                self._record_success(size)
                return True
            else:
                self._record_error()
                return False

        except Exception as e:
            print(f"WiFi transport send error: {e}")
            self._record_error()
            return False

    def is_available(self) -> bool:
        """
        Check if WiFi is available

        Returns:
            bool: True if WiFi connection is active
        """
        # Try to check if IoT client is connected
        try:
            return self.iot_client.is_connected()
        except:
            return False

    def send_heartbeat(self, device_info=None) -> bool:
        """
        Send heartbeat signal

        Args:
            device_info: Optional device status info

        Returns:
            bool: True if sent successfully
        """
        if not self.is_connected():
            return False

        try:
            return self.iot_client.send_heartbeat(device_info)
        except Exception as e:
            print(f"Heartbeat error: {e}")
            return False
