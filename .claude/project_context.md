# ECG Monitor - Project Context for Claude

## Project Identity

**Name:** ECG Monitor - AI-Powered Portable ECG System
**Author:** Juan Pelaez (@23blocks-OS)
**Repository:** github.com/23blocks-OS/ECG_Monitor
**Status:** POC Complete - Ready for Testing (8.5/10 maturity)
**Last Updated:** November 6, 2025

## Mission Statement

Bridge the gap between consumer health devices and clinical ECG systems by providing an accessible, affordable, AI-powered cardiac monitoring solution for underserved markets, healthcare institutions, and personal health enthusiasts.

## Core Architecture

**System Type:** Edge + Cloud Hybrid IoT Health Monitoring
**Data Flow:** Raspberry Pi → AWS IoT Core → Lambda Processing → Web Dashboards

### Components
1. **Edge Layer (Raspberry Pi)**
   - `pi-collector/` - Hardware interface with CJMCU-1293 ECG module (SPI)
   - `pi-streamer/` - MQTT data streaming to AWS IoT Core

2. **Cloud Layer (AWS)**
   - IoT Core - Device gateway (MQTT, X.509 auth)
   - Lambda - 4 functions (preprocessor, AI analyzer, alert worker, API handler)
   - DynamoDB - Metadata storage (sessions, alerts, analysis, users, organizations)
   - S3 - Raw/processed ECG data archival
   - SQS - Lambda message queuing
   - API Gateway - REST API for dashboards
   - SES - Email notifications

3. **Frontend Layer**
   - `dashboard-next/` - Patient Portal (Next.js 14 + React 18 + TypeScript)
   - `dashboard-org/` - Provider Portal (Next.js 14 - multi-patient monitoring)
   - `mobile-app/` - Mobile App (Expo + React Native)

## Technology Stack

**Edge:** Python 3.9+, SPI (spidev), GPIO, scipy (signal processing)
**Cloud:** AWS (serverless), Python 3.11 (Lambda), Terraform 1.5+
**AI:** Anthropic Claude 3.5 Sonnet
**Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS, Chart.js
**Mobile:** Expo 52, React Native 0.76, Bluetooth LE

## Target Users & Deployment Models

### Primary Personas
1. **DIY Technical Enthusiast** - Personal health monitoring, builds from source
2. **Click-and-Go User** - One-click installer, minimal technical knowledge
3. **Nonprofit Healthcare Organization** - Clinics in underserved areas
4. **Government Healthcare Facility** - Public health institutions
5. **Medical Practice** - Small/medium private practices (with license compliance)
6. **SaaS Customer** - Managed service, device delivery, turnkey solution

### Deployment Scenarios
- **Self-Hosted (Own AWS):** One-click install via `install.sh` (15-20 min)
- **Managed Service (Future):** SaaS offering with device delivery
- **Research Institution:** Custom deployment with IRB compliance
- **Enterprise Hospital:** Multi-tenant with 100s-1000s of patients

## Business Model

**Dual-Use Licensing:**
- **FREE for:**
  - Medical institutions (hospitals, clinics, practices)
  - Non-profit healthcare organizations
  - Government healthcare facilities
  - Research institutions (with IRB approval)
  - Individual personal use

- **Commercial License Required for:**
  - For-profit healthcare services
  - Commercial medical device companies
  - SaaS/managed service providers
  - White-label solutions

**Revenue Streams (Potential):**
1. Commercial licenses
2. Support services (premium support, custom development)
3. Managed cloud hosting (future SaaS)
4. Training and certification
5. EHR/EMR custom integrations

## Cost Structure

**Hardware (One-time):** ~$115/device
- Raspberry Pi 4 (4GB): $55
- CJMCU-1293: $25
- Accessories: $35

**Monthly Operating Costs:**
- Small clinic (20 patients, 5 devices): $25-50 AWS + $20-50 Claude API
- Medium hospital (200 patients, 50 devices): $100-150 AWS
- Individual: $45-85/month

## Key Features (Current)

✅ **Implemented:**
- 24/7 ECG data collection (3-lead, 250-500 Hz)
- Real-time signal filtering (notch 60Hz, bandpass 0.5-40Hz)
- Cloud streaming with offline buffering (500MB cache)
- AI-powered analysis (Claude 3.5 Sonnet)
- Arrhythmia detection (AFib, PVCs, PACs, bradycardia, tachycardia)
- Email alerts (AWS SES)
- Web dashboards (real-time visualization)
- Multi-user organization support
- Role-based access (admin, doctor, nurse, patient, caregiver)
- Device pool management
- Mobile app (iOS/Android/Web) with BLE
- One-click installation wizard
- Terraform-automated infrastructure

⏳ **In Progress:**
- End-to-end hardware testing (designed but not validated at scale)
- Mobile app cloud integration
- Advanced analytics dashboards

❌ **Not Yet Implemented:**
- Production authentication (dev mode only - HIGH PRIORITY GAP)
- CI/CD pipeline
- HIPAA Business Associate Agreement
- Custom ML models (beyond Claude)
- EHR/EMR integrations
- Multi-language support

## Critical Gaps & Priorities

### HIGH PRIORITY (Blocks Production)
1. **Production Authentication** - Currently dev mode only (any credentials work)
   - Implement: AWS Cognito or Auth0
   - Add: MFA, session management, user isolation testing
2. **End-to-End Hardware Testing** - Designed but not validated
   - Run: 24/7 stability test (30+ days)
   - Measure: Latency, reliability, failure modes
3. **HIPAA Compliance Review** - If targeting healthcare
   - Security risk assessment
   - Business Associate Agreement with AWS
   - Audit logging enhancements

### MEDIUM PRIORITY (Quality/Scale)
1. **CI/CD Pipeline** - GitHub Actions for automated testing
2. **API Documentation** - Formal API reference
3. **Scalability Testing** - Load test at 1000+ users
4. **Monitoring & Alerting** - CloudWatch alarms, status page

### LOW PRIORITY (Future Enhancement)
1. Mobile app full integration
2. Custom ML models
3. Multi-language support
4. Advanced visualizations

## Code Organization

```
ECG_Monitor/
├── pi-collector/          # Raspberry Pi ECG data collection
├── pi-streamer/          # Cloud streaming (MQTT)
├── lambda/               # AWS Lambda functions (4 functions)
│   ├── preprocessor/     # Metrics computation
│   ├── ai-analyzer/      # Claude API integration
│   ├── alert-worker/     # Email notifications
│   └── api-handler/      # REST API endpoints
├── dashboard-next/       # Patient Portal (Next.js)
├── dashboard-org/        # Provider Portal (Next.js)
├── mobile-app/           # Mobile App (Expo)
├── terraform/            # Infrastructure as Code
│   └── environments/     # poc, prod, etc.
├── docs/                 # 48 documentation files
├── test-data/           # Realistic ECG scenarios (14 files)
└── scripts/             # Deployment automation
```

## Documentation Quality

**Comprehensive (9/10)** - 48 markdown files covering:
- Architecture & design decisions
- Setup guides (one-click, manual, clinic, organization)
- Data flow & schema
- Testing guide
- Marketing materials
- Licensing framework

**Notable Files:**
- `ARCHITECTURE.md` - System design (8.6 KB)
- `DESIGN_DECISIONS.md` - Rationale (18 documented decisions)
- `HEALTH_DATA_SCHEMA.md` - Database schema (21.4 KB)
- `CLINIC_QUICK_START.md` - 2-hour clinic setup
- `ORGANIZATION_DEPLOYMENT_GUIDE.md` - Enterprise deployment

**Gaps:**
- API reference documentation
- Troubleshooting guide
- Video tutorials

## Testing Status

**Test Infrastructure:** Good
- 14 realistic ECG test scenarios (normal, AFib, PVCs, tachycardia)
- Mock hardware drivers for development
- End-to-end pipeline simulator

**Gaps:**
- No automated unit tests in CI/CD
- No hardware integration testing
- No load/performance testing
- Test coverage: ~5/10

## Security & Compliance

✅ **Implemented:**
- TLS 1.2+ for all transit
- S3/DynamoDB encryption at rest (AES-256)
- X.509 device certificates (not passwords)
- IAM role-based access
- Secrets Manager for API keys

❌ **Missing for HIPAA:**
- Production authentication system
- Audit logs with immutable storage
- Risk assessment documentation
- Breach notification procedures
- Business Associate Agreement

⚠️ **Medical Device Disclaimer:**
- NOT a medical device
- NOT FDA approved or CE marked
- NOT for clinical diagnosis/treatment
- Personal research project only

## AI Integration Strategy

**Current:** Claude 3.5 Sonnet via Anthropic API
- Analyzes every 10th batch (~10% sampling) for cost optimization
- Detects: AFib, PVCs, PACs, bradycardia, tachycardia
- Returns: Structured JSON with confidence scores
- Cost: ~$8.64/day (vs $86/day for 100% sampling)

**Future:** Custom ML models trained on collected ECG data

## Recent Developments (Last 30 Days)

1. ✅ Multi-tenant organization support
2. ✅ Provider Portal for healthcare professionals
3. ✅ Mobile app (Expo + React Native + BLE)
4. ✅ Onboarding wizard system
5. ✅ Device pool management
6. ✅ One-click installation questionnaire

## Key Design Decisions

1. **Edge + Cloud Hybrid** - Local buffering + cloud processing for reliability
2. **Serverless Architecture** - Cost-effective, scales automatically
3. **Multi-Transport** - WiFi primary, Bluetooth secondary, offline caching
4. **X.509 Certificates** - More secure than password-based auth
5. **10% AI Sampling** - Balances cost vs coverage
6. **Dual Licensing** - Free for healthcare, commercial for profit
7. **Open Source** - No vendor lock-in, community-driven

## Development Guidelines

**Code Style:**
- Python: snake_case, docstrings required, type hints encouraged
- TypeScript: PascalCase for components, camelCase for functions
- Configuration: YAML for Pi, Terraform for infrastructure

**Git Workflow:**
- Feature branches: `claude/*`, `feature/*`
- Commit messages: Clear, descriptive (see git log for style)
- No secrets in repo (use Secrets Manager)

**Testing:**
- Mock hardware available for development
- Test data in `test-data/` directory
- Integration tests in `test-integration/`

## Common Operations

**Deploy Infrastructure:**
```bash
./install.sh  # One-click wizard
# OR
./deploy.sh   # Manual deployment
```

**Deploy Dashboards:**
```bash
cd dashboard-org && npm install && vercel deploy --prod
cd dashboard-next && npm install && vercel deploy --prod
```

**Test Locally:**
```bash
# Use mock hardware
python3 pi-collector/main.py --mock
python3 pi-streamer/main.py --mock
```

**Terraform Operations:**
```bash
cd terraform/environments/poc
terraform init
terraform plan
terraform apply
```

## Support & Community

**Author:** Juan Pelaez
**Contact:** GitHub @23blocks-OS
**Issues:** https://github.com/23blocks-OS/ECG_Monitor/issues
**License:** Dual-use (see LICENSE file)

**Contributing:**
- Personal project but feedback welcome
- Open issues for bugs/features
- Fork for experiments

## Future Roadmap

**Phase 1 (Current):** POC validation
- ⏳ Hardware testing
- ⏳ Production auth
- ⏳ HIPAA review

**Phase 2 (Next 6 months):** Small clinic deployments
- CI/CD pipeline
- API documentation
- Support tier establishment

**Phase 3 (Future):** Enterprise & SaaS
- Managed service offering
- EHR/EMR integrations
- Custom ML models
- Multi-language support

## Success Metrics

**Maturity:** 8.5/10
- Architecture: 9/10
- Documentation: 9/10
- Code Quality: 7/10
- Testing: 5/10
- Completeness: 7/10

**Ready For:**
- ✅ POC testing by individuals
- ✅ Small clinic deployment (with auth added)
- ✅ Research projects (with IRB)
- ✅ Non-profit organizations

**Not Ready For:**
- ❌ Large hospital deployments (need auth + compliance)
- ❌ Commercial healthcare service (need HIPAA)
- ❌ FDA-regulated use (regulatory pathway unclear)

---

*This context file is maintained to help Claude understand the project comprehensively in future sessions. Update as major changes occur.*
