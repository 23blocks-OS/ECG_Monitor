#!/bin/bash

# ECG Monitor - Post-Installation Summary
# Displays deployment results and next steps

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Paths
TERRAFORM_OUTPUT_FILE="terraform/environments/poc/terraform-output.json"
CONFIG_FILE="install-config.json"
PI_CONFIG_FILE="config/pi-config-deployed.yaml"
CERT_DIR="terraform/environments/poc/certs"

# Print section header
print_header() {
    echo ""
    echo -e "${GREEN}${BOLD}================================${NC}"
    echo -e "${GREEN}${BOLD}$1${NC}"
    echo -e "${GREEN}${BOLD}================================${NC}"
    echo ""
}

# Print info message
print_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

# Print success message
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Print warning message
print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Extract Terraform outputs
get_terraform_output() {
    local key=$1
    if [ -f "$TERRAFORM_OUTPUT_FILE" ]; then
        cat "$TERRAFORM_OUTPUT_FILE" | grep "\"$key\"" | cut -d'"' -f4 || echo "N/A"
    else
        # Try to get from terraform output command
        cd terraform/environments/poc && terraform output -raw "$key" 2>/dev/null || echo "N/A"
        cd - >/dev/null
    fi
}

# Main summary
main() {
    clear
    print_header "🎉 ECG Monitor - Installation Complete!"

    echo "Your ECG Monitor system has been successfully deployed!"
    echo ""

    # Read configuration
    if [ -f "$CONFIG_FILE" ]; then
        ORG_NAME=$(cat "$CONFIG_FILE" | grep organization_name | cut -d'"' -f4)
        ENVIRONMENT=$(cat "$CONFIG_FILE" | grep environment | cut -d'"' -f4)
        AWS_REGION=$(cat "$CONFIG_FILE" | grep aws_region | cut -d'"' -f4)
        DEVICE_ID=$(cat "$CONFIG_FILE" | grep device_id | cut -d'"' -f4)
        ALERT_EMAIL=$(cat "$CONFIG_FILE" | grep alert_email | cut -d'"' -f4)
    fi

    # Get Terraform outputs
    IOT_ENDPOINT=$(get_terraform_output "iot_endpoint")
    API_URL=$(get_terraform_output "api_gateway_url")
    CLOUDFRONT_URL=$(get_terraform_output "cloudfront_url")
    PROVIDER_PORTAL_URL=$(get_terraform_output "provider_portal_url")
    PATIENT_PORTAL_URL=$(get_terraform_output "patient_portal_url")
    S3_BUCKET_RAW=$(get_terraform_output "s3_bucket_raw_data")
    S3_BUCKET_PROCESSED=$(get_terraform_output "s3_bucket_processed_data")

    # Display deployment information
    print_header "Deployment Information"

    echo -e "${BOLD}Organization:${NC} $ORG_NAME"
    echo -e "${BOLD}Environment:${NC}  $ENVIRONMENT"
    echo -e "${BOLD}AWS Region:${NC}   $AWS_REGION"
    echo ""

    print_header "AWS Resources Created"

    echo "Cloud Infrastructure:"
    print_success "IoT Core Endpoint:      $IOT_ENDPOINT"
    print_success "API Gateway:            $API_URL"
    print_success "S3 Bucket (Raw Data):   $S3_BUCKET_RAW"
    print_success "S3 Bucket (Processed):  $S3_BUCKET_PROCESSED"
    echo ""

    echo "Lambda Functions:"
    print_success "ECG Preprocessor"
    print_success "AI Analyzer (Claude)"
    print_success "Alert Worker"
    print_success "API Handler"
    echo ""

    echo "DynamoDB Tables:"
    print_success "sessions, alerts, analysis, users, organizations"
    print_success "device-users, blood_pressure, weight, health_journal"
    echo ""

    print_header "Web Dashboards"

    if [ "$PROVIDER_PORTAL_URL" != "N/A" ]; then
        echo -e "${BOLD}Provider Portal (Healthcare Staff):${NC}"
        echo -e "  ${CYAN}$PROVIDER_PORTAL_URL${NC}"
        echo ""
    fi

    if [ "$PATIENT_PORTAL_URL" != "N/A" ]; then
        echo -e "${BOLD}Patient Portal (Patient Access):${NC}"
        echo -e "  ${CYAN}$PATIENT_PORTAL_URL${NC}"
        echo ""
    fi

    if [ "$CLOUDFRONT_URL" != "N/A" ]; then
        echo -e "${BOLD}Main Dashboard:${NC}"
        echo -e "  ${CYAN}$CLOUDFRONT_URL${NC}"
        echo ""
    fi

    print_header "Next Steps - Raspberry Pi Setup"

    echo "To start collecting ECG data, you need to set up your Raspberry Pi:"
    echo ""

    echo -e "${BOLD}1. Prepare Your Raspberry Pi${NC}"
    echo "   - Install Raspberry Pi OS (64-bit recommended)"
    echo "   - Connect to network (WiFi or Ethernet)"
    echo "   - Enable SPI interface: sudo raspi-config"
    echo ""

    echo -e "${BOLD}2. Transfer Configuration & Certificates${NC}"
    if [ -d "$CERT_DIR" ]; then
        echo "   Copy these files to your Raspberry Pi:"
        echo "   - $PI_CONFIG_FILE"
        echo "   - $CERT_DIR/device.crt"
        echo "   - $CERT_DIR/device.key"
        echo "   - $CERT_DIR/AmazonRootCA1.pem"
        echo ""
        print_info "Use SCP: scp -r $CERT_DIR pi@raspberrypi.local:/home/pi/certs/"
    else
        print_warning "Certificate directory not found. Generate certificates manually."
    fi
    echo ""

    echo -e "${BOLD}3. Install ECG Software on Pi${NC}"
    echo "   Run these commands on your Raspberry Pi:"
    echo ""
    echo "   git clone https://github.com/23blocks-OS/ECG_Monitor.git"
    echo "   cd ECG_Monitor"
    echo "   sudo pip3 install -r requirements.txt"
    echo "   python3 pi-collector.py &"
    echo "   python3 pi-streamer.py &"
    echo ""

    echo -e "${BOLD}4. Connect ECG Hardware${NC}"
    echo "   - CJMCU-1293 to Raspberry Pi via SPI"
    echo "   - Attach 3-lead ECG electrodes to patient"
    echo "   - Verify LED indicators on device"
    echo ""

    print_header "Important Post-Deployment Tasks"

    echo -e "${BOLD}1. Verify Email for Alerts${NC}"
    print_warning "Check your email ($ALERT_EMAIL) for AWS SES verification"
    echo "   - Open the email from Amazon SES"
    echo "   - Click the verification link"
    echo "   - Alerts will not work until verified!"
    echo ""

    echo -e "${BOLD}2. Create Initial User Accounts${NC}"
    echo "   Run the user management script:"
    echo "   python3 scripts/create-user.py --role admin --email admin@example.com"
    echo ""

    echo -e "${BOLD}3. Test the System${NC}"
    echo "   - Log into Provider Portal"
    echo "   - Verify device connection (should show online)"
    echo "   - Check data streaming (look for recent sessions)"
    echo "   - Test alert notifications"
    echo ""

    echo -e "${BOLD}4. Configure Organization Settings${NC}"
    echo "   - Set alert thresholds (heart rate, HRV)"
    echo "   - Configure user roles and permissions"
    echo "   - Set up patient profiles"
    echo ""

    print_header "Monitoring & Troubleshooting"

    echo "View logs in AWS CloudWatch:"
    echo "  aws logs tail /aws/lambda/ecg-preprocessor --follow"
    echo "  aws logs tail /aws/lambda/ecg-ai-analyzer --follow"
    echo ""

    echo "Check device connection:"
    echo "  aws iot describe-thing --thing-name $DEVICE_ID"
    echo ""

    echo "Test API endpoint:"
    echo "  curl $API_URL/health"
    echo ""

    print_header "Useful Commands"

    echo "View Terraform state:"
    echo "  cd terraform/environments/poc && terraform show"
    echo ""

    echo "Update infrastructure:"
    echo "  cd terraform/environments/poc && terraform apply"
    echo ""

    echo "Destroy infrastructure (CAUTION):"
    echo "  cd terraform/environments/poc && terraform destroy"
    echo ""

    print_header "Support & Documentation"

    echo "Documentation:     README.md"
    echo "Architecture:      docs/ARCHITECTURE.md"
    echo "Troubleshooting:   docs/TROUBLESHOOTING.md"
    echo "GitHub Issues:     https://github.com/23blocks-OS/ECG_Monitor/issues"
    echo ""

    print_header "Cost Monitoring"

    print_info "Set up AWS Cost Alerts to monitor spending:"
    echo ""
    echo "1. Go to AWS Billing Dashboard"
    echo "2. Create a budget for ~\$100/month"
    echo "3. Set alerts at 50%, 80%, 100% thresholds"
    echo ""

    print_header "Security Reminders"

    print_warning "Protect your credentials:"
    echo "  - Never commit certificates to git"
    echo "  - Rotate API keys regularly"
    echo "  - Use AWS IAM best practices"
    echo "  - Enable MFA on AWS account"
    echo "  - Review CloudTrail logs periodically"
    echo ""

    print_header "Summary"

    echo -e "${GREEN}${BOLD}✓ Installation Complete!${NC}"
    echo ""
    echo "Your ECG Monitor infrastructure is ready."
    echo "Complete the Raspberry Pi setup to start monitoring."
    echo ""
    echo -e "${CYAN}Thank you for using ECG Monitor!${NC}"
    echo ""

    # Save summary to file
    SUMMARY_FILE="installation-summary-$(date +%Y%m%d-%H%M%S).txt"
    {
        echo "ECG Monitor - Installation Summary"
        echo "Generated: $(date)"
        echo ""
        echo "Organization: $ORG_NAME"
        echo "Environment: $ENVIRONMENT"
        echo "Region: $AWS_REGION"
        echo ""
        echo "IoT Endpoint: $IOT_ENDPOINT"
        echo "API URL: $API_URL"
        echo "Provider Portal: $PROVIDER_PORTAL_URL"
        echo "Patient Portal: $PATIENT_PORTAL_URL"
        echo ""
        echo "Alert Email: $ALERT_EMAIL (verify in inbox)"
        echo "Device ID: $DEVICE_ID"
    } > "$SUMMARY_FILE"

    print_info "Summary saved to: $SUMMARY_FILE"
    echo ""
}

# Run main function
main
