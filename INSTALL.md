# ECG Monitor - Installation Guide

Complete guide for deploying the ECG Monitor system with one-click installation.

## Overview

The ECG Monitor features an **interactive installation wizard** that guides you through deployment in 15-20 minutes. The installer:

- ✅ Validates prerequisites automatically
- ✅ Collects configuration via guided questionnaire
- ✅ Deploys complete AWS infrastructure (IoT, Lambda, DynamoDB, S3)
- ✅ Generates Raspberry Pi configuration
- ✅ Provides step-by-step post-installation instructions

## Quick Start

```bash
# Clone the repository
git clone https://github.com/23blocks-OS/ECG_Monitor.git
cd ECG_Monitor

# Run the installer
./install.sh
```

That's it! The installer will guide you through the rest.

## Prerequisites

### Required Tools

| Tool | Version | Purpose |
|------|---------|---------|
| AWS CLI | 2.x | AWS resource management |
| Terraform | ≥ 1.5.0 | Infrastructure deployment |
| Python | ≥ 3.9 | Lambda function packaging |
| Node.js | ≥ 18 | Dashboard builds |
| Git | Any | Version control |

### AWS Account Requirements

- Active AWS account with billing enabled
- IAM user/role with administrator permissions (or specific permissions listed below)
- AWS CLI configured with credentials: `aws configure`

<details>
<summary>Minimum IAM Permissions Required</summary>

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iot:*",
        "lambda:*",
        "dynamodb:*",
        "s3:*",
        "apigateway:*",
        "cloudfront:*",
        "ses:*",
        "iam:CreateRole",
        "iam:AttachRolePolicy",
        "iam:PassRole",
        "logs:*",
        "cloudwatch:*",
        "sqs:*",
        "secretsmanager:*"
      ],
      "Resource": "*"
    }
  ]
}
```
</details>

### External Services

- **Anthropic Claude API**: Sign up at [console.anthropic.com](https://console.anthropic.com/)
  - You'll need an API key starting with `sk-ant-...`
  - Estimated cost: $20-50/month depending on analysis frequency

### Hardware (for data collection)

- Raspberry Pi 4 (4GB RAM recommended) or Pi 3B+
- CJMCU-1293 ECG module (ADS1293 chip)
- 3-lead ECG electrodes
- 32GB+ microSD card
- Network connectivity (WiFi or Ethernet)

## Installation Steps

### 1. Install Prerequisites

#### macOS
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required tools
brew install awscli terraform python@3.11 node git
```

#### Linux (Ubuntu/Debian)
```bash
# Update package list
sudo apt update

# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Install Terraform
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform

# Install Python and Node.js
sudo apt install python3.11 python3-pip nodejs npm git
```

#### Windows (WSL2 recommended)
```bash
# Install WSL2 first, then follow Linux instructions above
wsl --install -d Ubuntu
```

### 2. Configure AWS Credentials

```bash
aws configure
```

Enter your AWS credentials:
- AWS Access Key ID: `AKIAIOSFODNN7EXAMPLE`
- AWS Secret Access Key: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
- Default region: `us-east-1` (or your preferred region)
- Default output format: `json`

Verify configuration:
```bash
aws sts get-caller-identity
```

### 3. Get Anthropic API Key

1. Visit [console.anthropic.com](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to API Keys
4. Create new key → Copy (starts with `sk-ant-...`)

### 4. Run the Installer

```bash
cd ECG_Monitor
./install.sh
```

The installer will:

#### Step 1: Validate Prerequisites
- Checks for AWS CLI, Terraform, Python, Node.js
- Verifies AWS credentials
- Confirms IAM permissions

#### Step 2: Interactive Questionnaire
You'll be asked:

| Question | Example | Notes |
|----------|---------|-------|
| Organization name | "Acme Medical Clinic" | Your healthcare facility |
| Organization type | Clinic / Hospital / Research | Select from menu |
| Max users | 10 | Patients + staff count |
| Project name | ecg-monitor | Lowercase, alphanumeric |
| Environment | poc / dev / prod | Select deployment stage |
| AWS region | us-east-1 | Closest to your location |
| Anthropic API key | sk-ant-api03-... | From console.anthropic.com |
| Alert email | admin@clinic.com | Must verify in AWS SES |
| Device ID | ecg-device-001 | Unique identifier |
| ECG sampling rate | 250 Hz | Standard: 250-500 Hz |
| Data retention | 90 days | S3 lifecycle policy |

#### Step 3: Review & Confirm
- Configuration summary displayed
- Estimated monthly costs shown (~$45-75)
- Confirm to proceed

#### Step 4: Automated Deployment
The installer automatically:
- ✅ Generates `terraform.tfvars`
- ✅ Initializes Terraform
- ✅ Creates AWS resources:
  - IoT Core (device connectivity)
  - 4 Lambda functions (preprocessing, AI analysis, alerts, API)
  - 9 DynamoDB tables (sessions, alerts, users, etc.)
  - 3 S3 buckets (raw data, processed data, web assets)
  - 3 SQS queues (processing pipeline)
  - API Gateway + CloudFront (web access)
  - IAM roles & policies
- ✅ Builds Lambda deployment packages
- ✅ Deploys web dashboards
- ✅ Generates Raspberry Pi configuration

**Time:** 10-15 minutes

#### Step 5: Post-Installation Summary
Displays:
- IoT endpoint URL
- API Gateway URL
- Dashboard URLs (Provider + Patient portals)
- Raspberry Pi setup instructions
- Next steps checklist

## Post-Installation

### 1. Verify Email for Alerts

AWS SES sends a verification email to the address you provided:

1. Check inbox for "Amazon SES Email Verification"
2. Click verification link
3. Alerts won't work until verified!

### 2. Access Web Dashboards

The installer outputs URLs for:

- **Provider Portal** (Healthcare staff): View all patients, manage devices, configure alerts
- **Patient Portal** (Patient access): Personal ECG data, trends, health journal

Credentials are managed via the user creation script (see next step).

### 3. Create User Accounts

```bash
# Create admin user
python3 scripts/create-user.py \
  --role admin \
  --email admin@example.com \
  --name "Dr. Admin"

# Create doctor
python3 scripts/create-user.py \
  --role doctor \
  --email doctor@clinic.com \
  --name "Dr. Smith"

# Create patient
python3 scripts/create-user.py \
  --role patient \
  --email patient@example.com \
  --name "John Doe" \
  --device-id ecg-device-001
```

### 4. Set Up Raspberry Pi

Follow the detailed instructions in `config/PI-SETUP-INSTRUCTIONS.md`.

**Quick Summary:**

```bash
# On your Raspberry Pi
sudo apt update && sudo apt upgrade -y

# Enable SPI
sudo raspi-config
# → Interface Options → SPI → Enable

# Install Python packages
sudo pip3 install spidev RPi.GPIO boto3 AWSIoTPythonSDK numpy scipy pyyaml

# Clone repo
git clone https://github.com/23blocks-OS/ECG_Monitor.git
cd ECG_Monitor

# Copy configuration from your deployment machine
# (Use the files generated during installation)
```

**Copy certificates to Pi:**
```bash
# From deployment machine
scp -r terraform/environments/poc/certs pi@raspberrypi.local:/home/pi/certs/
scp config/pi-config-deployed.yaml pi@raspberrypi.local:/home/pi/ECG_Monitor/config/
```

**Start data collection:**
```bash
# On Raspberry Pi
python3 pi-collector.py &
python3 pi-streamer.py &
```

### 5. Verify System

**Check device connection:**
```bash
aws iot describe-thing --thing-name ecg-device-001
```

**View logs:**
```bash
aws logs tail /aws/lambda/ecg-preprocessor --follow
```

**Test API:**
```bash
curl $(terraform -chdir=terraform/environments/poc output -raw api_gateway_url)/health
```

**Dashboard check:**
- Log into Provider Portal
- Navigate to Devices
- Verify device shows "Online"
- Check for recent ECG sessions

## Cost Estimation

### Monthly Costs (1 device, continuous monitoring)

| Service | Cost |
|---------|------|
| AWS IoT Core | ~$5 |
| Lambda (4 functions) | ~$10 |
| DynamoDB (9 tables) | ~$5 |
| S3 Storage | ~$2 |
| Data Transfer | ~$3 |
| SQS | ~$1 |
| CloudFront | ~$2 |
| **AWS Subtotal** | **~$28** |
| Claude AI API | ~$20-50 |
| **Total** | **~$48-78/month** |

**Scaling:**
- Each additional device: +$10-15/month
- Higher analysis frequency: +$20-40/month (Claude API)
- Longer data retention: +$2-5/month (S3)

### Free Tier Eligible

If your AWS account is within the first 12 months:
- Lambda: 1M requests free
- DynamoDB: 25GB free
- S3: 5GB free
- IoT: 250K messages free (first year)

**Estimated cost with free tier: ~$20-50/month**

## Troubleshooting

### Installation Fails at Terraform

**Error: Credentials not configured**
```bash
# Solution: Configure AWS CLI
aws configure
```

**Error: Insufficient permissions**
```bash
# Solution: Verify IAM permissions
aws iam get-user
# Ensure user has AdministratorAccess or specific permissions
```

**Error: Region not supported**
```bash
# Solution: Change region in questionnaire
# Recommended: us-east-1, us-west-2, eu-west-1
```

### Raspberry Pi Issues

**SPI not detected**
```bash
# Enable SPI
sudo raspi-config
# → Interface Options → SPI → Enable
sudo reboot

# Verify
lsmod | grep spi
```

**Device not connecting to AWS IoT**
```bash
# Check certificate files
ls -l /home/pi/certs/
# Should contain: device.crt, device.key, AmazonRootCA1.pem

# Test MQTT connection
mosquitto_pub --cafile /home/pi/certs/AmazonRootCA1.pem \
  --cert /home/pi/certs/device.crt \
  --key /home/pi/certs/device.key \
  -h YOUR_IOT_ENDPOINT \
  -p 8883 \
  -t 'test/topic' \
  -m 'hello'
```

**No ECG data**
```bash
# Check hardware connections (see PI-SETUP-INSTRUCTIONS.md)
# Test SPI communication
python3 -c "import spidev; spi = spidev.SpiDev(); spi.open(0, 0); print('SPI OK')"
```

### Dashboard Issues

**Dashboard not loading**
- Check CloudFront URL from installation summary
- Verify S3 bucket has files: `aws s3 ls s3://YOUR_BUCKET/`
- Check CloudFront distribution status: `aws cloudfront list-distributions`

**API errors**
```bash
# Check API Gateway
aws apigateway get-rest-apis

# View Lambda logs
aws logs tail /aws/lambda/ecg-api-handler --follow
```

### Email Alerts Not Working

**SES verification pending**
1. Check email inbox (including spam)
2. Resend verification: `aws ses verify-email-identity --email-address YOUR_EMAIL`
3. Check status: `aws ses get-identity-verification-attributes --identities YOUR_EMAIL`

## Advanced Configuration

### Custom Domain for Dashboard

1. Purchase domain (Route 53 or external)
2. Request SSL certificate in ACM
3. Update CloudFront distribution:
   ```bash
   aws cloudfront update-distribution \
     --id YOUR_DISTRIBUTION_ID \
     --aliases your-domain.com
   ```
4. Update Route 53 DNS

### Multi-Organization Setup

For healthcare providers managing multiple clinics:

```bash
# Deploy separate environments
./install.sh  # Answer questionnaire for Org 1
# Edit terraform.tfvars, change project_name/org
terraform apply  # Deploy Org 2

# Or use Terraform workspaces
terraform workspace new org2
terraform apply
```

### High Availability

Enable multi-AZ for production:

Edit `terraform/environments/poc/main.tf`:
```hcl
module "compute" {
  # ...
  enable_multi_az = true
  lambda_reserved_concurrency = 10
}
```

## Uninstallation

**WARNING: This deletes all data permanently!**

```bash
cd terraform/environments/poc

# Preview what will be destroyed
terraform plan -destroy

# Destroy infrastructure
terraform destroy

# Confirm with: yes
```

**Manual cleanup:**
```bash
# Delete S3 buckets (if versioning enabled)
aws s3 rb s3://YOUR_BUCKET --force

# Delete CloudWatch logs
aws logs delete-log-group --log-group-name /aws/lambda/ecg-preprocessor
```

## Support

- **Documentation**: [README.md](README.md)
- **Architecture**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **GitHub Issues**: [github.com/23blocks-OS/ECG_Monitor/issues](https://github.com/23blocks-OS/ECG_Monitor/issues)
- **Discussions**: [github.com/23blocks-OS/ECG_Monitor/discussions](https://github.com/23blocks-OS/ECG_Monitor/discussions)

## License

See [LICENSE](LICENSE) file for details.

---

**Happy Monitoring! 💓**
