# AWS Deployment Guide - ECG Monitor System

Complete step-by-step guide to deploy the ECG Monitor system to AWS.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [AWS Account Setup](#aws-account-setup)
3. [Get API Keys](#get-api-keys)
4. [Configure Terraform](#configure-terraform)
5. [Deploy Infrastructure](#deploy-infrastructure)
6. [Verify Deployment](#verify-deployment)
7. [Setup Email Alerts](#setup-email-alerts)
8. [Configure Raspberry Pi](#configure-raspberry-pi)
9. [Test the System](#test-the-system)
10. [Monitoring & Troubleshooting](#monitoring--troubleshooting)
11. [Costs & Budget Alerts](#costs--budget-alerts)
12. [Cleanup (Optional)](#cleanup-optional)

---

## Prerequisites

### Required Software

Install the following on your local machine:

```bash
# 1. AWS CLI v2
# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Windows
# Download from: https://aws.amazon.com/cli/

# 2. Terraform >= 1.5.0
# macOS
brew tap hashicorp/tap
brew install hashicorp/tap/terraform

# Linux
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# Windows
# Download from: https://www.terraform.io/downloads

# 3. Python 3.9+
python3 --version  # Should be 3.9 or higher

# 4. Git
git --version
```

### Verify Installations

```bash
aws --version
# aws-cli/2.x.x ...

terraform --version
# Terraform v1.5.0 or higher

python3 --version
# Python 3.9.x or higher
```

---

## AWS Account Setup

### 1. Create AWS Account

If you don't have one:
1. Go to https://aws.amazon.com/
2. Click "Create an AWS Account"
3. Follow the registration process
4. Add a payment method (required, but you'll stay within free tier for testing)

### 2. Create IAM User

**Don't use your root account!** Create an IAM user for deployments:

```bash
# Login to AWS Console
# Navigate to: IAM → Users → Add User

# Or use AWS CLI (if you have root credentials):
aws iam create-user --user-name ecg-deployer

# Create access key
aws iam create-access-key --user-name ecg-deployer
```

**Save the output!** You'll get:
- `AccessKeyId`
- `SecretAccessKey`

### 3. Attach Required Permissions

The IAM user needs these permissions:

```bash
# Create a policy file: ecg-deployer-policy.json
cat > ecg-deployer-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iot:*",
        "s3:*",
        "dynamodb:*",
        "lambda:*",
        "sqs:*",
        "apigateway:*",
        "ses:*",
        "cloudwatch:*",
        "logs:*",
        "cloudformation:*",
        "cloudfront:*",
        "iam:*",
        "secretsmanager:*"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Attach the policy
aws iam put-user-policy \
  --user-name ecg-deployer \
  --policy-name ECGDeployerPolicy \
  --policy-document file://ecg-deployer-policy.json
```

**For production:** Use more restrictive policies. This is simplified for POC.

### 4. Configure AWS CLI

```bash
aws configure

# Enter when prompted:
AWS Access Key ID: <your-access-key-id>
AWS Secret Access Key: <your-secret-access-key>
Default region name: us-east-1
Default output format: json
```

**Verify configuration:**

```bash
aws sts get-caller-identity

# Should show:
# {
#   "UserId": "...",
#   "Account": "123456789012",
#   "Arn": "arn:aws:iam::123456789012:user/ecg-deployer"
# }
```

---

## Get API Keys

### 1. Anthropic Claude API Key

1. Go to: https://console.anthropic.com/
2. Sign up or log in
3. Navigate to: **Settings → API Keys**
4. Click "Create Key"
5. Copy the key (starts with `sk-ant-api03-...`)
6. **Save it securely!** You can't see it again

**Billing:**
- Add a payment method in Anthropic Console
- Set a usage limit (e.g., $50/month)
- You'll be charged based on API usage

**Cost Estimate:**
- Analyzing 10% of batches: ~$8-20/day
- Analyzing all batches: ~$86/day

### 2. Your Email Address

You'll need an email address for:
- Receiving alert notifications
- AWS SES sender verification

Use a personal email you check regularly.

---

## Configure Terraform

### 1. Clone Repository

```bash
git clone https://github.com/23blocks-OS/ECG_Monitor.git
cd ECG_Monitor
```

### 2. Create Terraform Variables File

```bash
cd terraform/environments/poc

# Copy the example
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

### 3. Fill in Variables

Edit `terraform.tfvars`:

```hcl
# Project settings
project_name = "ecg-monitor"
environment  = "poc"
aws_region   = "us-east-1"

# Your email for receiving alerts
# IMPORTANT: You must verify this in SES (step covered later)
alert_email = "your-email@example.com"

# Anthropic Claude API key
# Get from: https://console.anthropic.com/
anthropic_api_key = "sk-ant-api03-xxxxxxxxxxxxxxxxxxxxx"

# Optional: Override defaults
# device_id               = "ecg-device-001"
# ecg_sampling_rate       = 250
# batch_size_seconds      = 10
# s3_retention_days       = 90
# lambda_timeout          = 300
# enable_detailed_monitoring = true
```

**Save the file.**

**Security Warning:** Never commit `terraform.tfvars` to git! It's already in `.gitignore`.

---

## Deploy Infrastructure

### Option A: Automated Deployment (Recommended)

```bash
# Return to project root
cd ../../..

# Run the deployment script
./deploy.sh
```

The script will:
1. ✅ Check prerequisites (AWS CLI, Terraform)
2. ✅ Build Lambda deployment packages
3. ✅ Initialize Terraform
4. ✅ Show deployment plan
5. ✅ Ask for confirmation
6. ✅ Deploy infrastructure
7. ✅ Upload web dashboard to S3
8. ✅ Generate Pi configuration
9. ✅ Display all URLs and next steps

**Deployment time:** ~10-15 minutes

### Option B: Manual Deployment

If you prefer manual control:

#### Step 1: Build Lambda Packages

```bash
# Build each Lambda function
for lambda_dir in lambda/*/; do
    if [ -f "${lambda_dir}handler.py" ]; then
        echo "Building $(basename $lambda_dir)..."
        cd "$lambda_dir"

        rm -f deployment.zip

        if [ -f "requirements.txt" ]; then
            mkdir -p package
            pip install -r requirements.txt -t package/ --quiet
            cd package
            zip -r ../deployment.zip . --quiet
            cd ..
            zip -g deployment.zip handler.py --quiet
            rm -rf package
        else
            zip deployment.zip handler.py --quiet
        fi

        cd - > /dev/null
    fi
done
```

#### Step 2: Deploy Terraform

```bash
cd terraform/environments/poc

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply (will prompt for confirmation)
terraform apply

# Save outputs
terraform output > ../../outputs.txt
```

#### Step 3: Deploy Web Dashboard

```bash
cd ../../..

# Get the S3 bucket name and API URL
WEB_BUCKET=$(cd terraform/environments/poc && terraform output -raw web_bucket)
API_URL=$(cd terraform/environments/poc && terraform output -raw api_gateway_url)

# Create config for dashboard
cat > web-dashboard/config.js << EOF
window.ECG_API_URL = '${API_URL}';
EOF

# Upload to S3
aws s3 sync web-dashboard/ s3://${WEB_BUCKET}/ \
    --exclude "*.md" \
    --cache-control "max-age=300"
```

---

## Verify Deployment

### 1. Check Terraform Outputs

```bash
cd terraform/environments/poc
terraform output
```

You should see:

```
iot_endpoint = "xxxxx.iot.us-east-1.amazonaws.com"
api_gateway_url = "https://xxxxx.execute-api.us-east-1.amazonaws.com/v1"
cloudfront_url = "https://xxxxx.cloudfront.net"
raw_data_bucket = "ecg-monitor-poc-raw-data"
sessions_table = "ecg-monitor-poc-sessions"
...
```

**Save these values!** You'll need them later.

### 2. Verify AWS Resources

```bash
# Check Lambda functions
aws lambda list-functions --query 'Functions[?contains(FunctionName, `ecg`)].FunctionName'

# Should show:
# - ecg-monitor-poc-preprocessor
# - ecg-monitor-poc-ai-analyzer
# - ecg-monitor-poc-alert-worker
# - ecg-monitor-poc-api-handler

# Check DynamoDB tables
aws dynamodb list-tables --query 'TableNames[?contains(@, `ecg`)]'

# Should show:
# - ecg-monitor-poc-sessions
# - ecg-monitor-poc-alerts
# - ecg-monitor-poc-analysis

# Check S3 buckets
aws s3 ls | grep ecg

# Should show:
# ecg-monitor-poc-raw-data
# ecg-monitor-poc-processed-data
# ecg-monitor-poc-dashboard

# Check IoT Thing
aws iot describe-thing --thing-name ecg-monitor-ecg-device-001
```

### 3. Test Web Dashboard

```bash
# Get CloudFront URL
CLOUDFRONT_URL=$(terraform output -raw cloudfront_url)
echo "Dashboard URL: $CLOUDFRONT_URL"

# Open in browser
open $CLOUDFRONT_URL  # macOS
xdg-open $CLOUDFRONT_URL  # Linux
start $CLOUDFRONT_URL  # Windows
```

You should see the dashboard with mock data (since no Pi is connected yet).

### 4. Test API

```bash
API_URL=$(terraform output -raw api_gateway_url)

# Test live endpoint
curl "${API_URL}/api/live?device_id=ecg-device-001"

# Should return JSON with mock data:
# {
#   "device_id": "ecg-device-001",
#   "timestamp": ...,
#   "status": "active",
#   "metrics": {...},
#   "waveform": {...}
# }
```

---

## Setup Email Alerts

AWS SES starts in **sandbox mode** - you must verify your email.

### 1. Verify Email Address

```bash
# Request verification
aws ses verify-email-identity --email-address your-email@example.com
```

### 2. Check Your Email

You'll receive an email from AWS with subject:
**"Amazon SES Email Address Verification Request"**

Click the verification link.

### 3. Verify Status

```bash
aws ses get-identity-verification-attributes \
  --identities your-email@example.com

# Should show:
# "VerificationStatus": "Success"
```

### 4. Test Email

```bash
aws ses send-email \
  --from your-email@example.com \
  --to your-email@example.com \
  --subject "ECG Monitor Test" \
  --text "Email alerts are working!"

# Check your inbox
```

### 5. (Optional) Request Production Access

Sandbox mode limits:
- Can only send to verified addresses
- Max 200 emails/day

For production, request to move out of sandbox:
1. AWS Console → SES → Account Dashboard
2. Click "Request Production Access"
3. Fill out the form (takes 24-48 hours)

**For POC:** Sandbox mode is fine.

---

## Configure Raspberry Pi

Now that AWS is deployed, configure your Raspberry Pi to connect.

### 1. Generate IoT Certificates

You need device certificates to connect to AWS IoT Core.

**Option A: Using AWS Console**

1. Go to: AWS Console → IoT Core → Connect
2. Click "Connect one device"
3. Follow the wizard to create certificates
4. Download:
   - Device certificate (`xxx-certificate.pem.crt`)
   - Private key (`xxx-private.pem.key`)
   - Amazon Root CA 1 (`AmazonRootCA1.pem`)

**Option B: Using AWS CLI**

```bash
# Create certificate
aws iot create-keys-and-certificate \
  --set-as-active \
  --certificate-pem-outfile device.crt \
  --public-key-outfile device.public.key \
  --private-key-outfile device.key

# Save the certificate ARN from output
CERT_ARN="arn:aws:iot:us-east-1:123456789012:cert/xxxx"

# Attach policy to certificate
aws iot attach-policy \
  --policy-name ecg-monitor-poc-device-policy \
  --target "$CERT_ARN"

# Attach certificate to thing
aws iot attach-thing-principal \
  --thing-name ecg-monitor-ecg-device-001 \
  --principal "$CERT_ARN"

# Download Amazon Root CA
wget https://www.amazontrust.com/repository/AmazonRootCA1.pem
```

### 2. Copy Files to Raspberry Pi

```bash
# From your local machine, copy certificates
scp device.crt pi@raspberrypi.local:~/certs/
scp device.key pi@raspberrypi.local:~/certs/
scp AmazonRootCA1.pem pi@raspberrypi.local:~/certs/

# Copy the generated Pi configuration
scp config/pi-config-deployed.yaml pi@raspberrypi.local:~/
```

### 3. Setup Raspberry Pi

```bash
# SSH into Pi
ssh pi@raspberrypi.local

# Clone repository
git clone https://github.com/23blocks-OS/ECG_Monitor.git
cd ECG_Monitor

# Copy configuration
cp ~/pi-config-deployed.yaml config/pi-config.yaml

# Verify certificate paths in config
nano config/pi-config.yaml
# Make sure paths point to ~/certs/

# Install collector dependencies
cd pi-collector
pip3 install -r requirements.txt

# Install streamer dependencies
cd ../pi-streamer
pip3 install -r requirements.txt

# Create log directory
sudo mkdir -p /var/log
sudo chown pi:pi /var/log

# Create cache directory
sudo mkdir -p /var/ecg_cache
sudo chown pi:pi /var/ecg_cache
```

### 4. Enable SPI (for hardware)

Only needed if using real CJMCU-1293 hardware:

```bash
sudo raspi-config
# Interface Options → SPI → Enable
sudo reboot
```

---

## Test the System

### 1. Test Pi Collector (Mock Mode)

First test without hardware:

```bash
ssh pi@raspberrypi.local
cd ~/ECG_Monitor

# Run collector in mock mode
python3 pi-collector/main.py --mock

# You should see:
# Initializing ECG Collector...
# Mock: Using MOCK ECG reader
# ECG Collector initialized
# Starting ECG data collection
# ...
# Collected 250 samples (1.0s, HR estimate: ~72 BPM)
# ...
# Creating batch 1...

# Press Ctrl+C to stop
```

### 2. Test Pi Streamer (Mock Mode)

```bash
# In another terminal
ssh pi@raspberrypi.local
cd ~/ECG_Monitor

# Run streamer in mock mode
python3 pi-streamer/main.py --mock

# You should see:
# Initializing ECG Streamer...
# Mock: Connecting to xxx.iot.us-east-1.amazonaws.com...
# Mock: Connected successfully
# Starting ECG data streaming
# ...
# Found X cached batches to send
# Mock: Published to ecg/device001/data

# Press Ctrl+C to stop
```

### 3. Test with Real AWS Connection

```bash
# Run streamer connected to AWS (without mock flag)
python3 pi-streamer/main.py --config config/pi-config.yaml

# You should see:
# Using REAL AWS IoT Core client
# Connected to AWS IoT Core: xxx.iot.us-east-1.amazonaws.com
# Starting ECG data streaming
# ...
# Published to ecg/device001/data (12345 bytes)
```

### 4. Verify Data in AWS

```bash
# On your local machine

# Check if data arrived in S3
aws s3 ls s3://ecg-monitor-poc-raw-data/ --recursive | tail

# Check DynamoDB sessions
aws dynamodb scan --table-name ecg-monitor-poc-sessions

# Check CloudWatch logs
aws logs tail /aws/lambda/ecg-monitor-poc-preprocessor --follow
```

### 5. Check Dashboard

Open the CloudFront URL in your browser. After a few minutes, you should see:
- Live data instead of mock data
- Real heart rate metrics
- ECG waveforms updating

### 6. Test Alerts

To trigger a test alert, you can manually create one in DynamoDB:

```bash
aws dynamodb put-item \
  --table-name ecg-monitor-poc-alerts \
  --item '{
    "alert_id": {"S": "test-alert-1"},
    "device_id": {"S": "ecg-device-001"},
    "timestamp": {"N": "'$(date +%s)000'"},
    "severity": {"S": "medium"},
    "type": {"S": "test"},
    "arrhythmias": {"S": "[]"},
    "anomalies": {"S": "[]"},
    "summary": {"S": "This is a test alert"},
    "recommendations": {"S": "[]"},
    "confidence": {"N": "0.95"},
    "heart_rate_bpm": {"N": "75"},
    "notification_sent": {"BOOL": false},
    "user_acknowledged": {"BOOL": false}
  }'
```

You should receive an email within 1-2 minutes.

---

## Monitoring & Troubleshooting

### CloudWatch Dashboards

```bash
# View Lambda logs
aws logs tail /aws/lambda/ecg-monitor-poc-preprocessor --follow
aws logs tail /aws/lambda/ecg-monitor-poc-ai-analyzer --follow
aws logs tail /aws/lambda/ecg-monitor-poc-alert-worker --follow
aws logs tail /aws/lambda/ecg-monitor-poc-api-handler --follow
```

### Check IoT Activity

```bash
# List device connections (last hour)
aws iot describe-thing --thing-name ecg-monitor-ecg-device-001

# Check IoT logs
aws logs tail AWSIotLogsV2 --follow
```

### Common Issues

#### 1. "403 Forbidden" when Pi connects to IoT

**Solution:**
- Verify certificate is attached to policy
- Check policy allows client ID

```bash
aws iot list-principal-policies \
  --principal "arn:aws:iot:us-east-1:xxxx:cert/yyyy"
```

#### 2. Email not sending

**Solution:**
- Verify email in SES
- Check SES is in same region as Lambda

```bash
aws ses get-identity-verification-attributes \
  --identities your-email@example.com \
  --region us-east-1
```

#### 3. Dashboard shows no data

**Solution:**
- Check API Gateway URL is correct in `web-dashboard/config.js`
- Test API manually: `curl <api-url>/api/live`
- Check browser console for errors (F12)

#### 4. Lambda errors

**Solution:**
- Check CloudWatch logs
- Verify environment variables are set
- Check IAM permissions

```bash
aws lambda get-function-configuration \
  --function-name ecg-monitor-poc-preprocessor
```

---

## Costs & Budget Alerts

### Set Up Budget Alert

```bash
# Create a budget (via console is easier)
# AWS Console → Billing → Budgets → Create budget

# Or via CLI:
aws budgets create-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget file://budget.json

# budget.json:
{
  "BudgetName": "ECG-Monitor-Monthly-Budget",
  "BudgetLimit": {
    "Amount": "100",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}
```

### Monitor Costs

```bash
# Check current month costs
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost

# Check by service
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

**Typical Daily Costs:**
- Lambda: ~$0.30
- DynamoDB: ~$0.20
- S3: ~$0.05
- IoT Core: ~$0.15
- Claude API: ~$8-20 (10% of batches)
- **Total: ~$10-25/day** = **$300-750/month** if running 24/7

**To reduce costs:**
- Use less frequent Claude API calls (analyze 5% instead of 10%)
- Shorter S3 retention (30 days instead of 90)
- Lower sampling rate (125 Hz instead of 250 Hz)

---

## Cleanup (Optional)

To delete everything and stop charges:

```bash
cd terraform/environments/poc

# Destroy all resources
terraform destroy

# Confirm by typing: yes
```

**Warning:** This will permanently delete:
- All ECG data in S3
- All DynamoDB tables and data
- All Lambda functions
- IoT certificates and policies
- API Gateway and CloudFront

**Before destroying:**
- Backup any data you want to keep
- Export important alerts or analysis results

---

## Summary Checklist

- [ ] AWS CLI installed and configured
- [ ] Terraform installed (v1.5.0+)
- [ ] IAM user created with proper permissions
- [ ] Claude API key obtained
- [ ] `terraform.tfvars` configured
- [ ] Ran `./deploy.sh` successfully
- [ ] Email verified in SES
- [ ] IoT certificates generated
- [ ] Certificates copied to Raspberry Pi
- [ ] Pi software installed
- [ ] Tested Pi collector (mock mode)
- [ ] Tested Pi streamer (real connection)
- [ ] Dashboard shows live data
- [ ] Received test email alert
- [ ] Budget alerts configured

---

## Next Steps

After successful deployment:

1. **Connect Hardware**
   - Wire CJMCU-1293 to Raspberry Pi
   - Attach ECG electrodes
   - Run collector without `--mock` flag

2. **Start Continuous Monitoring**
   - Set up systemd services (see `docs/systemd-setup.md`)
   - Configure auto-start on boot

3. **Calibrate & Tune**
   - Adjust alert thresholds
   - Tune signal processing parameters
   - Optimize Claude API analysis frequency

4. **Monitor & Iterate**
   - Review alerts daily
   - Check CloudWatch metrics
   - Analyze Claude API insights
   - Refine based on your heart data

---

## Support & Resources

- **Architecture:** [ARCHITECTURE.md](../ARCHITECTURE.md)
- **Troubleshooting:** Check CloudWatch Logs
- **AWS Docs:** https://docs.aws.amazon.com/
- **Terraform Docs:** https://www.terraform.io/docs
- **Claude API:** https://docs.anthropic.com/

**Questions or issues?**
- Check CloudWatch logs first
- Review this guide's troubleshooting section
- Open an issue on GitHub

---

**🎉 Congratulations! Your ECG Monitor is deployed and running on AWS!**
