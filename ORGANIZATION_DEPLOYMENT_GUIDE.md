# ECG Monitor - Organization Deployment Guide

> **Complete guide for hospitals, clinics, and healthcare organizations**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Who Is This For?](#who-is-this-for)
3. [System Requirements](#system-requirements)
4. [Quick Start](#quick-start)
5. [Deployment Steps](#deployment-steps)
6. [User Management](#user-management)
7. [Device Management](#device-management)
8. [Security & Compliance](#security--compliance)
9. [Support & Training](#support--training)

---

## Overview

The ECG Monitor system provides **two complementary portals** for comprehensive cardiac monitoring:

### 🏥 Provider Portal (`dashboard-org`)
**For healthcare professionals**
- Monitor multiple patients from a single dashboard
- Search and select patients within your organization
- View real-time ECG data for any patient
- Track organization-wide statistics
- Manage device assignments

### 🏠 Patient Portal (`dashboard-next`)
**For individual patients**
- Personal health dashboard
- View own ECG recordings
- Track heart metrics over time
- Receive health insights from AI analysis

---

## Who Is This For?

This system is **FREE** for:
- ✅ **Medical institutions** (hospitals, clinics, medical practices)
- ✅ **Non-profit organizations** providing healthcare services
- ✅ **Government healthcare facilities**
- ✅ **Research institutions** (with proper IRB approval)
- ✅ **Individual patients** for personal use

For commercial/for-profit use, please contact us for licensing.

---

## System Requirements

### Hardware Requirements

#### Raspberry Pi ECG Devices
- **Recommended**: Raspberry Pi 4 (4GB RAM)
- **Minimum**: Raspberry Pi 3B+
- **ECG Module**: CJMCU-1293 (ADS1293)
- **Electrodes**: Standard 3-lead ECG electrodes
- **MicroSD Card**: 32GB+ Class 10
- **Power Supply**: 5V 3A USB-C

**Quantity**: Plan 1 device per 3-5 patients (for shared device workflows) or 1 per patient (for continuous monitoring)

#### Server/Cloud
- **AWS Account** (or any cloud provider)
- **Minimum**: t2.small instance or serverless (Lambda)
- **Storage**: 10GB+ for DynamoDB, S3
- **Bandwidth**: 1GB/month per patient minimum

#### Client Devices
- **Desktop/Laptop**: Modern browser (Chrome, Firefox, Safari, Edge)
- **Tablet**: iPad, Android tablet
- **Mobile**: iOS/Android with modern browser

### Software Requirements

- **Operating System**:
  - Raspberry Pi: Raspberry Pi OS (64-bit recommended)
  - Server: AWS Lambda (serverless) or Ubuntu 20.04+

- **Dependencies**:
  - Node.js 20+ (for dashboards)
  - Python 3.9+ (for Raspberry Pi)
  - Terraform 1.5+ (for infrastructure)
  - AWS CLI configured

---

## Quick Start

### For Small Clinics (Under 50 Patients)

**Estimated Setup Time**: 2-4 hours

```bash
# 1. Clone the repository
git clone https://github.com/23blocks-OS/ECG_Monitor.git
cd ECG_Monitor

# 2. Deploy AWS infrastructure
cd terraform/environments/poc
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your settings
terraform init
terraform apply

# 3. Deploy Provider Portal
cd ../../../dashboard-org
npm install
npm run build
# Deploy to Vercel/AWS Amplify/your server

# 4. Deploy Patient Portal
cd ../dashboard-next
npm install
npm run build
# Deploy to Vercel/AWS Amplify/your server

# 5. Setup Raspberry Pi devices
# Follow RASPBERRY_PI_SETUP.md
```

---

## Deployment Steps

### Step 1: Infrastructure Setup (AWS)

#### 1.1 Configure AWS Credentials

```bash
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Default output format: json
```

#### 1.2 Create Terraform Variables

```bash
cd terraform/environments/poc
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
# Your organization details
project_name = "ecg-monitor"
environment  = "prod"

# Your email for alerts
alert_email = "admin@yourclinic.com"

# Claude AI API key (get from https://console.anthropic.com/)
anthropic_api_key = "sk-ant-..."

# AWS region
aws_region = "us-east-1"

# Optional: Custom domain
# custom_domain = "ecg.yourclinic.com"
```

#### 1.3 Deploy Infrastructure

```bash
terraform init
terraform plan  # Review what will be created
terraform apply # Type 'yes' to confirm
```

**This creates**:
- DynamoDB tables (users, patients, sessions, alerts, health data)
- Lambda functions (preprocessing, AI analysis, alerts, API)
- S3 buckets (static hosting, data storage)
- IoT Core (for device connectivity)
- API Gateway (REST API endpoints)
- CloudFront (CDN)

**Save these outputs**:
```bash
terraform output > ../../../deployment-outputs.txt
```

### Step 2: Provider Portal Deployment

#### Option A: Vercel (Recommended - Free for small teams)

```bash
cd dashboard-org

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel deploy --prod

# Set environment variables in Vercel dashboard
# NEXT_PUBLIC_API_URL = [Your API Gateway URL from Terraform output]
```

#### Option B: AWS Amplify

```bash
# Push to GitHub first
git push origin main

# In AWS Console:
# 1. Go to AWS Amplify
# 2. Click "New app" → "Host web app"
# 3. Connect your GitHub repository
# 4. Select 'dashboard-org' directory
# 5. Add environment variable: NEXT_PUBLIC_API_URL
# 6. Deploy
```

#### Option C: Docker (Self-hosted)

```bash
cd dashboard-org

# Build Docker image
docker build -t ecg-provider-portal .

# Run container
docker run -d \
  -p 3001:3000 \
  -e NEXT_PUBLIC_API_URL=https://your-api-url \
  --name provider-portal \
  ecg-provider-portal
```

### Step 3: Patient Portal Deployment

Same process as Provider Portal, but use `dashboard-next` directory:

```bash
cd dashboard-next
vercel deploy --prod
# OR deploy via AWS Amplify
# OR use Docker on port 3000
```

### Step 4: Database Initialization

#### 4.1 Create Your Organization

```python
import boto3
import uuid
import time

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
organizations_table = dynamodb.Table('ecg-prod-organizations')

org_id = str(uuid.uuid4())
organizations_table.put_item(Item={
    'organization_id': org_id,
    'organization_name': 'Your Clinic Name',
    'organization_type': 'clinic',  # or 'hospital'
    'address': {
        'street': '123 Medical Center Drive',
        'city': 'Your City',
        'state': 'ST',
        'zip': '12345',
        'country': 'USA'
    },
    'contact': {
        'email': 'admin@yourclinic.com',
        'phone': '+1-555-0100'
    },
    'settings': {
        'timezone': 'America/New_York',
        'max_users': 100,
        'max_devices': 20,
        'retention_days': 365
    },
    'subscription': {
        'plan': 'free',  # Medical institutions get free access
        'status': 'active'
    },
    'created_at': int(time.time() * 1000),
    'account_status': 'active'
})

print(f"Organization ID: {org_id}")
# SAVE THIS - you'll need it for user creation
```

#### 4.2 Create Admin User

```python
users_table = dynamodb.Table('ecg-prod-users')

admin_id = str(uuid.uuid4())
users_table.put_item(Item={
    'user_id': admin_id,
    'organization_id': org_id,  # From previous step
    'email': 'admin@yourclinic.com',
    'first_name': 'Admin',
    'last_name': 'User',
    'role': 'admin',
    'created_at': int(time.time() * 1000),
    'account_status': 'active'
})

print(f"Admin User ID: {admin_id}")
```

#### 4.3 Create Staff Users

```python
# Doctor
doctor_id = str(uuid.uuid4())
users_table.put_item(Item={
    'user_id': doctor_id,
    'organization_id': org_id,
    'email': 'doctor@yourclinic.com',
    'first_name': 'Dr. Jane',
    'last_name': 'Smith',
    'role': 'doctor',
    'created_at': int(time.time() * 1000),
    'account_status': 'active'
})

# Nurse
nurse_id = str(uuid.uuid4())
users_table.put_item(Item={
    'user_id': nurse_id,
    'organization_id': org_id,
    'email': 'nurse@yourclinic.com',
    'first_name': 'John',
    'last_name': 'Doe',
    'role': 'nurse',
    'created_at': int(time.time() * 1000),
    'account_status': 'active'
})
```

### Step 5: Raspberry Pi Device Setup

See detailed guide: [RASPBERRY_PI_SETUP.md](./docs/raspberry-pi-deployment.md)

**Quick version**:

```bash
# On Raspberry Pi
git clone https://github.com/23blocks-OS/ECG_Monitor.git
cd ECG_Monitor

# Install dependencies
cd pi-collector
pip3 install -r requirements.txt

cd ../pi-streamer
pip3 install -r requirements.txt

# Copy certificates from AWS IoT Core
mkdir -p ~/certs
# Download from AWS Console or use Terraform output
cp device.crt device.key AmazonRootCA1.pem ~/certs/

# Configure
cp config-example.yaml config.yaml
# Edit config.yaml with your AWS IoT endpoint and device ID

# Run services
python3 pi-collector/main.py &
python3 pi-streamer/main.py &

# Make them start on boot
sudo cp systemd/ecg-*.service /etc/systemd/system/
sudo systemctl enable ecg-collector ecg-streamer
sudo systemctl start ecg-collector ecg-streamer
```

---

## User Management

### User Roles

| Role | Access Level | Use Case |
|------|-------------|----------|
| **patient** | Own data only | Patients viewing their personal health |
| **nurse** | All patients in org | Triage, device assignment, vitals |
| **doctor** | All patients in org | Full medical access, diagnosis |
| **admin** | Organization management | User/device management, settings |

### Adding a New Patient

```python
import boto3
import uuid
import time

dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table('ecg-prod-users')
device_users_table = dynamodb.Table('ecg-prod-device-users')

# Create patient user
patient_id = str(uuid.uuid4())
users_table.put_item(Item={
    'user_id': patient_id,
    'organization_id': 'your-org-id',
    'email': 'patient@email.com',
    'first_name': 'John',
    'last_name': 'Patient',
    'date_of_birth': '1975-06-20',
    'gender': 'male',
    'phone': '+1-555-0199',
    'role': 'patient',
    'medical_history': {
        'conditions': ['hypertension'],
        'allergies': [],
        'medications': ['lisinopril 10mg']
    },
    'emergency_contact': {
        'name': 'Jane Patient',
        'phone': '+1-555-0200',
        'relationship': 'spouse'
    },
    'created_at': int(time.time() * 1000),
    'account_status': 'active'
})

# Assign device to patient
device_users_table.put_item(Item={
    'device_id': 'ecg-device-001',
    'user_id': patient_id,
    'assignment_id': str(uuid.uuid4()),
    'assignment_timestamp': int(time.time() * 1000),
    'assignment_type': 'permanent',  # or 'temporary'
    'assigned_by': 'admin-user-id',
    'status': 'active',
    'notes': 'Primary monitoring device'
})

print(f"Patient created: {patient_id}")
print(f"Access patient portal at: https://your-patient-portal.com")
print(f"Credentials: {patient_id} (or configure auth)")
```

### Bulk User Import

Create CSV file `patients.csv`:
```csv
email,first_name,last_name,dob,gender,phone
john@email.com,John,Doe,1975-06-20,male,+1-555-0101
jane@email.com,Jane,Smith,1982-03-15,female,+1-555-0102
```

Import script:
```python
import csv
import boto3
import uuid
import time

dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table('ecg-prod-users')

with open('patients.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        users_table.put_item(Item={
            'user_id': str(uuid.uuid4()),
            'organization_id': 'your-org-id',
            'email': row['email'],
            'first_name': row['first_name'],
            'last_name': row['last_name'],
            'date_of_birth': row['dob'],
            'gender': row['gender'],
            'phone': row['phone'],
            'role': 'patient',
            'created_at': int(time.time() * 1000),
            'account_status': 'active'
        })
        print(f"Created: {row['first_name']} {row['last_name']}")
```

---

## Device Management

### Device Pool Strategy

**For clinics with shared devices:**

```python
def assign_device_to_patient(patient_id, assigned_by_id, duration_hours=24):
    """
    Assign an available device from the pool to a patient.
    Device automatically returns to pool after duration.
    """
    import boto3
    import uuid
    import time

    dynamodb = boto3.resource('dynamodb')
    device_users = dynamodb.Table('ecg-prod-device-users')

    # Find available device
    # (In production, query for devices with status='inactive')
    device_id = 'ecg-device-001'  # Find from pool

    # Assign with TTL
    ttl = int(time.time()) + (duration_hours * 3600)

    device_users.put_item(Item={
        'device_id': device_id,
        'user_id': patient_id,
        'assignment_id': str(uuid.uuid4()),
        'assignment_timestamp': int(time.time() * 1000),
        'assignment_type': 'temporary',
        'assigned_by': assigned_by_id,
        'status': 'active',
        'notes': f'{duration_hours}h monitoring session',
        'ttl': ttl
    })

    return device_id
```

### Device Maintenance

Track device status, battery, calibration:
- Label each device with ID
- Keep log of battery replacements
- Calibration schedule (monthly recommended)
- Cleaning protocol (after each patient for shared devices)

---

## Security & Compliance

### HIPAA Compliance Checklist

- [ ] **Encryption at rest**: AWS DynamoDB encryption enabled (default)
- [ ] **Encryption in transit**: HTTPS/TLS for all connections
- [ ] **Access controls**: Role-based access implemented
- [ ] **Audit logging**: Enable CloudTrail for all AWS resources
- [ ] **Business Associate Agreement**: Sign BAA with AWS
- [ ] **PHI handling**: Train staff on proper data handling
- [ ] **Breach notification**: Have incident response plan
- [ ] **Patient consent**: Obtain consent for monitoring

### Security Best Practices

#### 1. Enable MFA for AWS Console
```bash
aws iam enable-mfa-device \
  --user-name your-admin \
  --serial-number arn:aws:iam::ACCOUNT:mfa/device \
  --authentication-code1 123456 \
  --authentication-code2 789012
```

#### 2. Restrict API Access
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "execute-api:Invoke",
    "Resource": "arn:aws:execute-api:*:*:*",
    "Condition": {
      "IpAddress": {
        "aws:SourceIp": ["YOUR.CLINIC.IP.ADDRESS/32"]
      }
    }
  }]
}
```

#### 3. Enable CloudTrail Logging
```bash
aws cloudtrail create-trail \
  --name ecg-audit-trail \
  --s3-bucket-name ecg-audit-logs

aws cloudtrail start-logging --name ecg-audit-trail
```

#### 4. Regular Backups
```bash
# Enable Point-in-Time Recovery for DynamoDB
aws dynamodb update-continuous-backups \
  --table-name ecg-prod-users \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

---

## Support & Training

### Staff Training Checklist

- [ ] **System overview** (1 hour)
  - Two-portal architecture
  - Provider vs patient access

- [ ] **Provider Portal training** (2 hours)
  - Login and navigation
  - Patient search
  - Viewing ECG dashboards
  - Understanding alerts

- [ ] **Device management** (1 hour)
  - Electrode placement
  - Device assignment/return
  - Battery management
  - Troubleshooting

- [ ] **Patient onboarding** (1 hour)
  - Creating patient accounts
  - Providing portal access
  - Teaching patients to use dashboard

- [ ] **Security & compliance** (1 hour)
  - HIPAA requirements
  - PHI handling
  - Incident response

### Common Issues & Solutions

#### Issue: Can't login to provider portal
- **Solution**: Check that user exists in DynamoDB users table and has correct organization_id

#### Issue: Patient not showing in search
- **Solution**: Verify patient has same organization_id as logged-in provider

#### Issue: ECG data not appearing
- **Solution**: Check that device is assigned to patient (device-users table) and Raspberry Pi is running

#### Issue: Alerts not sending
- **Solution**: Verify SNS topic subscription is confirmed and Lambda has SES permissions

### Getting Help

- **Documentation**: https://github.com/23blocks-OS/ECG_Monitor
- **Issues**: https://github.com/23blocks-OS/ECG_Monitor/issues
- **Email**: [Your support email]

### Free Support Included

As a medical institution using the system for free, you get:
- ✅ Community support via GitHub issues
- ✅ Documentation and guides
- ✅ Bug fixes and security updates
- ✅ Email support for critical issues

Paid support options available for:
- 🏆 Priority support (24/7 response)
- 🏆 Custom feature development
- 🏆 On-site training
- 🏆 Integration assistance

---

## Cost Estimates

### AWS Infrastructure (Monthly)

**Small Clinic (20 patients, 5 devices)**
- DynamoDB: $5-10
- Lambda: $5-10
- IoT Core: $5-10
- S3: $2-5
- CloudFront: $5-10
- **Total: $25-50/month**

**Medium Hospital (200 patients, 50 devices)**
- DynamoDB: $20-40
- Lambda: $20-40
- IoT Core: $20-40
- S3: $5-10
- CloudFront: $10-20
- **Total: $75-150/month**

### Hardware (One-time)

**Per Device**
- Raspberry Pi 4: $55
- CJMCU-1293: $25
- Accessories: $35
- **Total: $115 per device**

**For 10 devices**: ~$1,150
**For 50 devices**: ~$5,750

### Total First Year Cost Example

**Small clinic (20 patients, 5 devices)**
- Hardware: $575 (one-time)
- AWS: $300-600/year
- **Total Year 1: ~$900-1,200**

---

## Disclaimer

⚠️ **IMPORTANT LEGAL NOTICE**

This system is:
- **NOT a medical device**
- **NOT FDA approved or CE marked**
- **NOT intended for clinical diagnosis**
- **For monitoring and educational purposes only**

**Healthcare providers must**:
- Use clinical judgment
- Follow standard diagnostic protocols
- Not rely solely on this system for medical decisions
- Obtain proper informed consent from patients

**By deploying this system, you acknowledge that:**
- You are responsible for compliance with local regulations
- The software is provided "as-is" without warranty
- The developers are not liable for medical outcomes

Always consult with legal counsel and regulatory bodies before clinical deployment.

---

## License

**FREE for**:
- Medical institutions
- Non-profit healthcare organizations
- Government healthcare facilities
- Research institutions

See [LICENSE](./LICENSE) for full terms.

For commercial/for-profit use, contact us for licensing options.

---

**Ready to get started?** Follow the [Quick Start](#quick-start) guide above!

**Questions?** Open an issue on [GitHub](https://github.com/23blocks-OS/ECG_Monitor/issues)
