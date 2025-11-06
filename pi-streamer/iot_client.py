"""
AWS IoT Core MQTT Client

Manages connection and publishing to AWS IoT Core
"""

import json
import time
import ssl
from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient


class IoTClient:
    """AWS IoT Core MQTT client wrapper"""

    def __init__(self, endpoint, client_id, cert_path, key_path, ca_path,
                 topic_prefix="ecg"):
        """
        Initialize IoT client

        Args:
            endpoint: AWS IoT endpoint (e.g., xxx.iot.us-east-1.amazonaws.com)
            client_id: MQTT client ID (device ID)
            cert_path: Path to device certificate
            key_path: Path to device private key
            ca_path: Path to Amazon Root CA
            topic_prefix: MQTT topic prefix
        """
        self.endpoint = endpoint
        self.client_id = client_id
        self.topic_prefix = topic_prefix

        # Create MQTT client
        self.mqtt_client = AWSIoTMQTTClient(client_id)

        # Configure endpoint
        self.mqtt_client.configureEndpoint(endpoint, 8883)

        # Configure credentials
        self.mqtt_client.configureCredentials(ca_path, key_path, cert_path)

        # Configure MQTT settings
        self.mqtt_client.configureAutoReconnectBackoffTime(1, 32, 20)
        self.mqtt_client.configureOfflinePublishQueueing(-1)  # Infinite queue
        self.mqtt_client.configureDrainingFrequency(2)  # 2 Hz
        self.mqtt_client.configureConnectDisconnectTimeout(10)  # 10 sec
        self.mqtt_client.configureMQTTOperationTimeout(5)  # 5 sec

        self.connected = False

    def connect(self, retry_attempts=5):
        """
        Connect to AWS IoT Core

        Args:
            retry_attempts: Number of connection retry attempts

        Returns:
            bool: True if connected successfully
        """
        for attempt in range(retry_attempts):
            try:
                print(f"Connecting to AWS IoT Core... (attempt {attempt + 1}/{retry_attempts})")
                self.mqtt_client.connect()
                self.connected = True
                print(f"Connected to AWS IoT Core: {self.endpoint}")
                return True

            except Exception as e:
                print(f"Connection failed: {e}")
                if attempt < retry_attempts - 1:
                    wait_time = 2 ** attempt  # Exponential backoff
                    print(f"Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    print("Failed to connect after all attempts")
                    return False

    def disconnect(self):
        """Disconnect from AWS IoT Core"""
        try:
            self.mqtt_client.disconnect()
            self.connected = False
            print("Disconnected from AWS IoT Core")
        except Exception as e:
            print(f"Error disconnecting: {e}")

    def publish(self, topic_suffix, payload, qos=1):
        """
        Publish message to MQTT topic

        Args:
            topic_suffix: Topic suffix (will be prefixed)
            payload: Message payload (dict or string)
            qos: QoS level (0 or 1)

        Returns:
            bool: True if published successfully
        """
        if not self.connected:
            print("Error: Not connected to IoT Core")
            return False

        try:
            # Build full topic
            topic = f"{self.topic_prefix}/{topic_suffix}"

            # Convert payload to JSON if dict
            if isinstance(payload, dict):
                payload_str = json.dumps(payload)
            else:
                payload_str = str(payload)

            # Publish
            self.mqtt_client.publish(topic, payload_str, qos)
            print(f"Published to {topic} ({len(payload_str)} bytes)")
            return True

        except Exception as e:
            print(f"Error publishing: {e}")
            return False

    def is_connected(self):
        """Check if connected"""
        return self.connected

    def send_heartbeat(self, device_info=None):
        """
        Send device heartbeat

        Args:
            device_info: Optional dict with device status
        """
        heartbeat = {
            'timestamp': int(time.time() * 1000),
            'client_id': self.client_id,
            'status': 'online'
        }

        if device_info:
            heartbeat.update(device_info)

        return self.publish('heartbeat', heartbeat)


# Mock IoT client for testing without AWS credentials
class MockIoTClient:
    """Mock IoT client for local testing"""

    def __init__(self, **kwargs):
        self.endpoint = kwargs.get('endpoint', 'mock-endpoint')
        self.client_id = kwargs.get('client_id', 'mock-client')
        self.topic_prefix = kwargs.get('topic_prefix', 'ecg')
        self.connected = False
        self.messages_published = 0

    def connect(self, retry_attempts=5):
        """Mock connect"""
        print(f"Mock: Connecting to {self.endpoint}...")
        time.sleep(0.5)
        self.connected = True
        print("Mock: Connected successfully")
        return True

    def disconnect(self):
        """Mock disconnect"""
        print("Mock: Disconnecting...")
        self.connected = False

    def publish(self, topic_suffix, payload, qos=1):
        """Mock publish"""
        topic = f"{self.topic_prefix}/{topic_suffix}"

        if isinstance(payload, dict):
            payload_size = len(json.dumps(payload))
        else:
            payload_size = len(str(payload))

        self.messages_published += 1
        print(f"Mock: Published to {topic} ({payload_size} bytes) "
              f"[Total: {self.messages_published}]")
        return True

    def is_connected(self):
        """Mock is_connected"""
        return self.connected

    def send_heartbeat(self, device_info=None):
        """Mock heartbeat"""
        return self.publish('heartbeat', {'status': 'online'})
