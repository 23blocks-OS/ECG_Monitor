# ECG Cloud Streamer (Raspberry Pi)

Streams cached ECG data to AWS IoT Core via MQTT.

## Features

- AWS IoT Core MQTT connection
- Automatic reconnection with exponential backoff
- Data compression (gzip + base64)
- Offline buffering (processes cached batches)
- Heartbeat monitoring
- Retry logic for failed transmissions

## Setup

### 1. Install Dependencies

```bash
cd pi-streamer
pip install -r requirements.txt
```

### 2. Configure AWS IoT Device

First, create IoT Thing and download certificates:

```bash
# Using Terraform (recommended)
cd ../terraform/environments/poc
terraform apply

# Or use AWS CLI
aws iot create-thing --thing-name ecg-device-001
aws iot create-keys-and-certificate --set-as-active \
  --certificate-pem-outfile device.crt \
  --public-key-outfile device.public.key \
  --private-key-outfile device.key
```

### 3. Copy Certificates

```bash
mkdir -p ~/certs
cp device.crt ~/certs/
cp device.key ~/certs/
wget https://www.amazontrust.com/repository/AmazonRootCA1.pem -O ~/certs/AmazonRootCA1.pem
```

### 4. Update Configuration

Edit `../config/pi-config.yaml`:

```yaml
aws_iot:
  endpoint: "your-endpoint.iot.us-east-1.amazonaws.com"
  client_id: "ecg-device-001"
  topic_prefix: "ecg/device001"
  cert_path: "/home/pi/certs/device.crt"
  key_path: "/home/pi/certs/device.key"
  ca_path: "/home/pi/certs/AmazonRootCA1.pem"
```

Get your IoT endpoint:
```bash
aws iot describe-endpoint --endpoint-type iot:Data-ATS
```

## Usage

### Real Mode (with AWS)

```bash
python3 main.py --config ../config/pi-config.yaml
```

### Mock Mode (Testing)

```bash
python3 main.py --mock
```

## Integration with Collector

In production, run both collector and streamer:

```bash
# Terminal 1: Collector
cd ../pi-collector
python3 main.py

# Terminal 2: Streamer
cd ../pi-streamer
python3 main.py
```

## Data Flow

1. Collector writes batches to disk cache (`/var/ecg_cache/`)
2. Streamer reads cached batches
3. Compresses with gzip (~60-70% reduction)
4. Publishes to `ecg/device001/data` topic
5. Deletes from cache after successful transmission

## Offline Behavior

- Batches cached to disk when offline
- Up to 500 MB cache (~9 days of data)
- Automatic recovery when connection restored
- FIFO processing (oldest first)

## Topics

- **Data:** `ecg/{client_id}/data` - ECG batches
- **Heartbeat:** `ecg/{client_id}/heartbeat` - Device status (every 60s)
- **Control:** `ecg/{client_id}/control` - Commands (future)

## Monitoring

Check connection status:
```bash
# View logs
tail -f /var/log/ecg_monitor.log

# Check IoT Core
aws iot list-things
aws iot-data get-thing-shadow --thing-name ecg-device-001
```

## Troubleshooting

### Connection Failed

```bash
# Check certificates
ls -la ~/certs/

# Test MQTT connection
mosquitto_pub -h your-endpoint.iot.us-east-1.amazonaws.com -p 8883 \
  --cafile ~/certs/AmazonRootCA1.pem \
  --cert ~/certs/device.crt \
  --key ~/certs/device.key \
  -t test/topic -m "test"
```

### Permission Denied

```bash
# Check IoT policy attached to certificate
aws iot list-principal-policies --principal <certificate-arn>
```

## Files

- `main.py` - Main streamer script
- `iot_client.py` - AWS IoT Core MQTT client
- `data_compressor.py` - Batch compression
- `requirements.txt` - Python dependencies
