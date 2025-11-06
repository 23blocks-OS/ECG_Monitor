# ECG Monitor Testing Guide

Quick guide to test your deployed ECG Monitor system without hardware.

---

## 🎯 Overview

The testing suite lets you validate the entire system pipeline:
```
Test Data → IoT Core → S3 → Lambda → DynamoDB → API → Dashboard
```

**No hardware required!** Test with realistic ECG waveforms.

---

## 🚀 Quick Start (5 minutes)

### 1. Generate Test Data

```bash
python3 tests/data/generate_test_data.py
```

**Output:** 14 test files with realistic ECG waveforms
- `normal_sinus_rhythm.json` - Normal heart rhythm
- `with_pvc.json` - Premature ventricular contractions
- `atrial_fibrillation.json` - AFib pattern
- `tachycardia.json` - Fast heart rate (150 BPM)
- `normal_sequence_*.json` - 10 sequential batches

### 2. Run Integration Tests

```bash
./tests/integration/test_end_to_end.sh
```

**Tests:**
- ✅ AWS resources deployed
- ✅ API endpoints working
- ✅ Lambda functions executing
- ✅ Dashboard accessible

**Time:** ~2 minutes

### 3. Simulate Full Pipeline (Optional)

If you have IoT certificates:

```bash
python3 tests/simulators/ecg_system_simulator.py \
  --scenario normal_sinus_rhythm \
  --cert ~/certs/device.crt \
  --key ~/certs/device.key \
  --ca ~/certs/AmazonRootCA1.pem
```

**What it does:**
1. Loads test ECG data
2. Compresses like Raspberry Pi would
3. Publishes to AWS IoT Core
4. Waits for Lambda processing
5. Verifies data in S3, DynamoDB, API

**Time:** ~1 minute

---

## 📊 Test Scenarios

### Scenario 1: Normal Heart Rhythm

```bash
python3 tests/simulators/ecg_system_simulator.py \
  --scenario normal_sinus_rhythm \
  --cert ~/certs/device.crt \
  --key ~/certs/device.key \
  --ca ~/certs/AmazonRootCA1.pem
```

**Expected:**
- ✅ Data in S3
- ✅ Session in DynamoDB
- ✅ No alerts (normal rhythm)
- ✅ HR: ~72 BPM on dashboard

### Scenario 2: Premature Ventricular Contractions

```bash
python3 tests/simulators/ecg_system_simulator.py \
  --scenario with_pvc \
  --cert ~/certs/device.crt \
  --key ~/certs/device.key \
  --ca ~/certs/AmazonRootCA1.pem
```

**Expected:**
- ✅ Data in S3
- ✅ Session in DynamoDB
- ⚠️ **Alert created** (medium severity)
- ✅ **Email sent** (check inbox!)
- ✅ Alert visible on dashboard

**Check email** - You should receive:
```
Subject: [ECG Alert] MEDIUM - Arrhythmia Detected
Body: Claude AI detected PVCs with recommendations
```

### Scenario 3: Atrial Fibrillation

```bash
python3 tests/simulators/ecg_system_simulator.py \
  --scenario atrial_fibrillation \
  --cert ~/certs/device.crt \
  --key ~/certs/device.key \
  --ca ~/certs/AmazonRootCA1.pem
```

**Expected:**
- ✅ Data in S3
- ⚠️ **Alert created** (high severity)
- ✅ **Email sent** with AFib detection
- ✅ Claude AI analysis visible

### Scenario 4: Tachycardia

```bash
python3 tests/simulators/ecg_system_simulator.py \
  --scenario tachycardia \
  --cert ~/certs/device.crt \
  --key ~/certs/device.key \
  --ca ~/certs/AmazonRootCA1.pem
```

**Expected:**
- ✅ Data in S3
- ✅ HR: ~150 BPM on dashboard
- ⚠️ Alert for elevated heart rate

---

## 🔍 Verify Results

### Check S3 Data

```bash
# List recent batches
aws s3 ls s3://ecg-monitor-poc-raw-data/ --recursive | tail -10

# Download and view a batch
aws s3 cp s3://ecg-monitor-poc-raw-data/$(date +%Y/%m/%d)/$(date +%H)/ ./ --recursive
gunzip *.gz
cat *.json | jq '.device_id, .num_samples'
```

### Check DynamoDB

```bash
# View sessions
aws dynamodb scan --table-name ecg-monitor-poc-sessions | jq '.Items[0]'

# View alerts
aws dynamodb scan --table-name ecg-monitor-poc-alerts | jq '.Items'
```

### Check API

```bash
# Get API URL
API_URL=$(cd terraform/environments/poc && terraform output -raw api_gateway_url)

# Test live endpoint
curl "$API_URL/api/live?device_id=ecg-device-001" | jq '.metrics'

# Test alerts endpoint
curl "$API_URL/api/alerts?device_id=ecg-device-001" | jq '.alerts | length'
```

### Check Dashboard

```bash
# Get dashboard URL
DASHBOARD=$(cd terraform/environments/poc && terraform output -raw cloudfront_url)

# Open in browser
open $DASHBOARD  # macOS
xdg-open $DASHBOARD  # Linux
start $DASHBOARD  # Windows
```

**You should see:**
- ✅ Real-time ECG waveforms (3 channels)
- ✅ Heart rate metrics
- ✅ Signal quality
- ✅ Recent alerts
- ✅ Auto-updating every 5 seconds

---

## 🔄 Continuous Testing

### Send Multiple Batches

```bash
# Send 10 batches (one per minute)
for i in {1..10}; do
  echo "Sending batch $i/10..."
  python3 tests/simulators/ecg_system_simulator.py \
    --scenario normal_sinus_rhythm \
    --cert ~/certs/device.crt \
    --key ~/certs/device.key \
    --ca ~/certs/AmazonRootCA1.pem
  sleep 60
done
```

### Test Different Scenarios

```bash
# Test all scenarios sequentially
for scenario in normal_sinus_rhythm with_pvc atrial_fibrillation tachycardia; do
  echo "Testing $scenario..."
  python3 tests/simulators/ecg_system_simulator.py \
    --scenario $scenario \
    --cert ~/certs/device.crt \
    --key ~/certs/device.key \
    --ca ~/certs/AmazonRootCA1.pem
  sleep 60
done
```

**Watch for:**
- Different heart rates
- Different alert severities
- Email notifications
- Dashboard updates

---

## 📈 Monitor Processing

### Watch Lambda Logs

```bash
# Preprocessor (real-time)
aws logs tail /aws/lambda/ecg-monitor-poc-preprocessor --follow

# AI Analyzer (real-time)
aws logs tail /aws/lambda/ecg-monitor-poc-ai-analyzer --follow

# Alert Worker (real-time)
aws logs tail /aws/lambda/ecg-monitor-poc-alert-worker --follow
```

### Check Processing Pipeline

```bash
# Check SQS queue depth
aws sqs get-queue-attributes \
  --queue-url $(aws sqs get-queue-url --queue-name ecg-monitor-poc-processing-queue --query QueueUrl --output text) \
  --attribute-names ApproximateNumberOfMessages

# Check Lambda invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=ecg-monitor-poc-preprocessor \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

---

## ❌ Troubleshooting

### Issue: No IoT Connection

**Error:** `Connection refused` or `403 Forbidden`

**Fix:**
```bash
# Verify certificate exists
ls -la ~/certs/device.crt

# Check IoT endpoint
cd terraform/environments/poc
terraform output iot_endpoint

# Verify policy attached
aws iot list-principal-policies --principal <your-cert-arn>
```

### Issue: No Data in S3

**Symptom:** Simulator publishes but S3 is empty

**Fix:**
```bash
# Check IoT rule
aws iot get-topic-rule --rule-name ecg_monitor_poc_ecg_data

# Check S3 bucket exists
aws s3 ls | grep ecg-monitor-poc-raw-data

# Check IoT rule logs
aws logs tail AWSIotLogsV2 --since 10m
```

### Issue: Lambda Not Processing

**Symptom:** Data in S3 but no DynamoDB entries

**Fix:**
```bash
# Check SQS has messages
aws sqs get-queue-attributes \
  --queue-url $(aws sqs get-queue-url --queue-name ecg-monitor-poc-processing-queue --query QueueUrl --output text) \
  --attribute-names All

# Check Lambda errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/ecg-monitor-poc-preprocessor \
  --filter-pattern "ERROR"

# Invoke Lambda directly
aws lambda invoke \
  --function-name ecg-monitor-poc-preprocessor \
  --payload '{"test": "data"}' \
  response.json
```

### Issue: No Email Alerts

**Symptom:** Alert in DynamoDB but no email

**Fix:**
```bash
# Verify email in SES
aws ses get-identity-verification-attributes \
  --identities your-email@example.com

# Check alert worker logs
aws logs tail /aws/lambda/ecg-monitor-poc-alert-worker --since 10m

# Check SES send quota
aws ses get-send-quota
```

### Issue: Dashboard Shows No Data

**Symptom:** Dashboard loads but shows "No data"

**Fix:**
```bash
# Check API directly
curl "$API_URL/api/live?device_id=ecg-device-001"

# Check API handler logs
aws logs tail /aws/lambda/ecg-monitor-poc-api-handler --since 10m

# Verify CORS
curl -H "Origin: https://example.com" -I "$API_URL/api/live"
```

---

## ✅ Expected Test Results

### After Running Simulator Once:

1. **S3:**
   - 1 new object in `ecg-monitor-poc-raw-data/YYYY/MM/DD/HH/`
   - Size: ~18-24 KB (compressed)

2. **DynamoDB:**
   - `ecg-monitor-poc-sessions`: 1 item or updated
   - `ecg-monitor-poc-alerts`: 0-1 item (depending on scenario)

3. **CloudWatch:**
   - Logs in `/aws/lambda/ecg-monitor-poc-preprocessor`
   - Logs in `/aws/lambda/ecg-monitor-poc-ai-analyzer` (if analyzed)

4. **Email:**
   - 0-1 email (if alert severity >= medium)

5. **Dashboard:**
   - Updated metrics within 5-10 seconds
   - New alert in timeline (if any)

### After Running for 10 Minutes:

- **S3:** ~60 objects (1 per 10 seconds)
- **DynamoDB Sessions:** Updated every 10 seconds
- **Processed Data:** ~10% analyzed by Claude
- **Alerts:** 0-5 depending on scenarios
- **Cost:** ~$0.50 (mostly Claude API)

---

## 🎓 Learning Exercises

### Exercise 1: Verify End-to-End Flow

```bash
# 1. Send test data
python3 tests/simulators/ecg_system_simulator.py \
  --scenario normal_sinus_rhythm \
  --cert ~/certs/device.crt \
  --key ~/certs/device.key \
  --ca ~/certs/AmazonRootCA1.pem

# 2. Watch it flow through the system
aws logs tail /aws/lambda/ecg-monitor-poc-preprocessor --follow &
aws logs tail /aws/lambda/ecg-monitor-poc-ai-analyzer --follow &

# 3. Check final result
open $(cd terraform/environments/poc && terraform output -raw cloudfront_url)
```

### Exercise 2: Test Alert System

```bash
# Send PVC data (should trigger alert)
python3 tests/simulators/ecg_system_simulator.py \
  --scenario with_pvc \
  --cert ~/certs/device.crt \
  --key ~/certs/device.key \
  --ca ~/certs/AmazonRootCA1.pem

# Wait 2 minutes
sleep 120

# Check email (should receive alert)
# Check dashboard (should show alert in timeline)

# Verify in DynamoDB
aws dynamodb scan --table-name ecg-monitor-poc-alerts
```

### Exercise 3: Performance Test

```bash
# Send 10 batches concurrently
for i in {1..10}; do
  python3 tests/simulators/ecg_system_simulator.py \
    --scenario normal_sinus_rhythm \
    --cert ~/certs/device.crt \
    --key ~/certs/device.key \
    --ca ~/certs/AmazonRootCA1.pem &
done
wait

# Check all processed
aws dynamodb scan --table-name ecg-monitor-poc-sessions | jq '.Items[0].batches_received'
```

---

## 📊 Success Criteria

Your system is working correctly if:

- ✅ Test data generator creates 14 files
- ✅ Integration tests pass 6/6
- ✅ Simulator connects to IoT Core
- ✅ Data appears in S3 within 5 seconds
- ✅ DynamoDB updates within 10 seconds
- ✅ Lambda logs show processing
- ✅ API returns valid JSON
- ✅ Dashboard shows live data
- ✅ Alerts trigger emails (PVC/AFib scenarios)
- ✅ Claude AI analysis visible

---

## 🎯 Next Steps

After successful testing:

1. **Deploy Hardware**
   - Connect CJMCU-1293 to Raspberry Pi
   - Run real collector (not mock mode)

2. **Continuous Monitoring**
   - Set up systemd services
   - Configure auto-start on boot

3. **Optimization**
   - Adjust Claude API frequency
   - Tune alert thresholds
   - Optimize costs

4. **Production Hardening**
   - Enable SES production mode
   - Set up CloudWatch alarms
   - Configure backup strategies

---

**📚 Full Documentation:** See `tests/README.md` for comprehensive guide

**💡 Tip:** Start with `./tests/integration/test_end_to_end.sh` to validate your deployment!
