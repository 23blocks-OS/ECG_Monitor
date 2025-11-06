# ECG Monitor System Architecture

## Project Overview
Portable ECG monitoring system running on Raspberry Pi with cloud-based AI analysis using Claude API for 24/7 heart activity monitoring, arrhythmia detection, and pattern recognition.

**Hardware:** CJMCU-1293 (ADS1293 3-channel ECG AFE)
**Cloud:** AWS
**AI:** Claude API (Anthropic)
**Goal:** POC for continuous heart monitoring with intelligent alerts

---

## System Components

### 1. Edge Device (Raspberry Pi)

#### A. Data Collector (`pi-collector/`)
- **Purpose:** Interface with CJMCU-1293 ECG module
- **Technology:** Python 3.9+, SPI interface
- **Responsibilities:**
  - Initialize ADS1293 via SPI
  - Sample 3-channel ECG data (250-500 Hz)
  - Apply basic filtering (noise reduction)
  - Buffer data locally
  - Handle sensor errors/disconnections

#### B. Cloud Streamer (`pi-streamer/`)
- **Purpose:** Stream ECG data to AWS
- **Technology:** Python, AWS IoT Core SDK
- **Responsibilities:**
  - Batch ECG samples (e.g., 10-second windows)
  - Compress data for transmission
  - MQTT publish to AWS IoT Core
  - Handle offline buffering (local storage)
  - Retry logic with exponential backoff
  - Device authentication (X.509 certificates)

---

### 2. AWS Cloud Infrastructure

#### A. Data Ingestion Layer

**AWS IoT Core**
- MQTT broker for device connectivity
- Device authentication & authorization
- Message routing to processing pipeline

**IoT Rule**
- Route incoming ECG data to:
  - S3 (raw data archival)
  - SQS (processing queue)
  - DynamoDB (metadata tracking)

#### B. Storage Layer

**S3 Buckets**
- `ecg-raw-data/`: Raw ECG samples (partitioned by date)
- `ecg-processed-data/`: Analyzed results
- `ecg-web-assets/`: Dashboard static files

**DynamoDB Tables**
- `ecg-sessions`: Tracking metadata (session_id, timestamp, duration)
- `ecg-alerts`: Anomalies detected (type, severity, timestamp)
- `ecg-analysis`: Claude API analysis results

#### C. Processing Layer

**Lambda Functions**

1. **ecg-preprocessor** (Python)
   - Triggered by: SQS queue
   - Validate data integrity
   - Compute basic metrics (heart rate, HRV)
   - Prepare data for AI analysis
   - Store in DynamoDB

2. **ecg-ai-analyzer** (Python)
   - Triggered by: SQS queue (from preprocessor)
   - Call Claude API with ECG data
   - Prompt engineering for arrhythmia detection
   - Pattern recognition (exercise, rest, anomalies)
   - Store analysis in DynamoDB + S3

3. **ecg-alert-worker** (Python)
   - Triggered by: DynamoDB Stream
   - Evaluate alert thresholds
   - Send emails via SES
   - Push notifications (future)

4. **ecg-api-handler** (Python)
   - Triggered by: API Gateway
   - REST API for dashboard
   - Query recent data, alerts, analysis
   - WebSocket support for real-time updates

**SQS Queues**
- `ecg-processing-queue`: Main processing pipeline
- `ecg-analysis-queue`: AI analysis tasks
- `ecg-dlq`: Dead letter queue for failed messages

#### D. API Layer

**API Gateway**
- REST API endpoints:
  - `GET /api/live` - Latest ECG data
  - `GET /api/history/{timerange}` - Historical data
  - `GET /api/alerts` - Recent alerts
  - `GET /api/analysis/{session_id}` - AI analysis results
- WebSocket API (future):
  - Real-time ECG streaming to dashboard

**CloudWatch**
- Logging for all Lambda functions
- Metrics and alarms
- Custom dashboards

---

### 3. Web Dashboard (`web-dashboard/`)

**Frontend**
- **Technology:** HTML5, JavaScript, Chart.js/Plotly.js
- **Hosting:** S3 + CloudFront (static site)
- **Features:**
  - Real-time ECG waveform display (3 leads)
  - Heart rate & HRV metrics
  - AI analysis insights panel
  - Alert history timeline
  - Historical data viewer

**Components:**
- `index.html`: Main dashboard
- `app.js`: Core application logic
- `ecg-chart.js`: Real-time chart rendering
- `api-client.js`: AWS API Gateway client
- `styles.css`: UI styling

---

### 4. AI Analysis Engine

**Claude API Integration**
- **Model:** Claude 3.5 Sonnet (or latest)
- **Use Cases:**
  1. Arrhythmia detection (AFib, PVCs, etc.)
  2. Pattern recognition (exercise vs rest)
  3. Trend analysis (daily/weekly summaries)
  4. Anomaly detection (unusual patterns)

**Prompt Strategy:**
- Provide ECG metrics + waveform description
- Include context (time of day, activity level if available)
- Ask specific questions (e.g., "Detect any arrhythmias?")
- Request structured JSON responses

---

## Data Flow

```
[CJMCU-1293] → [Raspberry Pi SPI] → [Data Collector]
                                            ↓
                                    [Local Buffer]
                                            ↓
                                    [Cloud Streamer] → MQTT
                                            ↓
                                    [AWS IoT Core]
                                            ↓
                        ┌───────────────────┼───────────────────┐
                        ↓                   ↓                   ↓
                    [S3 Raw]          [SQS Queue]         [DynamoDB]
                                            ↓
                                  [Preprocessor Lambda]
                                            ↓
                                  [AI Analyzer Lambda] → Claude API
                                            ↓
                                    [DynamoDB Stream]
                                            ↓
                                  [Alert Worker Lambda] → SES Email

                        [Web Dashboard] ← [API Gateway] ← [API Handler Lambda]
```

---

## Technology Stack

### Raspberry Pi
- **OS:** Raspberry Pi OS (Debian-based)
- **Language:** Python 3.9+
- **Libraries:**
  - `spidev` - SPI communication
  - `RPi.GPIO` - GPIO control
  - `boto3` - AWS SDK
  - `AWSIoTPythonSDK` - IoT Core
  - `numpy` - Signal processing

### AWS Services
- **Compute:** Lambda (Python 3.11)
- **Storage:** S3, DynamoDB
- **Messaging:** IoT Core (MQTT), SQS
- **API:** API Gateway (REST + WebSocket)
- **Notifications:** SES (Simple Email Service)
- **Monitoring:** CloudWatch
- **IAM:** Roles & Policies

### AI/ML
- **API:** Anthropic Claude API
- **Analysis:** Pattern recognition, anomaly detection

### Web Dashboard
- **Frontend:** Vanilla JS, Chart.js
- **Hosting:** S3 + CloudFront
- **API Client:** Fetch API / Axios

---

## Security Considerations

1. **Device Authentication:**
   - X.509 certificates for IoT Core
   - Secure credential storage on Pi

2. **Data Encryption:**
   - TLS 1.2+ for all transmissions
   - S3 server-side encryption (SSE-S3)
   - DynamoDB encryption at rest

3. **API Security:**
   - API Gateway with IAM authorization
   - CORS configuration
   - Rate limiting

4. **Medical Data Privacy:**
   - HIPAA considerations (for future)
   - Data retention policies
   - Access logging

---

## Deployment Strategy

### Phase 1: POC (Current)
1. Raspberry Pi local development
2. AWS resources via console + CloudFormation
3. Manual deployment
4. Single device testing

### Phase 2: Production (Future)
1. Infrastructure as Code (full CDK/Terraform)
2. CI/CD pipeline
3. Multi-device support
4. Enhanced monitoring & alerting

---

## Configuration Management

### Environment Variables
- Pi: `config/pi-config.yaml`
- AWS: Systems Manager Parameter Store
- Secrets: AWS Secrets Manager

### Key Configurations
- ECG sampling rate (default: 250 Hz)
- Streaming batch size (default: 10 seconds)
- Alert thresholds (HR, arrhythmia types)
- Claude API settings (model, temperature)

---

## Monitoring & Observability

1. **CloudWatch Metrics:**
   - Lambda execution times
   - SQS queue depth
   - DynamoDB read/write capacity
   - IoT Core connection status

2. **CloudWatch Alarms:**
   - Lambda errors > threshold
   - SQS message age > 5 minutes
   - IoT device disconnected

3. **Logs:**
   - All Lambda functions → CloudWatch Logs
   - Pi logs → local + optional CloudWatch agent

---

## Cost Estimation (POC)

**Monthly AWS Costs (24/7 operation):**
- IoT Core: ~$5 (1 device, 2.6M messages/month)
- Lambda: ~$10 (processing + analysis)
- DynamoDB: ~$5 (on-demand, low volume)
- S3: ~$2 (raw data storage)
- SES: ~$1 (alerts)
- Claude API: ~$20-50 (depending on analysis frequency)

**Total: ~$45-75/month** for POC

---

## Next Steps

1. ✅ Architecture design (this document)
2. Set up Raspberry Pi data collector
3. Implement cloud streamer
4. Deploy AWS infrastructure (CloudFormation/CDK)
5. Integrate Claude API
6. Build web dashboard
7. Implement alert worker
8. End-to-end testing
9. Documentation & deployment guide
