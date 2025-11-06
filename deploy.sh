#!/bin/bash
#
# ECG Monitor Deployment Script
#
# Deploys the complete ECG Monitor system to AWS
#

set -e  # Exit on error

echo "=========================================="
echo "ECG Monitor - Deployment Script"
echo "=========================================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI not found. Please install it first."
    exit 1
fi

# Check Terraform
if ! command -v terraform &> /dev/null; then
    echo "Error: Terraform not found. Please install it first."
    exit 1
fi

# Check configuration
CONFIG_FILE="terraform/environments/poc/terraform.tfvars"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Configuration file not found: $CONFIG_FILE"
    echo "Please copy terraform.tfvars.example and fill in your values."
    exit 1
fi

echo "✓ Prerequisites check passed"
echo ""

# Deploy Lambda functions
echo "=========================================="
echo "Step 1: Building Lambda deployment packages"
echo "=========================================="
echo ""

for lambda_dir in lambda/*/; do
    if [ -f "${lambda_dir}handler.py" ]; then
        lambda_name=$(basename "$lambda_dir")
        echo "Building $lambda_name..."

        cd "$lambda_dir"

        # Clean old deployment package
        rm -f deployment.zip

        # Create deployment package
        if [ -f "requirements.txt" ]; then
            # Install dependencies to package/
            mkdir -p package
            pip install -r requirements.txt -t package/ --quiet

            # Create zip with dependencies
            cd package
            zip -r ../deployment.zip . --quiet
            cd ..

            # Add handler code
            zip -g deployment.zip handler.py --quiet

            # Clean up
            rm -rf package
        else
            # Just zip handler
            zip deployment.zip handler.py --quiet
        fi

        echo "✓ Built $lambda_name ($(du -h deployment.zip | cut -f1))"
        cd - > /dev/null
    fi
done

echo ""
echo "✓ All Lambda packages built"
echo ""

# Deploy Terraform infrastructure
echo "=========================================="
echo "Step 2: Deploying AWS Infrastructure"
echo "=========================================="
echo ""

cd terraform/environments/poc

echo "Initializing Terraform..."
terraform init

echo ""
echo "Planning deployment..."
terraform plan -out=tfplan

echo ""
read -p "Proceed with deployment? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo "Applying Terraform configuration..."
terraform apply tfplan

echo ""
echo "✓ Infrastructure deployed"
echo ""

# Get outputs
echo "=========================================="
echo "Step 3: Collecting deployment outputs"
echo "=========================================="
echo ""

IOT_ENDPOINT=$(terraform output -raw iot_endpoint)
API_URL=$(terraform output -raw api_gateway_url)
CLOUDFRONT_URL=$(terraform output -raw cloudfront_url)
WEB_BUCKET=$(terraform output -raw web_bucket)

echo "IoT Endpoint: $IOT_ENDPOINT"
echo "API Gateway URL: $API_URL"
echo "CloudFront URL: $CLOUDFRONT_URL"
echo "Web Bucket: $WEB_BUCKET"
echo ""

# Deploy web dashboard
echo "=========================================="
echo "Step 4: Deploying Web Dashboard"
echo "=========================================="
echo ""

cd - > /dev/null  # Back to root

# Update API URL in dashboard
echo "Updating dashboard configuration..."
cat > web-dashboard/config.js << EOF
// Auto-generated during deployment
window.ECG_API_URL = '${API_URL}';
EOF

# Sync to S3
echo "Uploading dashboard to S3..."
aws s3 sync web-dashboard/ s3://${WEB_BUCKET}/ \
    --exclude "*.md" \
    --exclude ".DS_Store" \
    --cache-control "max-age=300"

echo "✓ Dashboard deployed"
echo ""

# Generate Pi configuration
echo "=========================================="
echo "Step 5: Generating Pi Configuration"
echo "=========================================="
echo ""

cat > config/pi-config-deployed.yaml << EOF
# Auto-generated Pi configuration

hardware:
  device: "CJMCU-1293"
  chip: "ADS1293"
  spi_bus: 0
  spi_device: 0
  spi_speed_hz: 1000000
  gpio_reset_pin: 17
  gpio_drdy_pin: 27

ecg:
  channels: 3
  sampling_rate_hz: 250
  resolution_bits: 24
  gain: 6

processing:
  enable_notch_filter: true
  notch_frequency_hz: 60
  enable_bandpass_filter: true
  bandpass_low_hz: 0.5
  bandpass_high_hz: 40

buffer:
  size_seconds: 30
  enable_disk_cache: true
  cache_directory: "/var/ecg_cache"
  max_cache_size_mb: 500

streaming:
  batch_size_seconds: 10
  compression: true
  retry_attempts: 3

aws_iot:
  endpoint: "${IOT_ENDPOINT}"
  client_id: "ecg-device-001"
  topic_prefix: "ecg/device001"
  cert_path: "/home/pi/certs/device.crt"
  key_path: "/home/pi/certs/device.key"
  ca_path: "/home/pi/certs/AmazonRootCA1.pem"

logging:
  level: "INFO"
  file_path: "/var/log/ecg_monitor.log"
EOF

echo "✓ Pi configuration generated: config/pi-config-deployed.yaml"
echo ""

# Final instructions
echo "=========================================="
echo "Deployment Complete! 🎉"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Dashboard URL:"
echo "   $CLOUDFRONT_URL"
echo ""
echo "2. Setup Raspberry Pi:"
echo "   a. Copy config/pi-config-deployed.yaml to your Pi"
echo "   b. Generate IoT certificates:"
echo "      terraform/scripts/generate-iot-certs.sh"
echo "   c. Copy certificates to /home/pi/certs/"
echo "   d. Install Pi software:"
echo "      cd pi-collector && pip install -r requirements.txt"
echo "      cd ../pi-streamer && pip install -r requirements.txt"
echo ""
echo "3. Verify email in SES:"
echo "   Check your email for AWS SES verification link"
echo ""
echo "4. Start monitoring:"
echo "   On Pi: python3 pi-collector/main.py &"
echo "          python3 pi-streamer/main.py &"
echo ""
echo "=========================================="
