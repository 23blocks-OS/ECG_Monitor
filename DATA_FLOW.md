# ECG Monitor Data Flow Specification

## Overview
This document describes the detailed data flow through the ECG monitoring system, from hardware capture to AI analysis and visualization.

---

## 1. Edge Data Capture (Raspberry Pi)

### 1.1 Hardware Interface
```
CJMCU-1293 (ADS1293)
  ├─ Channel 1 (Lead I)   ───┐
  ├─ Channel 2 (Lead II)  ───┼─→ SPI Interface → Raspberry Pi
  └─ Channel 3 (Lead III) ───┘
```

**Data Format:**
- **Sampling Rate:** 250 Hz (250 samples/second per channel)
- **Resolution:** 24-bit signed integer
- **Channels:** 3 (simultaneous)
- **Data Rate:** 750 samples/second total (3 × 250)

### 1.2 Raw Sample Structure
```json
{
  "timestamp_ms": 1699123456789,
  "channel_1": -123456,
  "channel_2": 234567,
  "channel_3": -345678,
  "sample_rate": 250,
  "device_id": "ecg-device-001"
}
```

### 1.3 Signal Processing Pipeline
```
Raw ADC Data
    ↓
Notch Filter (60 Hz) - Remove power line noise
    ↓
Bandpass Filter (0.5-40 Hz) - Keep ECG frequency range
    ↓
Baseline Correction
    ↓
Processed Sample
```

### 1.4 Local Buffering
- **Buffer Size:** 30 seconds (7,500 samples per channel)
- **Memory Usage:** ~675 KB per 30-second buffer
- **Disk Cache:** Up to 500 MB for offline periods

---

## 2. Data Streaming (Pi → AWS)

### 2.1 Batch Creation
Every 10 seconds, create a batch:
```json
{
  "device_id": "ecg-device-001",
  "batch_id": "uuid-v4",
  "start_timestamp": 1699123456789,
  "end_timestamp": 1699123466789,
  "duration_seconds": 10,
  "sample_rate": 250,
  "num_samples": 2500,
  "channels": {
    "channel_1": [<2500 integers>],
    "channel_2": [<2500 integers>],
    "channel_3": [<2500 integers>]
  },
  "metadata": {
    "firmware_version": "1.0.0",
    "battery_level": 85,
    "signal_quality": "good"
  }
}
```

### 2.2 Compression
- **Algorithm:** gzip
- **Compression Ratio:** ~60-70% (JSON to gzip)
- **Typical Batch Size:**
  - Uncompressed: ~60 KB
  - Compressed: ~18-24 KB

### 2.3 MQTT Publish
```
Topic: ecg/device001/data
QoS: 1 (at least once delivery)
Payload: gzipped JSON
Frequency: Every 10 seconds
```

---

## 3. AWS Ingestion (IoT Core)

### 3.1 IoT Rule Action
```sql
SELECT
  *,
  timestamp() as ingestion_timestamp,
  topic(2) as device_id
FROM
  'ecg/+/data'
```

**Actions:**
1. **S3:** Archive raw batch to `s3://ecg-raw-data/YYYY/MM/DD/HH/{batch_id}.json.gz`
2. **SQS:** Send to `ecg-processing-queue`
3. **DynamoDB:** Update device status in `ecg-sessions` table

### 3.2 DynamoDB Session Entry
```json
{
  "session_id": "uuid-v4",
  "device_id": "ecg-device-001",
  "start_timestamp": 1699123456789,
  "last_update": 1699123466789,
  "status": "active",
  "batches_received": 360,
  "s3_path": "s3://ecg-raw-data/2024/11/05/14/",
  "total_duration_seconds": 3600
}
```

---

## 4. Data Processing (Lambda)

### 4.1 Preprocessor Lambda

**Trigger:** SQS message from `ecg-processing-queue`

**Processing Steps:**
1. Decompress batch
2. Validate data integrity
3. Compute derived metrics:
   - Heart rate (BPM)
   - R-R intervals
   - Heart rate variability (HRV)
   - QRS complex detection
4. Detect basic anomalies (missing beats, noise)

**Output Format:**
```json
{
  "batch_id": "uuid-v4",
  "device_id": "ecg-device-001",
  "timestamp": 1699123466789,
  "duration_seconds": 10,
  "metrics": {
    "heart_rate_bpm": 72,
    "rr_intervals_ms": [833, 820, 840, 825, 830, ...],
    "hrv_rmssd": 42.5,
    "hrv_sdnn": 38.2,
    "qrs_count": 12,
    "avg_qrs_width_ms": 95,
    "signal_quality_score": 0.92
  },
  "flags": {
    "missed_beats": false,
    "noisy_signal": false,
    "irregular_rhythm": false
  },
  "s3_raw_path": "s3://ecg-raw-data/2024/11/05/14/uuid.json.gz"
}
```

**Destinations:**
1. DynamoDB `ecg-sessions` (update metrics)
2. SQS `ecg-analysis-queue` (for AI analysis)
3. S3 `ecg-processed-data/` (store processed metrics)

### 4.2 AI Analyzer Lambda

**Trigger:** SQS message from `ecg-analysis-queue`

**Claude API Prompt Structure:**
```
You are an expert cardiologist analyzing ECG data. Here's a 10-second ECG segment:

Patient Context:
- Device: Personal ECG monitor
- Time: 2024-11-05 14:30:45 UTC
- Activity: Unknown (could be rest or exercise)

ECG Metrics:
- Heart Rate: 72 BPM
- HRV (RMSSD): 42.5 ms
- HRV (SDNN): 38.2 ms
- QRS Count: 12
- Average QRS Width: 95 ms
- R-R Intervals: [833, 820, 840, 825, 830, 828, 835, 822, 838, 827, 832, 825] ms

Signal Quality: 0.92/1.0

Please analyze this ECG data and provide:
1. Arrhythmia Detection: Any irregular rhythms? (AFib, PVCs, PACs, etc.)
2. Pattern Classification: Rest, exercise, stress?
3. Anomalies: Any concerning patterns?
4. Severity: Low, Medium, High, Critical
5. Recommendations: Any immediate actions needed?

Respond in JSON format:
{
  "arrhythmias_detected": [],
  "pattern": "rest",
  "anomalies": [],
  "severity": "low",
  "confidence": 0.95,
  "summary": "Normal sinus rhythm...",
  "recommendations": []
}
```

**Claude Response Processing:**
```json
{
  "batch_id": "uuid-v4",
  "analysis_timestamp": 1699123470000,
  "model": "claude-3-5-sonnet-20241022",
  "analysis": {
    "arrhythmias_detected": ["occasional_pvc"],
    "pattern": "rest",
    "anomalies": ["premature_ventricular_contraction"],
    "severity": "low",
    "confidence": 0.87,
    "summary": "Occasional premature ventricular contractions detected...",
    "recommendations": [
      "Monitor frequency of PVCs",
      "Note if PVCs increase during exercise"
    ]
  },
  "alert_triggered": false
}
```

**Destinations:**
1. DynamoDB `ecg-analysis` table
2. If alert triggered → DynamoDB Stream → Alert Worker
3. S3 `ecg-processed-data/analysis/`

### 4.3 Alert Worker Lambda

**Trigger:** DynamoDB Stream (when severity >= "medium")

**Alert Logic:**
```python
if analysis.severity in ["medium", "high", "critical"]:
    if not recently_alerted(device_id, cooldown=15_minutes):
        send_email_alert()
        record_alert_sent()
```

**Email Template:**
```
Subject: [ECG Alert] {severity.upper()} - Arrhythmia Detected

Dear User,

Your ECG monitor has detected an anomaly:

Time: 2024-11-05 14:30:45 UTC
Severity: Medium
Type: Occasional PVCs

Analysis Summary:
Occasional premature ventricular contractions detected during rest period.
R-R intervals show some variability.

Recommendations:
- Monitor frequency of PVCs
- Note if PVCs increase during exercise
- Consider consulting with healthcare provider

View detailed analysis: https://dashboard.yourdomain.com/analysis/{batch_id}

---
ECG Monitor System
```

**DynamoDB Alert Record:**
```json
{
  "alert_id": "uuid-v4",
  "device_id": "ecg-device-001",
  "batch_id": "uuid-v4",
  "timestamp": 1699123470000,
  "severity": "medium",
  "type": "arrhythmia",
  "arrhythmias": ["occasional_pvc"],
  "notification_sent": true,
  "notification_method": "email",
  "user_acknowledged": false
}
```

---

## 5. API Layer (Dashboard Access)

### 5.1 API Endpoints

**GET /api/live**
- Returns: Latest ECG batch + metrics (last 10 seconds)
- Latency: <100ms
- Cache: 5 seconds

Response:
```json
{
  "device_id": "ecg-device-001",
  "timestamp": 1699123470000,
  "status": "active",
  "metrics": {
    "heart_rate_bpm": 72,
    "hrv_rmssd": 42.5,
    "signal_quality": 0.92
  },
  "waveform": {
    "channel_1": [<downsampled to 100 points>],
    "channel_2": [<downsampled to 100 points>],
    "channel_3": [<downsampled to 100 points>]
  }
}
```

**GET /api/history?start={timestamp}&end={timestamp}**
- Returns: Historical metrics (aggregated)
- Max Range: 7 days
- Resolution: 1-minute aggregates

**GET /api/alerts**
- Returns: Recent alerts (last 24 hours)
- Sorted by: timestamp DESC

**GET /api/analysis/{batch_id}**
- Returns: Detailed AI analysis for specific batch

### 5.2 Data Aggregation for Dashboard

For historical queries, data is aggregated:
```
250 Hz samples → 1-second averages → 1-minute summaries
```

1-minute summary:
```json
{
  "timestamp": 1699123440000,
  "heart_rate_bpm_avg": 72,
  "heart_rate_bpm_min": 68,
  "heart_rate_bpm_max": 78,
  "hrv_rmssd_avg": 42.5,
  "signal_quality_avg": 0.92,
  "arrhythmias_detected": 0
}
```

---

## 6. Web Dashboard Rendering

### 6.1 Real-time Chart Update
```javascript
// Poll API every 5 seconds
setInterval(async () => {
  const data = await fetch('/api/live');
  updateECGChart(data.waveform);
  updateMetrics(data.metrics);
}, 5000);
```

### 6.2 Data Visualization
- **Waveform:** Chart.js line chart (3 channels)
- **Heart Rate:** Gauge chart (40-180 BPM range)
- **HRV:** Time series plot
- **Alerts:** Timeline with severity colors

---

## Data Volumes & Performance

### Daily Data Generation (24/7 operation)

**Raw ECG Data:**
- Samples per day: 250 Hz × 3 channels × 86,400 sec = 64,800,000 samples
- Storage (uncompressed): ~185 MB/day
- Storage (compressed): ~55 MB/day

**Processed Metrics:**
- 10-second batches per day: 8,640 batches
- Storage: ~17 MB/day

**Claude API Calls:**
- If analyzing every batch: 8,640 calls/day (~$86/day at $0.01/call)
- Optimized (analyze every 10 batches): 864 calls/day (~$8.64/day)

### Latency Targets

| Stage | Target | Typical |
|-------|--------|---------|
| Pi → IoT Core | <2s | 1s |
| IoT → S3/SQS | <1s | 0.5s |
| Preprocessing Lambda | <10s | 5s |
| AI Analysis Lambda | <30s | 15s |
| Alert Email | <60s | 30s |
| Total (capture to alert) | <2min | 1min |

---

## Error Handling

### Data Loss Prevention
1. **Pi local cache:** 500 MB (~9 days offline)
2. **SQS DLQ:** Failed processing batches
3. **S3 versioning:** Raw data protection

### Retry Logic
- **IoT publish:** 3 retries with backoff
- **Lambda invocation:** Automatic retries (up to 2)
- **Claude API:** 3 retries with exponential backoff

### Health Monitoring
- Pi heartbeat every 60 seconds
- CloudWatch alarm if no data for 5 minutes
- Email notification to admin
