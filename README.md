# ECG Monitor - AI-Powered Portable ECG System

> Professional ECG monitoring for hospitals, clinics, and personal use - powered by AI

**By Juan Pelaez** | [GitHub](https://github.com/23blocks-OS/ECG_Monitor)

🎉 **NEW: Free for Medical Institutions, Non-Profits & Government Healthcare**

## Overview

A comprehensive IoT health monitoring system that brings hospital-grade ECG monitoring to everyone. Built on Raspberry Pi hardware, AWS cloud infrastructure, and Claude AI analysis, it provides real-time cardiac insights through professional web dashboards.

**Designed to fill the gap:** Consumer devices like Garmin don't detect arrhythmias or use AI for medical-grade pattern recognition. ECG Monitor does both.

---

## Who Is This For?

Choose your path to get started:

| User Type | Description | Get Started |
|-----------|-------------|-------------|
| 🛠️ **DIY Technical User** | Build and customize everything yourself | [DIY Guide](#diy-technical-setup) |
| 🚀 **Click-and-Go User** | Simple one-click installation | [Quick Start](#-one-click-installation-recommended) |
| 🏥 **Nonprofit Healthcare** | Free for clinics in underserved areas | [Nonprofit Guide](#-for-nonprofit-healthcare) |
| 🏛️ **Government Facility** | Public health institutions | [Government Guide](#-for-government-institutions) |
| 🩺 **Medical Practice** | Private practices with licensing | [Medical Practice Guide](#-for-medical-practices) |
| 💳 **SaaS Customer** | Fully managed service (coming soon) | [SaaS Info](#-managed-saas-coming-soon) |

---

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

## User Journey Guides

### 🛠️ DIY Technical Setup

**For developers and technical enthusiasts who want full control:**

**You'll Need:**
- Familiarity with: AWS, Terraform, Python, Linux, React
- Time investment: 3-5 hours first time
- Total cost: $115 hardware + $45-85/month

**Your Journey:**
1. Set up AWS account and tools (AWS CLI, Terraform)
2. Get Claude API key from console.anthropic.com
3. Clone repo and configure `terraform.tfvars`
4. Deploy infrastructure: `./deploy.sh`
5. Set up Raspberry Pi with hardware
6. Deploy dashboards to Vercel or self-host
7. Customize code to your needs

**Benefits:**
- ✅ Complete control and customization
- ✅ Learn IoT, cloud architecture, AI integration
- ✅ Contribute back to open source
- ✅ No vendor lock-in

**Start Here:** [BUILD_GUIDE.md](BUILD_GUIDE.md) | [ARCHITECTURE.md](ARCHITECTURE.md)

---

### 🏥 For Nonprofit Healthcare

**Free for clinics serving underserved communities:**

**Perfect For:**
- Community health centers
- Free clinics
- Charitable hospitals
- Medical missions
- Health NGOs

**What You Get:**
- ✅ **Zero licensing costs** - 100% free
- ✅ **Complete system** - Provider + patient portals
- ✅ **Multi-patient monitoring** - Unlimited patients
- ✅ **Low operating cost** - $25-50/month for 20 patients
- ✅ **Your own AWS** - Full data control
- ✅ **Open source** - Customize as needed

**Setup Time:** 2 hours with our guided installer

**Your Journey:**
1. Run one-click installer: `./install.sh`
2. Follow questionnaire (validates prerequisites)
3. Infrastructure deploys automatically
4. Deploy patient and provider portals
5. Create organization and add staff
6. Start monitoring patients

**Cost Example:**
- 20 patients, 5 devices
- Hardware: $575 one-time
- AWS: $25-50/month
- License: **$0**

**Start Here:** [CLINIC_QUICK_START.md](CLINIC_QUICK_START.md)

---

### 🏛️ For Government Institutions

**Free for public health facilities:**

**Perfect For:**
- Public hospitals
- Veterans Affairs facilities
- Department of Health programs
- Public health research
- Emergency response teams

**Why Choose This:**
- ✅ **No licensing fees** - Free for government use
- ✅ **Data sovereignty** - Deploy in your own cloud/on-prem
- ✅ **Compliance ready** - Encryption, audit logs, access control
- ✅ **Scalable** - From pilot (10 patients) to facility-wide (1000+)
- ✅ **Customizable** - Adapt to your protocols and requirements

**Deployment Models:**
- AWS GovCloud (for compliance requirements)
- Standard AWS (for general use)
- Future: On-premise deployment option

**Your Journey:**
1. Security review and approval
2. Cloud infrastructure setup (AWS/GovCloud)
3. One-click deployment
4. User management and training
5. Integration with existing systems (future)

**Cost Estimate (50 patients):**
- Hardware: $1,150 (10 devices)
- AWS: $50-100/month
- License: **$0**

**Start Here:** [ORGANIZATION_DEPLOYMENT_GUIDE.md](ORGANIZATION_DEPLOYMENT_GUIDE.md)

---

### 🩺 For Medical Practices

**Private practices with clear licensing:**

**Perfect For:**
- Cardiology practices
- Primary care with ECG
- Specialty clinics
- Private hospitals
- Telehealth providers

**Licensing:**
- **Free** if you're operating as non-profit medical institution
- **Commercial license** required for for-profit practices
- Contact: GitHub @23blocks-OS for commercial licensing

**What You Get:**
- Professional-grade ECG monitoring
- AI-powered arrhythmia detection (Claude 3.5)
- Provider dashboard for multiple patients
- Patient portal for self-monitoring
- Email alerts for abnormalities
- HIPAA-ready infrastructure

**Important:** This is NOT FDA-approved. Always use alongside standard clinical ECG equipment and protocols.

**Your Journey:**
1. Determine licensing (non-profit vs for-profit)
2. If commercial, negotiate license agreement
3. Deploy infrastructure (2 hours)
4. Configure organization and staff roles
5. Integrate into clinical workflow
6. Train staff on system use

**Cost (for-profit practice, 50 patients):**
- Hardware: $1,150 (10 devices)
- AWS: $50-100/month
- Commercial license: Contact for pricing

**Start Here:** [LICENSE](LICENSE) | [CLINIC_QUICK_START.md](CLINIC_QUICK_START.md)

---

### 💳 Managed SaaS (Coming Soon)

**Fully managed service with device delivery:**

**Perfect For:**
- Individuals wanting personal health monitoring
- Practices without technical staff
- Organizations wanting zero-setup experience
- Anyone who prefers "plug and play"

**What's Included (Planned):**
- ✅ Pre-configured Raspberry Pi device delivered to you
- ✅ Pre-installed software and certificates
- ✅ Cloud infrastructure managed for you
- ✅ Automatic updates and maintenance
- ✅ Technical support
- ✅ Dashboard hosting
- ✅ Data backup and disaster recovery

**Pricing (Estimated):**
- Personal: $29/month + $99 device
- Small practice (5 patients): $99/month + $99/device
- Medium practice (20 patients): $249/month + $89/device
- Enterprise: Custom pricing

**Your Journey:**
1. Sign up and create account
2. Choose plan and add payment method
3. Device(s) shipped to your address
4. Plug in device (auto-connects)
5. Create user accounts
6. Start monitoring immediately

**Status:** In development - Join waitlist
**Interested?** Open an issue on GitHub expressing interest

---

## 🏥 For Healthcare Organizations

### Quick Start for Clinics

**Want to deploy this for your clinic, hospital, or healthcare organization?**

📋 [Clinic Quick Start Guide](CLINIC_QUICK_START.md) - Get running in 2 hours
📖 [Full Deployment Guide](ORGANIZATION_DEPLOYMENT_GUIDE.md) - Comprehensive setup

### Why Use This for Your Organization?

✅ **Free** - No licensing costs for medical institutions, non-profits, government
✅ **Complete System** - Both provider and patient portals included
✅ **Low Operating Cost** - ~$25-50/month AWS for small clinic (20 patients)
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
- AWS: ~$25-50/month
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
