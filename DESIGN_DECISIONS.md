# Design Decisions & Rationale

## Overview
This document captures key architectural and technical decisions made for the ECG Monitor project, along with rationale and alternatives considered.

---

## Architecture Decisions

### AD-001: Edge + Cloud Hybrid Architecture

**Decision:** Process basic filtering on Raspberry Pi, perform AI analysis in cloud

**Rationale:**
- Pi has limited compute for real-time AI inference
- Claude API requires internet connectivity anyway
- Cloud allows for model updates without Pi firmware changes
- Enables historical analysis and pattern learning
- Cost-effective (vs. running GPU on edge)

**Alternatives Considered:**
- **Full edge processing:** Would require local ML model, limited by Pi compute
- **Cloud-only:** Would require high bandwidth, latency issues for real-time monitoring

**Trade-offs:**
- ✅ Scalable AI capabilities
- ✅ Easy model updates
- ❌ Depends on internet connectivity
- ❌ Ongoing cloud costs

---

### AD-002: AWS as Cloud Provider

**Decision:** Use AWS for all cloud infrastructure

**Rationale:**
- Mature IoT Core service (MQTT, device management)
- Comprehensive service ecosystem (Lambda, DynamoDB, S3, SQS)
- Pay-as-you-go pricing suitable for POC
- Good documentation and community support
- Author's familiarity with AWS

**Alternatives Considered:**
- **Google Cloud Platform:** Strong ML tools, but less mature IoT
- **Azure:** Good IoT Hub, but more enterprise-focused
- **Self-hosted:** Lower cost long-term, but higher complexity and maintenance

**Trade-offs:**
- ✅ Full-featured, mature services
- ✅ Fast development
- ❌ Vendor lock-in
- ❌ Higher cost than self-hosting

---

### AD-003: Claude API for AI Analysis

**Decision:** Use Anthropic Claude API (3.5 Sonnet) for ECG analysis

**Rationale:**
- Strong reasoning capabilities for medical data interpretation
- Large context window (200K tokens) for detailed ECG data
- JSON mode for structured responses
- Good at pattern recognition and anomaly detection
- Safe, helpful responses with medical disclaimers

**Alternatives Considered:**
- **GPT-4:** Similar capabilities, but slightly more expensive
- **Open-source models:** (Llama, Mistral) Would require self-hosting, limited medical knowledge
- **Rule-based system:** Less flexible, requires extensive medical expertise to build

**Trade-offs:**
- ✅ State-of-the-art AI capabilities
- ✅ No model hosting required
- ✅ Continuous improvements from Anthropic
- ❌ Ongoing API costs (~$20-50/month)
- ❌ Depends on external service

---

### AD-004: 3-Lead ECG vs 12-Lead

**Decision:** Use 3-lead ECG (CJMCU-1293)

**Rationale:**
- Sufficient for arrhythmia detection
- Portable and wearable
- Lower cost (~$25 vs $200+)
- Adequate for personal monitoring
- Can detect: AFib, PVCs, PACs, bradycardia, tachycardia

**Limitations:**
- Cannot detect all cardiac conditions (vs 12-lead clinical ECG)
- Less spatial resolution
- Not suitable for detailed cardiac mapping

**Trade-offs:**
- ✅ Portable, affordable
- ✅ Good for continuous monitoring
- ❌ Limited diagnostic capabilities vs clinical ECG

---

## Data Flow Decisions

### AD-005: 10-Second Batch Streaming

**Decision:** Stream ECG data in 10-second batches

**Rationale:**
- Balance between real-time and bandwidth efficiency
- 10 seconds = 2,500 samples per channel (at 250 Hz)
- Batch size: ~20 KB compressed
- Provides enough context for heart rate calculation
- Reasonable latency for alerts (~1 minute total)

**Alternatives Considered:**
- **1-second batches:** More real-time, but 10x network overhead
- **60-second batches:** Better compression, but too much latency for alerts

**Trade-offs:**
- ✅ Good balance of latency and efficiency
- ✅ Enables offline buffering (30 seconds buffer)
- ❌ Not truly "real-time" (<1 second)

---

### AD-006: MQTT via AWS IoT Core

**Decision:** Use MQTT protocol for device-to-cloud communication

**Rationale:**
- Lightweight binary protocol
- Built-in reconnection and message acknowledgment (QoS 1)
- AWS IoT Core native support
- Efficient for IoT devices
- TLS 1.2 encryption built-in

**Alternatives Considered:**
- **HTTPS REST API:** Simpler, but higher overhead per request
- **WebSocket:** Good for bidirectional, but more complex
- **Direct SQS:** No device management features

**Trade-offs:**
- ✅ Efficient, reliable
- ✅ Built-in device authentication (X.509)
- ❌ Requires MQTT client library

---

### AD-007: Lambda for Compute

**Decision:** Use AWS Lambda for all processing (vs EC2/ECS)

**Rationale:**
- Event-driven architecture (triggered by SQS, DynamoDB Streams)
- No server management
- Auto-scaling
- Pay per execution (cost-effective for POC)
- Fast deployment

**Alternatives Considered:**
- **EC2 instances:** More control, but requires management and runs 24/7
- **ECS containers:** Good for complex apps, overkill for simple functions

**Trade-offs:**
- ✅ Serverless, scales to zero
- ✅ Low cost for POC
- ❌ Cold start latency (~1-3 seconds)
- ❌ 15-minute execution limit

---

### AD-008: DynamoDB for Metadata

**Decision:** Use DynamoDB for sessions, alerts, and analysis results

**Rationale:**
- Fully managed NoSQL
- On-demand billing (no provisioning for POC)
- Fast key-value lookups
- DynamoDB Streams for triggering alerts
- Integrated with Lambda

**Alternatives Considered:**
- **RDS (PostgreSQL):** Relational model, but requires provisioning and management
- **S3 only:** Cheaper, but slow queries

**Trade-offs:**
- ✅ Fast, managed, scalable
- ✅ Streams for event-driven alerts
- ❌ Limited query capabilities vs SQL
- ❌ Costs increase with scale

---

### AD-009: S3 for Raw Data Archive

**Decision:** Store all raw ECG batches in S3

**Rationale:**
- Cheap long-term storage ($0.023/GB/month)
- Unlimited capacity
- Enables future re-analysis with better models
- Data lake for ML training
- Compliance/audit trail

**Alternatives Considered:**
- **DynamoDB only:** Too expensive for large binary data
- **No archival:** Loses raw data, can't reprocess

**Trade-offs:**
- ✅ Very cheap storage
- ✅ Enables future innovation
- ❌ Slow retrieval (not for real-time)

---

## Technology Stack Decisions

### AD-010: Python for All Components

**Decision:** Use Python for Pi code, Lambda functions, and scripts

**Rationale:**
- Single language across stack
- Excellent libraries: scipy, numpy (signal processing), boto3 (AWS)
- RPi.GPIO and spidev support
- Fast development
- Author's expertise

**Alternatives Considered:**
- **C/C++:** Faster, but slower development
- **Node.js:** Good for Lambda, but poor for signal processing
- **Mixed stack:** Complexity overhead

**Trade-offs:**
- ✅ Unified codebase, fast development
- ✅ Rich ecosystem
- ❌ Slower than compiled languages (acceptable for POC)

---

### AD-011: Vanilla JavaScript for Dashboard

**Decision:** Use vanilla JS with Chart.js (no React/Vue/Angular)

**Rationale:**
- Simple POC requirements
- No build step needed
- Fast loading (no framework overhead)
- Easy deployment to S3
- Sufficient for current needs

**Future Consideration:**
- May migrate to React if complexity grows

**Trade-offs:**
- ✅ Simple, fast, lightweight
- ❌ Less structured for complex UIs

---

### AD-012: CloudFormation for IaC

**Decision:** Use AWS CloudFormation for infrastructure as code

**Rationale:**
- Native AWS service
- YAML templates (human-readable)
- Stack-based deployment (easy cleanup)
- Free (no additional cost)
- Good for POC

**Future Consideration:**
- May migrate to AWS CDK (Python) for better reusability

**Alternatives Considered:**
- **Terraform:** Cloud-agnostic, but extra tool to learn
- **AWS CDK:** More powerful, but higher learning curve
- **Manual console:** Not repeatable, error-prone

**Trade-offs:**
- ✅ Native, free, declarative
- ❌ Verbose compared to CDK

---

## Security Decisions

### AD-013: X.509 Certificates for Device Auth

**Decision:** Use X.509 certificates (not username/password)

**Rationale:**
- AWS IoT Core best practice
- More secure than credentials
- Mutual TLS authentication
- Certificate can't be phished
- Easy revocation

**Trade-offs:**
- ✅ Very secure
- ❌ Certificate management overhead

---

### AD-014: Encryption Everywhere

**Decision:** Encrypt data at rest and in transit

**Rationale:**
- Medical data sensitivity
- Best practice for personal health information
- Required for potential future compliance
- Minimal performance impact

**Implementation:**
- S3: SSE-S3 (AES-256)
- DynamoDB: KMS encryption at rest
- Transit: TLS 1.2+

---

## Cost Optimization Decisions

### AD-015: Batch AI Analysis (Not Every Sample)

**Decision:** Analyze every 10th batch with Claude API (every 100 seconds)

**Rationale:**
- Reduces Claude API costs by 90% (8,640 → 864 calls/day)
- Daily cost: $86 → ~$8.64
- Still provides timely analysis
- Can increase frequency for specific scenarios (e.g., during exercise)

**Trade-offs:**
- ✅ Dramatically lower costs
- ❌ Slightly delayed AI insights

---

### AD-016: DynamoDB On-Demand Billing

**Decision:** Use on-demand (vs provisioned capacity)

**Rationale:**
- Unknown traffic patterns in POC
- No need to estimate RCU/WCU
- Avoid over-provisioning costs
- Easy to switch to provisioned later

**Trade-offs:**
- ✅ Flexible, no tuning needed
- ❌ Slightly higher cost per request (acceptable for POC volume)

---

## Performance Decisions

### AD-017: Local Buffering on Pi

**Decision:** Buffer 30 seconds of ECG data locally on Pi

**Rationale:**
- Handles temporary network issues
- Ensures no data loss during brief outages
- Smooths out network jitter
- Up to 500 MB cache for extended offline periods

**Trade-offs:**
- ✅ Resilient to network issues
- ❌ Requires SD card space

---

### AD-018: Signal Processing on Edge

**Decision:** Perform basic filtering (notch, bandpass) on Raspberry Pi

**Rationale:**
- Reduces noise before transmission
- Smaller data payloads
- More meaningful data for AI analysis
- Pi has sufficient CPU for filtering

**Trade-offs:**
- ✅ Better data quality, smaller payloads
- ❌ Slightly higher Pi CPU usage

---

## Open Questions & Future Decisions

### Q-001: Activity Recognition
**Question:** Should we integrate accelerometer for activity detection?

**Options:**
- Add MPU6050 accelerometer to Pi
- Use phone's accelerometer via Bluetooth
- Manual logging via dashboard

**Decision:** Deferred to Phase 2

---

### Q-002: Multi-Device Support
**Question:** How to handle multiple users/devices?

**Current:** Single device (ecg-device-001)
**Future:** Add device_id routing, per-user dashboards

**Decision:** Single device for POC, design for future scalability

---

### Q-003: Data Retention Policy
**Question:** How long to retain raw ECG data?

**Options:**
- 30 days: Sufficient for recent analysis
- 90 days: Better for trend analysis
- 1 year+: Maximum historical data
- Forever: Complete archive

**Current Decision:** 90 days (configurable)

---

## Lessons Learned (To Be Updated)

This section will be populated as the project progresses:

- TBD: Performance bottlenecks
- TBD: Cost surprises
- TBD: Architecture issues discovered
- TBD: Better approaches identified
