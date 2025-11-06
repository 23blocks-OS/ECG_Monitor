#!/bin/bash

# ECG Monitor - One-Click Installation Script
# Automated deployment wizard for AWS infrastructure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Log file
LOG_FILE="installation-$(date +%Y%m%d-%H%M%S).log"

# Print banner
print_banner() {
    clear
    echo -e "${BLUE}${BOLD}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║              ECG Monitor - Cloud Deployment               ║
║                                                           ║
║         Automated AWS Infrastructure Installation         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# Print section header
print_header() {
    echo ""
    echo -e "${MAGENTA}${BOLD}┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓${NC}"
    echo -e "${MAGENTA}${BOLD}┃ $1${NC}"
    echo -e "${MAGENTA}${BOLD}┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛${NC}"
    echo ""
}

# Print step
print_step() {
    echo -e "${CYAN}▶${NC} $1"
}

# Print success
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Print error
print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Print warning
print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Log message
log_message() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Error handler
error_handler() {
    local line_number=$1
    print_error "Installation failed at line $line_number"
    echo ""
    echo "Please check the log file for details: $LOG_FILE"
    echo ""
    echo "Common issues:"
    echo "  - AWS credentials not configured"
    echo "  - Missing required tools (Terraform, AWS CLI)"
    echo "  - Insufficient AWS permissions"
    echo "  - Network connectivity issues"
    echo ""
    echo "For support, visit: https://github.com/23blocks-OS/ECG_Monitor/issues"
    exit 1
}

trap 'error_handler ${LINENO}' ERR

# Main installation flow
main() {
    print_banner

    log_message "Installation started"

    echo "Welcome to the ECG Monitor installation wizard!"
    echo ""
    echo "This installer will:"
    echo "  1. Validate prerequisites"
    echo "  2. Collect configuration via questionnaire"
    echo "  3. Deploy AWS infrastructure (IoT, Lambda, DynamoDB, S3)"
    echo "  4. Set up web dashboards"
    echo "  5. Generate Raspberry Pi configuration"
    echo ""
    echo "Estimated time: 15-20 minutes"
    echo "Estimated cost: ~\$45-75/month (usage-based)"
    echo ""

    read -p "Press Enter to begin installation or Ctrl+C to cancel..."

    # Step 1: Validate Prerequisites
    print_header "Step 1: Validating Prerequisites"
    log_message "Running prerequisite validation"

    print_step "Checking system requirements..."
    if [ -f "scripts/validate-prerequisites.sh" ]; then
        bash scripts/validate-prerequisites.sh
        if [ $? -ne 0 ]; then
            print_error "Prerequisites validation failed"
            log_message "Prerequisites validation failed"
            exit 1
        fi
        print_success "All prerequisites met!"
        log_message "Prerequisites validation passed"
    else
        print_warning "Prerequisite validation script not found, skipping..."
    fi

    echo ""
    read -p "Press Enter to continue..."

    # Step 2: Interactive Configuration
    print_header "Step 2: Configuration Questionnaire"
    log_message "Starting configuration questionnaire"

    print_step "Launching interactive questionnaire..."
    if [ -f "scripts/questionnaire.sh" ]; then
        bash scripts/questionnaire.sh
        if [ $? -ne 0 ]; then
            print_error "Configuration cancelled or failed"
            log_message "Configuration questionnaire cancelled"
            exit 1
        fi
        print_success "Configuration completed!"
        log_message "Configuration questionnaire completed"
    else
        print_error "Questionnaire script not found"
        exit 1
    fi

    echo ""
    read -p "Press Enter to start deployment..."

    # Step 3: Deploy Infrastructure
    print_header "Step 3: Deploying AWS Infrastructure"
    log_message "Starting AWS infrastructure deployment"

    print_step "Initializing Terraform..."
    cd terraform/environments/poc

    # Initialize Terraform
    terraform init -upgrade >> "$SCRIPT_DIR/$LOG_FILE" 2>&1
    print_success "Terraform initialized"
    log_message "Terraform initialized"

    # Plan deployment
    print_step "Planning infrastructure deployment..."
    terraform plan -out=tfplan >> "$SCRIPT_DIR/$LOG_FILE" 2>&1
    print_success "Deployment plan created"
    log_message "Terraform plan created"

    # Show estimated resource count
    RESOURCE_COUNT=$(terraform show -json tfplan 2>/dev/null | grep -o '"create"' | wc -l || echo "~50")
    echo "   → Creating approximately $RESOURCE_COUNT AWS resources"

    # Apply deployment
    print_step "Deploying infrastructure (this may take 10-15 minutes)..."
    echo "   ⏳ Please wait..."

    terraform apply -auto-approve tfplan >> "$SCRIPT_DIR/$LOG_FILE" 2>&1 &
    TERRAFORM_PID=$!

    # Progress indicator
    while kill -0 $TERRAFORM_PID 2>/dev/null; do
        echo -n "."
        sleep 5
    done
    wait $TERRAFORM_PID
    TERRAFORM_EXIT_CODE=$?

    echo ""
    if [ $TERRAFORM_EXIT_CODE -eq 0 ]; then
        print_success "Infrastructure deployed successfully!"
        log_message "Terraform apply completed successfully"
    else
        print_error "Infrastructure deployment failed"
        log_message "Terraform apply failed with exit code $TERRAFORM_EXIT_CODE"
        exit 1
    fi

    # Save Terraform outputs
    print_step "Extracting deployment information..."
    terraform output -json > terraform-output.json 2>/dev/null || true
    print_success "Deployment outputs saved"

    cd "$SCRIPT_DIR"

    # Step 4: Build and Deploy Lambda Functions
    print_header "Step 4: Building Lambda Functions"
    log_message "Building Lambda functions"

    print_step "Packaging Lambda functions..."

    # Check if Lambda directory exists
    if [ -d "lambda" ]; then
        for func in lambda/*/; do
            func_name=$(basename "$func")
            print_step "  → Building $func_name..."

            # Install dependencies and create zip
            if [ -f "$func/requirements.txt" ]; then
                pip3 install -q -r "$func/requirements.txt" -t "$func/package" >> "$LOG_FILE" 2>&1 || true
                cd "$func/package" && zip -q -r "../function.zip" . >> "$SCRIPT_DIR/$LOG_FILE" 2>&1
                cd ..
                zip -q -g function.zip *.py >> "$SCRIPT_DIR/$LOG_FILE" 2>&1
                cd "$SCRIPT_DIR"
            fi
        done
        print_success "Lambda functions packaged"
        log_message "Lambda functions built"
    else
        print_warning "Lambda directory not found, skipping..."
    fi

    # Step 5: Deploy Web Dashboards
    print_header "Step 5: Deploying Web Dashboards"
    log_message "Deploying web dashboards"

    # Dashboard - Provider Portal
    if [ -d "dashboard-org" ]; then
        print_step "Building provider portal..."
        cd dashboard-org
        if [ -f "package.json" ]; then
            npm install --silent >> "$SCRIPT_DIR/$LOG_FILE" 2>&1 || true
            npm run build >> "$SCRIPT_DIR/$LOG_FILE" 2>&1 || true
            print_success "Provider portal built"
        fi
        cd "$SCRIPT_DIR"
    fi

    # Dashboard - Patient Portal
    if [ -d "dashboard-next" ]; then
        print_step "Building patient portal..."
        cd dashboard-next
        if [ -f "package.json" ]; then
            npm install --silent >> "$SCRIPT_DIR/$LOG_FILE" 2>&1 || true
            npm run build >> "$SCRIPT_DIR/$LOG_FILE" 2>&1 || true
            print_success "Patient portal built"
        fi
        cd "$SCRIPT_DIR"
    fi

    log_message "Web dashboards deployed"

    # Step 6: Generate Raspberry Pi Configuration
    print_header "Step 6: Generating Device Configuration"
    log_message "Generating Raspberry Pi configuration"

    print_step "Creating Raspberry Pi configuration files..."

    # Extract IoT endpoint from Terraform
    IOT_ENDPOINT=$(cd terraform/environments/poc && terraform output -raw iot_endpoint 2>/dev/null || echo "PLACEHOLDER")

    # Create config directory
    mkdir -p config

    # Generate Pi configuration
    cat > config/pi-config-deployed.yaml <<EOF
# ECG Monitor - Raspberry Pi Configuration
# Generated: $(date)

hardware:
  device: "CJMCU-1293"
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

aws_iot:
  endpoint: "$IOT_ENDPOINT"
  client_id: "$(cat install-config.json 2>/dev/null | grep device_id | cut -d'"' -f4 || echo 'ecg-device-001')"
  cert_path: "/home/pi/certs/device.crt"
  key_path: "/home/pi/certs/device.key"
  ca_path: "/home/pi/certs/AmazonRootCA1.pem"
  topic_prefix: "ecg/data"

processing:
  batch_size_seconds: 10
  buffer_size_samples: 5000
  compression: true

logging:
  level: "INFO"
  file: "/var/log/ecg-monitor.log"
EOF

    print_success "Pi configuration generated: config/pi-config-deployed.yaml"
    log_message "Raspberry Pi configuration generated"

    # Generate setup instructions
    cat > config/PI-SETUP-INSTRUCTIONS.md <<EOF
# Raspberry Pi Setup Instructions

## Prerequisites
- Raspberry Pi 4 (4GB RAM) or Pi 3B+
- 32GB+ microSD card with Raspberry Pi OS
- CJMCU-1293 ECG module
- Network connectivity

## Installation Steps

### 1. Prepare Raspberry Pi
\`\`\`bash
# Update system
sudo apt update && sudo apt upgrade -y

# Enable SPI interface
sudo raspi-config
# Select: Interface Options → SPI → Enable

# Reboot
sudo reboot
\`\`\`

### 2. Install Dependencies
\`\`\`bash
# Install Python packages
sudo pip3 install spidev RPi.GPIO boto3 AWSIoTPythonSDK numpy scipy pyyaml

# Clone repository
git clone https://github.com/23blocks-OS/ECG_Monitor.git
cd ECG_Monitor
\`\`\`

### 3. Copy Configuration Files
\`\`\`bash
# Copy this configuration file to Pi
scp config/pi-config-deployed.yaml pi@raspberrypi.local:/home/pi/ECG_Monitor/config/

# Copy AWS IoT certificates
scp -r terraform/environments/poc/certs pi@raspberrypi.local:/home/pi/certs/
\`\`\`

### 4. Start ECG Collection
\`\`\`bash
# Test data collection
python3 pi-collector.py

# If successful, run in background
python3 pi-collector.py &
python3 pi-streamer.py &

# Set up as systemd service (optional)
sudo cp config/ecg-monitor.service /etc/systemd/system/
sudo systemctl enable ecg-monitor
sudo systemctl start ecg-monitor
\`\`\`

### 5. Verify Connection
Check AWS IoT Core to verify device is connected:
\`\`\`bash
aws iot describe-thing --thing-name $(cat install-config.json | grep device_id | cut -d'"' -f4)
\`\`\`

## Hardware Connections

| CJMCU-1293 Pin | Raspberry Pi Pin | Function |
|----------------|------------------|----------|
| VCC            | Pin 1 (3.3V)     | Power    |
| GND            | Pin 6 (GND)      | Ground   |
| MOSI           | Pin 19 (GPIO 10) | SPI MOSI |
| MISO           | Pin 21 (GPIO 9)  | SPI MISO |
| SCLK           | Pin 23 (GPIO 11) | SPI CLK  |
| CS             | Pin 24 (GPIO 8)  | SPI CS   |
| DRDY           | Pin 13 (GPIO 27) | Data Ready |
| RESET          | Pin 11 (GPIO 17) | Reset    |

## Troubleshooting

### Device not connecting to AWS
- Check network connectivity
- Verify certificate files are in correct location
- Ensure IoT endpoint is correct in config

### No ECG data
- Check SPI wiring
- Verify SPI is enabled: \`lsmod | grep spi\`
- Check ECG electrode connections

### For more help
- Documentation: README.md
- Issues: https://github.com/23blocks-OS/ECG_Monitor/issues
EOF

    print_success "Pi setup instructions generated: config/PI-SETUP-INSTRUCTIONS.md"

    # Step 7: Post-Installation Summary
    print_header "Step 7: Installation Summary"
    log_message "Generating installation summary"

    if [ -f "scripts/post-install-summary.sh" ]; then
        bash scripts/post-install-summary.sh
    else
        print_warning "Post-installation summary script not found"

        # Basic summary
        echo ""
        print_success "Installation completed successfully!"
        echo ""
        echo "Next steps:"
        echo "  1. Verify email for AWS SES alerts"
        echo "  2. Set up Raspberry Pi (see config/PI-SETUP-INSTRUCTIONS.md)"
        echo "  3. Access web dashboards (check Terraform outputs)"
        echo ""
    fi

    log_message "Installation completed successfully"

    # Final message
    echo ""
    print_header "Installation Complete! 🎉"
    echo ""
    echo "Log file saved: $LOG_FILE"
    echo ""
    echo -e "${GREEN}${BOLD}Thank you for installing ECG Monitor!${NC}"
    echo ""
}

# Run main installation
main "$@"
