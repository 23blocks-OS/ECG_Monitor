#!/bin/bash

# ECG Monitor - Interactive Configuration Questionnaire
# Collects user inputs and generates terraform.tfvars

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration file path
CONFIG_FILE="terraform/environments/poc/terraform.tfvars"
CONFIG_DIR="terraform/environments/poc"

# Configuration variables
PROJECT_NAME=""
ENVIRONMENT=""
AWS_REGION=""
ALERT_EMAIL=""
ANTHROPIC_API_KEY=""
DEVICE_ID=""
ECG_SAMPLING_RATE=""
S3_RETENTION_DAYS=""
ORGANIZATION_NAME=""
MAX_USERS=""

# Print section header
print_header() {
    echo ""
    echo -e "${BLUE}${BOLD}================================${NC}"
    echo -e "${BLUE}${BOLD}$1${NC}"
    echo -e "${BLUE}${BOLD}================================${NC}"
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

# Prompt for input with validation
prompt_input() {
    local prompt=$1
    local default=$2
    local validation_type=$3
    local value=""

    while true; do
        if [ -n "$default" ]; then
            read -p "$(echo -e ${CYAN}$prompt${NC} [${default}]: )" value
            value=${value:-$default}
        else
            read -p "$(echo -e ${CYAN}$prompt${NC}: )" value
        fi

        # Validate input based on type
        case $validation_type in
            "email")
                if [[ "$value" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
                    echo "$value"
                    return 0
                else
                    echo -e "${RED}Invalid email format. Please try again.${NC}"
                fi
                ;;
            "api_key")
                if [[ "$value" =~ ^sk-ant-[a-zA-Z0-9_-]{95,}$ ]]; then
                    echo "$value"
                    return 0
                else
                    echo -e "${RED}Invalid Anthropic API key format (should start with 'sk-ant-'). Please try again.${NC}"
                fi
                ;;
            "region")
                # List of valid AWS regions
                if [[ "$value" =~ ^(us|eu|ap|sa|ca|me|af|il)- ]]; then
                    echo "$value"
                    return 0
                else
                    echo -e "${RED}Invalid AWS region. Please try again.${NC}"
                fi
                ;;
            "number")
                if [[ "$value" =~ ^[0-9]+$ ]]; then
                    echo "$value"
                    return 0
                else
                    echo -e "${RED}Please enter a valid number.${NC}"
                fi
                ;;
            "alphanumeric")
                if [[ "$value" =~ ^[a-zA-Z0-9_-]+$ ]]; then
                    echo "$value"
                    return 0
                else
                    echo -e "${RED}Please use only letters, numbers, hyphens, and underscores.${NC}"
                fi
                ;;
            *)
                if [ -n "$value" ]; then
                    echo "$value"
                    return 0
                else
                    echo -e "${RED}This field is required. Please try again.${NC}"
                fi
                ;;
        esac
    done
}

# Prompt for selection
prompt_select() {
    local prompt=$1
    shift
    local options=("$@")

    echo -e "${CYAN}$prompt${NC}"
    PS3="$(echo -e ${CYAN}Enter number:${NC} )"
    select opt in "${options[@]}"; do
        if [ -n "$opt" ]; then
            echo "$opt"
            return 0
        fi
    done
}

# Main questionnaire
main() {
    clear
    print_header "ECG Monitor - Interactive Setup"

    echo "Welcome to the ECG Monitor installation wizard!"
    echo ""
    echo "This wizard will guide you through the configuration process."
    echo "You'll be asked a few questions to customize your deployment."
    echo ""
    read -p "Press Enter to continue..."

    # 1. Organization Information
    print_header "1. Organization Information"
    print_info "Tell us about your healthcare organization"
    echo ""

    ORGANIZATION_NAME=$(prompt_input "Organization name (e.g., 'Acme Medical Clinic')" "" "required")

    echo ""
    ORGANIZATION_TYPE=$(prompt_select "Organization type:" "Clinic" "Hospital" "Research Lab" "Home Use")

    echo ""
    MAX_USERS=$(prompt_input "Maximum number of users (patients + staff)" "10" "number")

    # 2. Deployment Configuration
    print_header "2. Deployment Configuration"
    print_info "Configure your AWS deployment settings"
    echo ""

    PROJECT_NAME=$(prompt_input "Project name (lowercase, alphanumeric)" "ecg-monitor" "alphanumeric")

    echo ""
    ENVIRONMENT=$(prompt_select "Environment type:" "poc" "dev" "prod")

    echo ""
    echo "Common AWS Regions:"
    echo "  us-east-1 (N. Virginia)    - Default, most services"
    echo "  us-west-2 (Oregon)         - West coast US"
    echo "  eu-west-1 (Ireland)        - Europe"
    echo "  ap-southeast-1 (Singapore) - Asia Pacific"
    echo ""

    # Try to get default region from AWS CLI
    DEFAULT_REGION=$(aws configure get region 2>/dev/null || echo "us-east-1")
    AWS_REGION=$(prompt_input "AWS region" "$DEFAULT_REGION" "region")

    # 3. AI Configuration
    print_header "3. AI Analysis Configuration"
    print_info "Configure Claude AI for ECG analysis"
    echo ""

    echo "You'll need an Anthropic API key from: https://console.anthropic.com/"
    echo ""
    ANTHROPIC_API_KEY=$(prompt_input "Anthropic API key (sk-ant-...)" "" "api_key")

    # 4. Notification Setup
    print_header "4. Alert & Notification Setup"
    print_info "Configure how you'll receive alerts"
    echo ""

    ALERT_EMAIL=$(prompt_input "Email address for critical alerts" "" "email")

    echo ""
    print_info "Note: You'll need to verify this email in AWS SES after deployment"

    # 5. Device Configuration
    print_header "5. Device Configuration"
    print_info "Configure your ECG monitoring device"
    echo ""

    DEVICE_ID=$(prompt_input "Device identifier (e.g., 'device-001')" "ecg-device-001" "alphanumeric")

    echo ""
    ECG_SAMPLING_RATE=$(prompt_input "ECG sampling rate (Hz)" "250" "number")

    # 6. Data Retention
    print_header "6. Data Retention Policy"
    print_info "Configure how long to store raw ECG data"
    echo ""

    echo "Recommended retention periods:"
    echo "  - 30 days: Testing/POC"
    echo "  - 90 days: Short-term monitoring"
    echo "  - 365 days: Long-term records"
    echo ""
    S3_RETENTION_DAYS=$(prompt_input "Data retention (days)" "90" "number")

    # 7. Configuration Summary
    print_header "Configuration Summary"

    echo "Please review your configuration:"
    echo ""
    echo -e "${BOLD}Organization:${NC}"
    echo "  Name:           $ORGANIZATION_NAME"
    echo "  Type:           $ORGANIZATION_TYPE"
    echo "  Max Users:      $MAX_USERS"
    echo ""
    echo -e "${BOLD}Deployment:${NC}"
    echo "  Project:        $PROJECT_NAME"
    echo "  Environment:    $ENVIRONMENT"
    echo "  AWS Region:     $AWS_REGION"
    echo ""
    echo -e "${BOLD}Notifications:${NC}"
    echo "  Alert Email:    $ALERT_EMAIL"
    echo ""
    echo -e "${BOLD}Device:${NC}"
    echo "  Device ID:      $DEVICE_ID"
    echo "  Sampling Rate:  $ECG_SAMPLING_RATE Hz"
    echo "  Data Retention: $S3_RETENTION_DAYS days"
    echo ""
    echo -e "${BOLD}AI:${NC}"
    echo "  API Key:        ${ANTHROPIC_API_KEY:0:20}... (hidden)"
    echo ""

    # Estimate costs
    print_header "Estimated Monthly Costs"
    echo "Based on 1 device, continuous monitoring:"
    echo ""
    echo "  AWS IoT Core:        ~\$5"
    echo "  Lambda Functions:    ~\$10"
    echo "  DynamoDB:            ~\$5"
    echo "  S3 Storage:          ~\$2"
    echo "  Data Transfer:       ~\$3"
    echo "  Claude AI API:       ~\$20-50 (usage-based)"
    echo "  ─────────────────────────"
    echo "  Total:               ~\$45-75/month"
    echo ""
    print_info "Costs scale with number of devices and analysis frequency"
    echo ""

    read -p "$(echo -e ${CYAN}Do you want to proceed with this configuration? [Y/n]:${NC} )" confirm
    confirm=${confirm:-Y}

    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo ""
        echo "Configuration cancelled. Please run the installer again."
        exit 1
    fi

    # 8. Generate terraform.tfvars
    print_header "Generating Configuration Files"

    echo "Creating Terraform configuration..."

    # Ensure directory exists
    mkdir -p "$CONFIG_DIR"

    # Generate terraform.tfvars
    cat > "$CONFIG_FILE" <<EOF
# ECG Monitor - Terraform Configuration
# Generated by interactive installer on $(date)

# Project Configuration
project_name = "$PROJECT_NAME"
environment  = "$ENVIRONMENT"
aws_region   = "$AWS_REGION"

# Organization Settings
organization_name = "$ORGANIZATION_NAME"
organization_type = "$(echo $ORGANIZATION_TYPE | tr '[:upper:]' '[:lower:]')"
max_users         = $MAX_USERS

# AI Configuration
anthropic_api_key = "$ANTHROPIC_API_KEY"

# Notification Configuration
alert_email = "$ALERT_EMAIL"

# Device Configuration
device_id         = "$DEVICE_ID"
ecg_sampling_rate = $ECG_SAMPLING_RATE
batch_size_seconds = 10

# Data Retention
s3_retention_days = $S3_RETENTION_DAYS

# Advanced Settings (defaults)
lambda_timeout              = 300
enable_detailed_monitoring  = true
enable_encryption          = true
EOF

    print_success "Configuration saved to: $CONFIG_FILE"

    # Save configuration summary for post-install
    cat > "install-config.json" <<EOF
{
  "organization_name": "$ORGANIZATION_NAME",
  "organization_type": "$ORGANIZATION_TYPE",
  "project_name": "$PROJECT_NAME",
  "environment": "$ENVIRONMENT",
  "aws_region": "$AWS_REGION",
  "alert_email": "$ALERT_EMAIL",
  "device_id": "$DEVICE_ID",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

    print_success "Installation metadata saved to: install-config.json"

    echo ""
    print_header "Configuration Complete!"

    echo "Your ECG Monitor is ready to deploy."
    echo ""
    echo "Next steps:"
    echo "  1. Review the configuration in: $CONFIG_FILE"
    echo "  2. The installer will now deploy your infrastructure"
    echo "  3. Deployment will take approximately 10-15 minutes"
    echo ""

    return 0
}

# Run main function
main
