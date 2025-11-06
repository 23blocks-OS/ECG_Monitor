# Deployment Quick Start

Fast deployment guide for experienced AWS users.

## Prerequisites

```bash
# Install tools
brew install awscli terraform  # macOS
# or apt-get install awscli terraform  # Linux

# Verify
aws --version && terraform --version
```

## 1. AWS Setup (5 minutes)

```bash
# Configure AWS CLI
aws configure
# Enter: Access Key, Secret Key, Region (us-east-1), Format (json)

# Verify
aws sts get-caller-identity
```

## 2. Get API Keys (5 minutes)

- **Claude API:** https://console.anthropic.com/ → API Keys → Create
- **Email:** Your email address for alerts

## 3. Configure (2 minutes)

```bash
git clone https://github.com/23blocks-OS/ECG_Monitor.git
cd ECG_Monitor/terraform/environments/poc

cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
```

Edit:
```hcl
alert_email = "your@email.com"
anthropic_api_key = "sk-ant-api03-xxxxx"
```

## 4. Deploy (10 minutes)

```bash
cd ../../..
./deploy.sh
```

Save outputs:
- IoT endpoint
- API Gateway URL
- CloudFront URL

## 5. Verify Email (2 minutes)

```bash
aws ses verify-email-identity --email-address your@email.com
# Check email and click verification link
```

## 6. Test (5 minutes)

```bash
# Get CloudFront URL
cd terraform/environments/poc
DASHBOARD=$(terraform output -raw cloudfront_url)
open $DASHBOARD

# Test API
API=$(terraform output -raw api_gateway_url)
curl $API/api/live
```

## 7. Setup Raspberry Pi (10 minutes)

```bash
# Generate IoT certificates
aws iot create-keys-and-certificate --set-as-active \
  --certificate-pem-outfile device.crt \
  --private-key-outfile device.key
CERT_ARN="<from-output>"

# Attach policy
aws iot attach-policy \
  --policy-name ecg-monitor-poc-device-policy \
  --target $CERT_ARN

# Attach to thing
aws iot attach-thing-principal \
  --thing-name ecg-monitor-ecg-device-001 \
  --principal $CERT_ARN

# Download Root CA
wget https://www.amazontrust.com/repository/AmazonRootCA1.pem

# Copy to Pi
scp device.crt device.key AmazonRootCA1.pem pi@raspberrypi:~/certs/
scp config/pi-config-deployed.yaml pi@raspberrypi:~/
```

## 8. Run on Pi (5 minutes)

```bash
ssh pi@raspberrypi
git clone https://github.com/23blocks-OS/ECG_Monitor.git
cd ECG_Monitor

# Install
pip3 install -r pi-collector/requirements.txt
pip3 install -r pi-streamer/requirements.txt

# Test (mock mode)
python3 pi-collector/main.py --mock &
python3 pi-streamer/main.py --mock &

# Real mode (with certificates)
python3 pi-streamer/main.py  # No --mock flag
```

## 9. Monitor

```bash
# Logs
aws logs tail /aws/lambda/ecg-monitor-poc-preprocessor --follow

# Data
aws s3 ls s3://ecg-monitor-poc-raw-data/ --recursive | tail

# Dashboard
open $DASHBOARD
```

## Cleanup

```bash
cd terraform/environments/poc
terraform destroy
```

---

## Costs

**Daily:** ~$10-25
**Monthly:** ~$300-750 (24/7 operation)

**Optimization:**
- Analyze fewer batches (5% vs 10%)
- Shorter retention (30 days)
- Lower sampling rate

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 403 on IoT connect | Verify cert attached to policy |
| No email | Verify email in SES |
| No dashboard data | Check API URL in config.js |
| Lambda errors | Check CloudWatch logs |

Full guide: [docs/aws-deployment.md](docs/aws-deployment.md)

---

**Total Time:** ~45 minutes from zero to deployed
