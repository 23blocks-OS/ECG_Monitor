# ECG Monitor - AI-Powered Portable ECG System

> Professional ECG monitoring for hospitals, clinics, and personal use - powered by AI

**By Juan Pelaez**

🎉 **NEW: Free for Medical Institutions, Non-Profits & Government Healthcare**

## Overview

A comprehensive IoT health monitoring system that runs on Raspberry Pi, streams ECG data to AWS cloud, analyzes patterns using Claude AI, and provides real-time insights through dual web dashboards. Designed to fill the gap left by consumer devices like Garmin that don't detect arrhythmias or use AI for pattern recognition.

### 🏥 Two Portal System

**Provider Portal** (`dashboard-org`) - For Healthcare Professionals
- Monitor multiple patients from a single dashboard
- Search and select patients within your organization
- View real-time ECG data for any patient
- Track organization-wide statistics
- Manage shared device pools

**Patient Portal** (`dashboard-next`) - For Individual Patients
- Personal health dashboard
- View own ECG recordings and metrics
- Access health history and AI insights
- Track progress over time

### Key Features

- **24/7 Continuous Monitoring** - Track heart activity around the clock
- **AI-Powered Analysis** - Claude API detects arrhythmias and patterns
- **Real-time Alerts** - Email notifications for anomalies
- **Cloud-Based** - AWS infrastructure for scalable processing
- **Web Dashboard** - Near real-time visualization
- **Exercise Tracking** - Monitor heart during workouts

### Hardware

- **Raspberry Pi 4** (or 3B+)
- **CJMCU-1293** (ADS1293 3-channel ECG module)
- **3-lead ECG electrodes**

### Technology Stack

- **Edge:** Python, SPI, MQTT
- **Cloud:** AWS (IoT Core, Lambda, DynamoDB, S3, SQS, API Gateway)
- **AI:** Anthropic Claude API (Claude 3.5 Sonnet)
- **Frontend:** HTML5, JavaScript, Chart.js

---

## Quick Start

### 🚀 One-Click Installation (Recommended)

The easiest way to get started! Interactive wizard handles everything:

```bash
# Clone repository
git clone https://github.com/23blocks-OS/ECG_Monitor.git
cd ECG_Monitor

# Run the installer
./install.sh
```

The installer will:
- ✅ Validate prerequisites (AWS CLI, Terraform, Python)
- ✅ Guide you through configuration questions
- ✅ Deploy complete AWS infrastructure automatically
- ✅ Generate Raspberry Pi configuration
- ✅ Provide setup instructions

**Time:** 15-20 minutes | **Cost:** ~$45-75/month

📖 **[Complete Installation Guide →](INSTALL.md)**

---

### 📋 Prerequisites

Before running the installer, ensure you have:

- **AWS Account** with billing enabled
- **AWS CLI** configured (`aws configure`)
- **Terraform** >= 1.5.0
- **Python** 3.9+
- **Node.js** 18+ (for dashboards)
- **Anthropic Claude API key** from [console.anthropic.com](https://console.anthropic.com/)

**Hardware** (for data collection):
- Raspberry Pi 4 (4GB RAM) or 3B+
- CJMCU-1293 ECG module
- 3-lead ECG electrodes
- 32GB+ microSD card

---

### 🛠️ Manual Deployment (Alternative)

For advanced users who prefer manual control:

<details>
<summary>Click to expand manual deployment steps</summary>

#### 1. Configure

```bash
# Clone repository
git clone https://github.com/23blocks-OS/ECG_Monitor.git
cd ECG_Monitor

# Create Terraform configuration
cd terraform/environments/poc
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your values:
# - alert_email (your email)
# - anthropic_api_key (Claude API key)
```

#### 2. Deploy to AWS

```bash
# Return to project root
cd ../../..

# Run automated deployment
./deploy.sh

# This will:
# - Build Lambda packages
# - Deploy Terraform infrastructure
# - Upload web dashboard to S3
# - Generate Pi configuration
```

</details>

---

### 4. Setup Raspberry Pi

```bash
# Copy generated config to Pi
scp config/pi-config-deployed.yaml pi@raspberrypi:~/

# On Raspberry Pi:
ssh pi@raspberrypi

# Clone repo and install
git clone https://github.com/23blocks-OS/ECG_Monitor.git
cd ECG_Monitor

# Install dependencies
cd pi-collector
pip3 install -r requirements.txt

cd ../pi-streamer
pip3 install -r requirements.txt

# Setup certificates (from Terraform output)
mkdir -p ~/certs
# Copy device.crt, device.key, AmazonRootCA1.pem to ~/certs/
```

### 5. Run

```bash
# On Raspberry Pi - start both services
cd ~/ECG_Monitor
python3 pi-collector/main.py &
python3 pi-streamer/main.py &

# Open web dashboard
# Visit: https://<cloudfront-url> (from terraform output)
```

---

## Documentation

- **[Architecture](ARCHITECTURE.md)** - System design and components
- **[Project Structure](PROJECT_STRUCTURE.md)** - Code organization
- **[Data Flow](DATA_FLOW.md)** - Detailed data pipeline
- **[Requirements](REQUIREMENTS.md)** - Hardware, software, and prerequisites
- **[Setup Guides](docs/)** - Step-by-step instructions

---

## Project Status

✅ **Status:** POC Complete - Ready for Testing

### Completed
- ✅ Architecture design & documentation
- ✅ Terraform infrastructure (IoT, Lambda, DynamoDB, S3, API Gateway)
- ✅ Raspberry Pi data collector (CJMCU-1293 SPI driver)
- ✅ Cloud streamer (AWS IoT Core MQTT)
- ✅ Lambda functions (4 functions):
  - Preprocessor (metrics calculation)
  - AI Analyzer (Claude 3.5 Sonnet integration)
  - Alert Worker (email notifications)
  - API Handler (REST endpoints)
- ✅ Web dashboard (Chart.js visualization)
- ✅ Deployment automation

### Testing
- ⏳ End-to-end hardware testing
- ⏳ Long-term stability testing
- ⏳ Claude API accuracy validation

### Future Enhancements
- ⏳ Mobile app
- ✅ Multi-user support (COMPLETED - Provider Portal launched)
- ✅ Organization management (COMPLETED)
- ⏳ Advanced ML models
- ⏳ Integration with EMR/EHR systems

---

## 🏥 For Healthcare Organizations

### Quick Start for Clinics

**Want to deploy this for your clinic, hospital, or healthcare organization?**

📋 [Clinic Quick Start Guide](CLINIC_QUICK_START.md) - Get running in 2 hours
📖 [Full Deployment Guide](ORGANIZATION_DEPLOYMENT_GUIDE.md) - Comprehensive setup

### Why Use This for Your Organization?

✅ **100% Free** - No licensing costs for medical institutions, non-profits, government
✅ **Complete System** - Both provider and patient portals included
✅ **Low Operating Cost** - ~$30/month AWS for small clinic (20 patients)
✅ **Own Your Data** - Deploy in your own AWS account, full control
✅ **HIPAA-Ready** - Encryption, access controls, audit logging built-in
✅ **Open Source** - Customize to your needs, no vendor lock-in

### What You Get

- **Provider Portal** for doctors/nurses to monitor all patients
- **Patient Portal** for patients to view their own data
- **Multi-patient support** with organization management
- **Device pool management** for shared ECG monitors
- **Role-based access** (admin, doctor, nurse, patient)
- **Organization statistics** dashboard
- **Patient search** and selection
- **Real-time ECG monitoring** for all patients

### Cost Breakdown

**Small Clinic (20 patients, 5 devices)**
- AWS: ~$30-50/month
- Hardware: $115 per device (one-time)
- License: **$0** (free for medical/non-profit)

**Medium Hospital (200 patients, 50 devices)**
- AWS: ~$100-150/month
- Hardware: $5,750 (50 devices, one-time)
- License: **$0** (free for medical/non-profit)

---

## Cost Estimate

**Hardware (One-time):** ~$115
- Raspberry Pi 4: $55
- CJMCU-1293: $25
- Accessories: $35

**Monthly Operating:** ~$45-85
- AWS Services: $20-30
- Claude API: $20-50
- Electricity: $2-5

---

## Safety & Disclaimers

⚠️ **Important Notice:**

- This is a **personal research project**, not a medical device
- **NOT intended for clinical diagnosis or treatment**
- **NOT FDA approved or CE marked**
- Always consult healthcare professionals for medical decisions
- Use at your own risk

---

## Contributing

This is a personal project, but suggestions and feedback are welcome!

1. Open an issue for bugs or feature requests
2. Fork the repository for your own experiments
3. Share your learnings!

---

## License

**Dual-Use License**

This software is free for:
- ✅ **Medical institutions** (hospitals, clinics, medical practices)
- ✅ **Non-profit organizations** providing healthcare
- ✅ **Government healthcare facilities**
- ✅ **Research institutions** (with IRB approval)
- ✅ **Personal use**

For commercial/for-profit use, a commercial license is required.

See [LICENSE](LICENSE) for full details.

**Important**: This is NOT a medical device and is NOT FDA approved. Always consult healthcare professionals and follow standard clinical protocols.

---

## Acknowledgments

- **Hardware:** Texas Instruments ADS1293 ECG chip
- **AI:** Anthropic Claude API
- **Cloud:** AWS
- **Inspiration:** Need for better personal heart monitoring

---

## Contact

**Juan Pelaez**
- GitHub: [@23blocks-OS](https://github.com/23blocks-OS)
- Project: [ECG_Monitor](https://github.com/23blocks-OS/ECG_Monitor)

---

## References

- [ADS1293 Datasheet](https://www.ti.com/product/ADS1293)
- [AWS IoT Core Documentation](https://docs.aws.amazon.com/iot/)
- [Claude API Documentation](https://docs.anthropic.com/)
- [ECG Signal Processing](https://en.wikipedia.org/wiki/Electrocardiography)
