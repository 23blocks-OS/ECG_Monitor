# ECG Monitor - AI-Powered Portable ECG System

> Personal 24/7 heart monitoring with AI-powered arrhythmia detection using Claude API

**By Juan Pelaez**

## Overview

A comprehensive IoT health monitoring system that runs on Raspberry Pi, streams ECG data to AWS cloud, analyzes patterns using Claude AI, and provides real-time insights through a web dashboard. Designed to fill the gap left by consumer devices like Garmin that don't detect arrhythmias or use AI for pattern recognition.

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

### 1. Hardware Setup
```bash
# Connect CJMCU-1293 to Raspberry Pi via SPI
# See docs/setup-raspberry-pi.md for detailed wiring
```

### 2. Raspberry Pi Setup
```bash
# Clone repository
git clone https://github.com/23blocks-OS/ECG_Monitor.git
cd ECG_Monitor

# Install dependencies
cd pi-collector
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure
cp ../config/pi-config.yaml ../config/pi-config-local.yaml
# Edit pi-config-local.yaml with your settings
```

### 3. AWS Deployment
```bash
# Deploy infrastructure
cd aws-infrastructure
./scripts/deploy.sh

# Note your IoT endpoint and update Pi configuration
```

### 4. Run
```bash
# On Raspberry Pi
cd pi-collector
python main.py

# Open web dashboard
# Visit: https://your-cloudfront-url.cloudfront.net
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

🚧 **Status:** POC Development in Progress

### Completed
- ✅ Architecture design
- ✅ Project structure
- ✅ Configuration templates
- ✅ Documentation framework

### In Progress
- 🔄 Raspberry Pi data collector
- 🔄 Cloud infrastructure
- 🔄 Claude API integration

### Planned
- ⏳ Web dashboard
- ⏳ Alert system
- ⏳ End-to-end testing

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

MIT License - See [LICENSE](LICENSE) for details

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
