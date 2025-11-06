#!/bin/bash

# ECG Monitor - Prerequisites Validation Script
# Checks all required tools and configurations before installation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track validation status
VALIDATION_FAILED=0

# Print section header
print_header() {
    echo ""
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
}

# Print success message
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Print error message
print_error() {
    echo -e "${RED}✗${NC} $1"
    VALIDATION_FAILED=1
}

# Print warning message
print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check version requirement
check_version() {
    local cmd=$1
    local required=$2
    local version_flag=$3

    if command_exists "$cmd"; then
        local installed=$($cmd $version_flag 2>&1 | head -n 1)
        print_success "$cmd is installed: $installed"
        return 0
    else
        print_error "$cmd is not installed (required: $required or higher)"
        return 1
    fi
}

# Main validation
print_header "ECG Monitor - Prerequisites Validation"

echo "Checking system requirements..."
echo ""

# Check operating system
print_header "1. Operating System"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    print_success "Linux detected: $OSTYPE"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    print_success "macOS detected: $OSTYPE"
else
    print_warning "Unsupported OS: $OSTYPE (Linux/macOS recommended)"
fi

# Check AWS CLI
print_header "2. AWS CLI"
if command_exists aws; then
    AWS_VERSION=$(aws --version 2>&1 | cut -d' ' -f1 | cut -d'/' -f2)
    print_success "AWS CLI installed: $AWS_VERSION"

    # Check AWS credentials
    if aws sts get-caller-identity >/dev/null 2>&1; then
        AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
        AWS_USER=$(aws sts get-caller-identity --query Arn --output text | cut -d'/' -f2)
        print_success "AWS credentials configured"
        echo "           Account: $AWS_ACCOUNT"
        echo "           User/Role: $AWS_USER"
    else
        print_error "AWS credentials not configured. Run: aws configure"
    fi
else
    print_error "AWS CLI not installed. Visit: https://aws.amazon.com/cli/"
fi

# Check Terraform
print_header "3. Terraform"
if command_exists terraform; then
    TF_VERSION=$(terraform version -json 2>/dev/null | grep -o '"terraform_version":"[^"]*' | cut -d'"' -f4)
    if [[ -z "$TF_VERSION" ]]; then
        TF_VERSION=$(terraform version | head -n1 | cut -d'v' -f2)
    fi

    # Compare version (require 1.5.0+)
    REQUIRED_VERSION="1.5.0"
    if [[ "$(printf '%s\n' "$REQUIRED_VERSION" "$TF_VERSION" | sort -V | head -n1)" == "$REQUIRED_VERSION" ]]; then
        print_success "Terraform installed: v$TF_VERSION (meets requirement >= 1.5.0)"
    else
        print_error "Terraform version too old: v$TF_VERSION (required: >= 1.5.0)"
    fi
else
    print_error "Terraform not installed. Visit: https://www.terraform.io/downloads"
fi

# Check Python
print_header "4. Python"
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
    PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1)
    PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)

    if [[ $PYTHON_MAJOR -eq 3 && $PYTHON_MINOR -ge 9 ]]; then
        print_success "Python installed: $PYTHON_VERSION (meets requirement >= 3.9)"
    else
        print_error "Python version too old: $PYTHON_VERSION (required: >= 3.9)"
    fi

    # Check pip
    if command_exists pip3; then
        print_success "pip3 is installed"
    else
        print_warning "pip3 not found (needed for Lambda packaging)"
    fi
else
    print_error "Python 3 not installed"
fi

# Check Node.js (for dashboard builds)
print_header "5. Node.js (for Web Dashboards)"
if command_exists node; then
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)

    if [[ $NODE_MAJOR -ge 18 ]]; then
        print_success "Node.js installed: v$NODE_VERSION (meets requirement >= 18)"
    else
        print_warning "Node.js version: v$NODE_VERSION (recommended: >= 18)"
    fi

    # Check npm
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        print_success "npm installed: v$NPM_VERSION"
    fi
else
    print_warning "Node.js not installed (optional, for dashboard builds)"
fi

# Check Git
print_header "6. Git"
if command_exists git; then
    GIT_VERSION=$(git --version | cut -d' ' -f3)
    print_success "Git installed: v$GIT_VERSION"
else
    print_warning "Git not installed (recommended for version control)"
fi

# Check zip utility (for Lambda packaging)
print_header "7. Additional Tools"
if command_exists zip; then
    print_success "zip utility installed"
else
    print_error "zip utility not found (required for Lambda packaging)"
fi

if command_exists jq; then
    print_success "jq installed (useful for JSON parsing)"
else
    print_warning "jq not installed (optional, but helpful)"
fi

# Check disk space
print_header "8. System Resources"
if command_exists df; then
    AVAILABLE_SPACE=$(df -h . | awk 'NR==2 {print $4}')
    print_success "Available disk space: $AVAILABLE_SPACE"
fi

if command_exists free; then
    AVAILABLE_RAM=$(free -h | awk 'NR==2 {print $7}')
    print_success "Available RAM: $AVAILABLE_RAM"
elif command_exists vm_stat; then
    # macOS
    FREE_PAGES=$(vm_stat | grep "Pages free" | awk '{print $3}' | tr -d '.')
    FREE_GB=$(echo "scale=2; $FREE_PAGES * 4096 / 1024 / 1024 / 1024" | bc)
    print_success "Available RAM: ~${FREE_GB}GB"
fi

# Check AWS region configuration
print_header "9. AWS Configuration"
if command_exists aws; then
    AWS_DEFAULT_REGION=$(aws configure get region 2>/dev/null || echo "not set")
    if [[ "$AWS_DEFAULT_REGION" != "not set" ]]; then
        print_success "AWS default region: $AWS_DEFAULT_REGION"
    else
        print_warning "AWS default region not set (will prompt during installation)"
    fi
fi

# Summary
print_header "Validation Summary"

if [ $VALIDATION_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All critical prerequisites are met!${NC}"
    echo ""
    echo "You can proceed with the installation."
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some prerequisites are missing or misconfigured.${NC}"
    echo ""
    echo "Please install the missing components and try again."
    echo ""
    echo "Quick installation guides:"
    echo "  - AWS CLI:    https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    echo "  - Terraform:  https://developer.hashicorp.com/terraform/install"
    echo "  - Python 3.9+: https://www.python.org/downloads/"
    echo "  - Node.js 18+: https://nodejs.org/"
    echo ""
    exit 1
fi
