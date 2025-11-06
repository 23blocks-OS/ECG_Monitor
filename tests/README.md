# ECG Monitor Testing

Complete testing suite for the ECG Monitor system, including test data generation, simulators, and end-to-end integration tests.

---

## Directory Structure

```
tests/
├── data/                   # Test ECG data files
│   ├── generate_test_data.py
│   ├── normal_sinus_rhythm.json
│   ├── with_pvc.json
│   ├── atrial_fibrillation.json
│   ├── tachycardia.json
│   └── normal_sequence_*.json
├── simulators/             # Data injection simulators
│   └── ecg_system_simulator.py
├── integration/            # Integration tests
│   └── test_end_to_end.sh
└── README.md              # This file
```

---

## Test Data

### Generate Test Data

Creates realistic ECG waveforms for testing:

```bash
# Generate all test datasets
python3 tests/data/generate_test_data.py
```

**Generated files:**
- `normal_sinus_rhythm.json` - Normal heart rhythm (72 BPM)
- `with_pvc.json` - ECG with premature ventricular contractions
- `atrial_fibrillation.json` - AFib pattern (irregular R-R intervals)
- `tachycardia.json` - Fast heart rate (150 BPM)
- `normal_sequence_00.json` through `09.json` - 10 sequential normal batches

**Data format:**
Each file contains a complete 10-second ECG batch:
```json
{
  "device_id": "ecg-device-001",
  "batch_id": "test-1699123456789",
  "start_timestamp": 1699123456789,
  "end_timestamp": 1699123466789,
  "duration_seconds": 10,
  "sample_rate": 250,
  "num_samples": 2500,
  "channels": {
    "channel_1": [<2500 samples>],
    "channel_2": [<2500 samples>],
    "channel_3": [<2500 samples>]
  },
  "signal_quality": 0.85
}
```

### Customize Test Data

Edit `generate_test_data.py` to:
- Change heart rate
- Add different arrhythmias
- Adjust signal quality
- Create longer sequences

---

## System Simulator

### Overview

The simulator mimics the complete Raspberry Pi → AWS data flow:
1. Loads test ECG data
2. Compresses (gzip + base64)
3. Publishes to AWS IoT Core via MQTT
4. Waits for Lambda processing
5. Verifies data in S3, DynamoDB, and API

### Prerequisites

```bash
# Install dependencies
pip3 install boto3 AWSIoTPythonSDK requests pyyaml
```

### Basic Usage

```bash
# Simulate normal sinus rhythm
python3 tests/simulators/ecg_system_simulator.py \
    --scenario normal_sinus_rhythm \
    --cert ~/certs/device.crt \
    --key ~/certs/device.key \
    --ca ~/certs/AmazonRootCA1.pem
```

### Scenarios

```bash
# Test different heart conditions
python3 tests/simulators/ecg_system_simulator.py --scenario normal_sinus_rhythm
python3 tests/simulators/ecg_system_simulator.py --scenario with_pvc
python3 tests/simulators/ecg_system_simulator.py --scenario atrial_fibrillation
python3 tests/simulators/ecg_system_simulator.py --scenario tachycardia
```

### Without IoT Certificates

Test without publishing to IoT (checks existing data only):

```bash
python3 tests/simulators/ecg_system_simulator.py --scenario normal_sinus_rhythm
```

### What the Simulator Checks

1. **IoT Publishing** - Connects and publishes to `ecg/device001/data`
2. **S3 Storage** - Verifies raw data in `ecg-monitor-poc-raw-data`
3. **DynamoDB** - Checks `ecg-monitor-poc-sessions` table
4. **API Endpoints** - Tests `/api/live` response

### Expected Output

```
==========================================================
ECG System Simulator
==========================================================

1. Loading test data: normal_sinus_rhythm
✓ Loaded batch:
  Device: ecg-device-001
  Samples: 2500
  Duration: 10s

2. Publishing to AWS IoT Core
Setting up IoT client...
Connecting to xxxxx.iot.us-east-1.amazonaws.com...
✓ Connected to AWS IoT Core
Publishing to ecg/device001/data...
  Original size: 65432 bytes
  Compressed size: 18234 bytes
✓ Published successfully

3. Waiting for Lambda processing...
   Pipeline: IoT → S3 → SQS → Preprocessor → AI Analyzer

4. Verifying data in AWS

Checking S3 bucket: ecg-monitor-poc-raw-data...
✓ Found 5 objects in S3
  2024/11/06/12/batch_1699271234567.json.gz (18234 bytes)

Checking DynamoDB table: ecg-monitor-poc-sessions...
✓ Found 1 items in DynamoDB
  Session: ecg-device-001
    Last update: 1699271234567
    Heart rate: 72

==========================================================
Simulation Summary
==========================================================
S3 Storage: ✓
DynamoDB: ✓
API: ✓

✓ Simulation completed successfully!
```

---

## Integration Tests

### End-to-End Test Script

Tests the entire system after deployment:

```bash
./tests/integration/test_end_to_end.sh
```

### What It Tests

1. **AWS Resources** - Verifies Lambda, DynamoDB, S3 exist
2. **API Endpoints** - Tests `/api/live` and `/api/alerts`
3. **Data Injection** - Publishes test data to IoT Core
4. **Processing Pipeline** - Waits and checks Lambda execution
5. **Data Storage** - Verifies S3 and DynamoDB have data
6. **Dashboard** - Checks CloudFront accessibility

### Expected Output

```
==========================================
ECG Monitor - End-to-End Integration Test
==========================================

Getting deployment information...
✓ Deployment found
  IoT Endpoint: xxxxx.iot.us-east-1.amazonaws.com
  API URL: https://xxxxx.execute-api.us-east-1.amazonaws.com/v1

==========================================
Test 1: Verify AWS Resources
==========================================

Checking Lambda functions...
✓ Found 4 Lambda functions
Checking DynamoDB tables...
✓ Found 3 DynamoDB tables
Checking S3 buckets...
✓ Found 3 S3 buckets

==========================================
Test 2: Test API Endpoints
==========================================

Testing GET /api/live...
✓ API /live endpoint working (HTTP 200)
ecg-device-001
active
72

Testing GET /api/alerts...
✓ API /alerts endpoint working (HTTP 200)

==========================================
Test Summary
==========================================

Passed: 6/6 tests

✓ All tests passed!

Your ECG Monitor system is fully functional!
Dashboard: https://xxxxx.cloudfront.net
```

---

## Manual Testing Workflows

### Workflow 1: Test Data Generation Only

```bash
# Generate test data
python3 tests/data/generate_test_data.py

# View the data
cat tests/data/normal_sinus_rhythm.json | jq '.channels.channel_1[:10]'
```

### Workflow 2: Simulate Without Publishing

```bash
# Check existing AWS data (doesn't publish new data)
python3 tests/simulators/ecg_system_simulator.py --scenario normal_sinus_rhythm
```

### Workflow 3: Full Simulation with Real IoT

```bash
# 1. Ensure certificates are setup
ls ~/certs/device.crt

# 2. Run simulator
python3 tests/simulators/ecg_system_simulator.py \
    --scenario with_pvc \
    --cert ~/certs/device.crt \
    --key ~/certs/device.key \
    --ca ~/certs/AmazonRootCA1.pem

# 3. Wait for email alert (if PVC triggers medium severity)

# 4. Check dashboard
open https://$(cd terraform/environments/poc && terraform output -raw cloudfront_url)
```

### Workflow 4: Batch Testing

Test multiple scenarios in sequence:

```bash
for scenario in normal_sinus_rhythm with_pvc atrial_fibrillation tachycardia; do
    echo "Testing $scenario..."
    python3 tests/simulators/ecg_system_simulator.py \
        --scenario $scenario \
        --cert ~/certs/device.crt \
        --key ~/certs/device.key \
        --ca ~/certs/AmazonRootCA1.pem
    sleep 60  # Wait between tests
done
```

### Workflow 5: Continuous Testing

Simulate continuous data stream:

```bash
# Run for 10 minutes, sending a batch every minute
for i in {1..10}; do
    echo "Sending batch $i/10..."
    python3 tests/simulators/ecg_system_simulator.py \
        --scenario normal_sinus_rhythm \
        --cert ~/certs/device.crt \
        --key ~/certs/device.key \
        --ca ~/certs/AmazonRootCA1.pem
    sleep 60
done

# Check accumulated data
aws s3 ls s3://ecg-monitor-poc-raw-data/ --recursive | tail -20
```

---

## Verifying Test Results

### Check S3

```bash
# List recent objects
aws s3 ls s3://ecg-monitor-poc-raw-data/ --recursive | tail

# Download a batch
aws s3 cp s3://ecg-monitor-poc-raw-data/2024/11/06/12/batch_xxx.json.gz ./

# Decompress and view
gunzip batch_xxx.json.gz
cat batch_xxx.json | jq '.device_id, .num_samples'
```

### Check DynamoDB

```bash
# Scan sessions table
aws dynamodb scan --table-name ecg-monitor-poc-sessions

# Query specific session
aws dynamodb get-item \
    --table-name ecg-monitor-poc-sessions \
    --key '{"session_id": {"S": "ecg-device-001"}}'

# Scan alerts table
aws dynamodb scan --table-name ecg-monitor-poc-alerts --limit 5
```

### Check CloudWatch Logs

```bash
# Preprocessor logs
aws logs tail /aws/lambda/ecg-monitor-poc-preprocessor --follow

# AI Analyzer logs
aws logs tail /aws/lambda/ecg-monitor-poc-ai-analyzer --follow

# Filter for errors
aws logs tail /aws/lambda/ecg-monitor-poc-preprocessor --filter-pattern "ERROR"
```

### Check API

```bash
# Get API URL
API_URL=$(cd terraform/environments/poc && terraform output -raw api_gateway_url)

# Test endpoints
curl "$API_URL/api/live?device_id=ecg-device-001" | jq '.'
curl "$API_URL/api/alerts?device_id=ecg-device-001" | jq '.alerts | length'
curl "$API_URL/api/history?device_id=ecg-device-001" | jq '.history | length'
```

---

## Troubleshooting

### Simulator Can't Connect to IoT

**Problem:** `Connection refused` or `403 Forbidden`

**Solutions:**
1. Verify certificates are correct and not expired
2. Check IoT policy is attached to certificate
3. Verify endpoint URL is correct

```bash
# Check certificate
openssl x509 -in ~/certs/device.crt -text -noout

# List policies attached to cert
aws iot list-principal-policies --principal <cert-arn>

# Get IoT endpoint
cd terraform/environments/poc && terraform output iot_endpoint
```

### No Data in S3

**Problem:** Simulator succeeds but S3 is empty

**Solutions:**
1. Check IoT rule is active
2. Check IoT rule has S3 action
3. Check IAM permissions

```bash
# List IoT rules
aws iot list-topic-rules

# Get rule details
aws iot get-topic-rule --rule-name ecg_monitor_poc_ecg_data

# Check S3 bucket policy
aws s3api get-bucket-policy --bucket ecg-monitor-poc-raw-data
```

### Lambda Not Processing

**Problem:** Data in S3 but Lambda not running

**Solutions:**
1. Check SQS queue has messages
2. Check Lambda event source mapping
3. Check CloudWatch logs for errors

```bash
# Check SQS queue
aws sqs get-queue-attributes \
    --queue-url $(aws sqs get-queue-url --queue-name ecg-monitor-poc-processing-queue --query QueueUrl --output text) \
    --attribute-names ApproximateNumberOfMessages

# List event source mappings
aws lambda list-event-source-mappings \
    --function-name ecg-monitor-poc-preprocessor

# Check for Lambda errors
aws logs filter-log-events \
    --log-group-name /aws/lambda/ecg-monitor-poc-preprocessor \
    --filter-pattern "ERROR"
```

### API Returns 500 Error

**Problem:** API endpoint returns server error

**Solutions:**
1. Check Lambda function logs
2. Check DynamoDB table exists
3. Check Lambda has permissions

```bash
# Check API handler logs
aws logs tail /aws/lambda/ecg-monitor-poc-api-handler --since 10m

# Test Lambda directly
aws lambda invoke \
    --function-name ecg-monitor-poc-api-handler \
    --payload '{"httpMethod":"GET","path":"/api/live","queryStringParameters":{"device_id":"ecg-device-001"}}' \
    response.json

cat response.json
```

---

## Performance Testing

### Load Test

Send multiple batches concurrently:

```bash
# Create load test script
cat > load_test.sh << 'EOF'
#!/bin/bash
for i in {1..10}; do
    python3 tests/simulators/ecg_system_simulator.py \
        --scenario normal_sinus_rhythm \
        --cert ~/certs/device.crt \
        --key ~/certs/device.key \
        --ca ~/certs/AmazonRootCA1.pem &
done
wait
EOF

chmod +x load_test.sh
./load_test.sh
```

### Latency Test

Measure end-to-end latency:

```bash
START=$(date +%s)
python3 tests/simulators/ecg_system_simulator.py --scenario normal_sinus_rhythm
END=$(date +%s)
echo "Total time: $((END - START)) seconds"
```

---

## Continuous Integration

### GitHub Actions Example

```yaml
name: ECG Monitor Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'

      - name: Generate Test Data
        run: python3 tests/data/generate_test_data.py

      - name: Validate Test Data
        run: |
          test -f tests/data/normal_sinus_rhythm.json
          jq empty tests/data/normal_sinus_rhythm.json
```

---

## Summary

The testing suite provides:

✅ **Realistic Test Data** - Generated ECG waveforms
✅ **Full Pipeline Simulation** - Pi → IoT → Lambda → API
✅ **End-to-End Verification** - Automated integration tests
✅ **Multiple Scenarios** - Normal, PVC, AFib, Tachycardia
✅ **Manual Testing Tools** - Scripts and commands
✅ **Troubleshooting Guides** - Common issues and solutions

**Start testing:**
```bash
# Generate data
python3 tests/data/generate_test_data.py

# Run integration tests
./tests/integration/test_end_to_end.sh

# Full simulation
python3 tests/simulators/ecg_system_simulator.py --cert <cert> --key <key> --ca <ca>
```
