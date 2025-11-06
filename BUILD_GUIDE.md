# ECG Monitor - Build & Deployment Guide

This guide provides comprehensive instructions for building and deploying all components of the ECG Monitor system using the provided Makefiles.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Individual Project Builds](#individual-project-builds)
- [Deployment](#deployment)
- [Common Workflows](#common-workflows)
- [Troubleshooting](#troubleshooting)

## Overview

The ECG Monitor project includes Makefiles for streamlined build and deployment processes across all components:

- **Root Makefile**: Orchestrates all projects
- **dashboard-next**: Next.js web dashboard
- **mobile-app**: Expo/React Native mobile application
- **pi-collector**: Python-based ECG data collector for Raspberry Pi
- **pi-streamer**: Python-based data streaming service for Raspberry Pi
- **lambda**: AWS Lambda functions for backend processing
- **web-dashboard**: Static HTML/CSS/JS dashboard
- **terraform**: Infrastructure as Code deployment

## Prerequisites

### General Requirements

- **Make**: GNU Make 3.81 or higher
- **Git**: For version control

### Project-Specific Requirements

#### Dashboard (Next.js)
- Node.js 18.x or higher
- npm or yarn

#### Mobile App (Expo)
- Node.js 18.x or higher
- npm or yarn
- Expo CLI (optional, but recommended)
- For builds: EAS CLI (`npm install -g eas-cli`)

#### Pi Applications (Python)
- Python 3.7 or higher
- pip
- For deployment: SSH access to Raspberry Pi

#### Lambda Functions
- Python 3.9 or higher
- AWS CLI configured with appropriate credentials
- zip utility

#### Web Dashboard
- Python 3.x (for local development server)
- AWS CLI (for deployment)

#### Terraform
- Terraform 1.0 or higher
- AWS CLI configured

## Quick Start

### View All Available Commands

```bash
# From the root directory
make help
```

### Install All Dependencies

```bash
make install
```

### Build All Projects

```bash
make build
```

### Deploy All Projects (Cloud Components)

```bash
make deploy-all
```

## Project Structure

```
ECG_Monitor/
├── Makefile                    # Root orchestrator
├── dashboard-next/
│   └── Makefile               # Next.js dashboard
├── mobile-app/
│   └── Makefile               # Expo mobile app
├── pi-collector/
│   └── Makefile               # Pi data collector
├── pi-streamer/
│   └── Makefile               # Pi data streamer
├── lambda/
│   └── Makefile               # Lambda functions
├── web-dashboard/
│   └── Makefile               # Static dashboard
└── terraform/
    └── Makefile               # Infrastructure
```

## Individual Project Builds

### Dashboard (Next.js)

```bash
cd dashboard-next

# Development
make install          # Install dependencies
make dev              # Start dev server (http://localhost:3000)
make lint             # Run linting

# Production
make build            # Build for production
make deploy           # Deploy to AWS S3 + CloudFront

# Configuration
make deploy S3_BUCKET=my-bucket CLOUDFRONT_ID=E1234567890ABC
```

### Mobile App (Expo)

```bash
cd mobile-app

# Development
make install          # Install dependencies
make dev              # Start Expo dev server
make ios              # Run on iOS simulator
make android          # Run on Android emulator
make web              # Run web version

# Quality checks
make lint             # Run ESLint
make type-check       # TypeScript type checking

# Production builds
make build-ios        # Build iOS app
make build-android    # Build Android APK
make deploy           # Prepare production builds
```

### Pi Collector (Python)

```bash
cd pi-collector

# Local development
make install          # Install dependencies
make dev              # Run in debug mode
make run              # Run collector
make test             # Run tests

# Deployment to Raspberry Pi
make setup-pi PI_HOST=192.168.1.100        # Initial setup
make deploy PI_HOST=192.168.1.100          # Deploy code
make install-service PI_HOST=192.168.1.100 # Install systemd service
make start-service PI_HOST=192.168.1.100   # Start service
make logs PI_HOST=192.168.1.100            # View logs
```

### Pi Streamer (Python)

```bash
cd pi-streamer

# Local development
make install          # Install dependencies
make run              # Run standard streamer
make run-multi        # Run multi-transport streamer
make test-wifi        # Test WiFi connection
make test-bt          # Test Bluetooth

# Deployment to Raspberry Pi
make setup-pi PI_HOST=192.168.1.100         # Initial setup
make deploy PI_HOST=192.168.1.100           # Deploy code
make deploy-certs PI_HOST=192.168.1.100     # Deploy AWS IoT certs
make install-service PI_HOST=192.168.1.100  # Install systemd service
make start-service PI_HOST=192.168.1.100    # Start service
make logs PI_HOST=192.168.1.100             # View logs
```

### Lambda Functions

```bash
cd lambda

# Build all functions
make build            # Build all Lambda packages

# Build individual functions
make build-api-handler
make build-preprocessor
make build-ai-analyzer
make build-alert-worker

# Deploy
make deploy-all       # Deploy all functions
make deploy-api       # Deploy API handler only
make deploy-preprocessor
make deploy-ai
make deploy-alerts

# Maintenance
make sizes            # Check package sizes
make validate         # Validate packages
```

### Web Dashboard (Static)

```bash
cd web-dashboard

# Development
make serve            # Start local server (http://localhost:8000)
make validate         # Validate HTML/CSS/JS

# Build
make build            # Prepare for deployment
make minify           # Minify assets

# Deploy
make deploy S3_BUCKET=my-bucket CLOUDFRONT_ID=E1234567890ABC
```

### Terraform (Infrastructure)

```bash
cd terraform

# Setup
make init             # Initialize Terraform
make validate         # Validate configuration
make format           # Format files

# Planning
make plan             # Show execution plan
make plan-out         # Save plan to file

# Deployment
make apply            # Apply changes (with confirmation)
make apply-auto       # Apply without confirmation

# Inspection
make show             # Show current state
make output           # Show outputs
make list             # List resources

# Destruction (BE CAREFUL!)
make destroy          # Destroy infrastructure (with confirmation)
```

## Deployment

### Full System Deployment

#### 1. Deploy Infrastructure

```bash
cd terraform
make init
make plan
make apply
```

#### 2. Deploy Lambda Functions

```bash
cd ../lambda
make build
make deploy-all
```

#### 3. Deploy Dashboards

```bash
# Next.js Dashboard
cd ../dashboard-next
make build
make deploy S3_BUCKET=ecg-dashboard-prod CLOUDFRONT_ID=YOUR_CF_ID

# Static Dashboard
cd ../web-dashboard
make build
make deploy S3_BUCKET=ecg-web-dashboard CLOUDFRONT_ID=YOUR_CF_ID
```

#### 4. Deploy to Raspberry Pi

```bash
# Set your Pi's IP address
export PI_IP=192.168.1.100

# Pi Collector
cd ../pi-collector
make setup-pi PI_HOST=$PI_IP
make install-service PI_HOST=$PI_IP
make start-service PI_HOST=$PI_IP

# Pi Streamer
cd ../pi-streamer
make setup-pi PI_HOST=$PI_IP
make deploy-certs PI_HOST=$PI_IP
make install-service PI_HOST=$PI_IP
make start-service PI_HOST=$PI_IP
```

#### 5. Build Mobile App

```bash
cd ../mobile-app
make install
make type-check
make lint
make build
```

## Common Workflows

### Development Workflow

```bash
# Start all development servers (in separate terminals)

# Terminal 1 - Dashboard
cd dashboard-next && make dev

# Terminal 2 - Mobile App
cd mobile-app && make dev

# Terminal 3 - Local testing
cd pi-collector && make dev
```

### CI/CD Pipeline

```bash
# Complete CI/CD workflow
make install          # Install all dependencies
make build            # Build all projects
make test             # Run all tests
make deploy-all       # Deploy everything
```

### Quick Updates

```bash
# Update Lambda functions only
cd lambda
make build
make deploy-all

# Update dashboard only
cd dashboard-next
make build
make deploy

# Update Pi collector
make deploy PI_HOST=192.168.1.100
make restart-service PI_HOST=192.168.1.100
```

### Monitoring Pi Services

```bash
# Check service status
make -C pi-collector status PI_HOST=192.168.1.100
make -C pi-streamer status PI_HOST=192.168.1.100

# View logs in real-time
make -C pi-collector logs PI_HOST=192.168.1.100
make -C pi-streamer logs PI_HOST=192.168.1.100

# Restart services
make -C pi-collector restart-service PI_HOST=192.168.1.100
make -C pi-streamer restart-service PI_HOST=192.168.1.100
```

## Environment Variables

### AWS Deployment

```bash
# Set AWS credentials
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_DEFAULT_REGION=us-east-1

# Set S3 buckets
export S3_BUCKET=ecg-dashboard-prod
export CLOUDFRONT_ID=E1234567890ABC
```

### Raspberry Pi Deployment

```bash
# Pi configuration
export PI_HOST=192.168.1.100
export PI_USER=pi
export DEPLOY_PATH=/home/pi/ecg-monitor
```

### Terraform

```bash
# Environment selection
export ENV=prod  # or dev, staging
export TF_VAR_FILE=prod.tfvars
```

## Troubleshooting

### Common Issues

#### Make command not found

```bash
# macOS
brew install make

# Ubuntu/Debian
sudo apt-get install make

# Check installation
make --version
```

#### Permission denied on deployment scripts

```bash
chmod +x deploy.sh
chmod +x pi-collector/setup_pi.sh
```

#### AWS CLI not configured

```bash
aws configure
# Follow prompts to enter credentials
```

#### Node modules not found

```bash
cd dashboard-next  # or mobile-app
rm -rf node_modules package-lock.json
make install
```

#### Lambda deployment fails

```bash
# Check AWS credentials
aws sts get-caller-identity

# Rebuild packages
cd lambda
make clean
make build
make validate
```

#### Terraform state locked

```bash
cd terraform
terraform force-unlock LOCK_ID
```

#### Pi deployment fails (SSH)

```bash
# Test SSH connection
ssh pi@192.168.1.100

# Add SSH key
ssh-copy-id pi@192.168.1.100

# Verify network
ping 192.168.1.100
```

### Debug Mode

Most Makefiles support verbose output. To see detailed commands:

```bash
make -n build     # Dry run (show commands without executing)
make VERBOSE=1 build  # Verbose output (if supported)
```

### Getting Help

Each Makefile has a help command:

```bash
make help                              # Root help
make -C dashboard-next help            # Dashboard help
make -C mobile-app help                # Mobile app help
# ... and so on for each project
```

## Advanced Usage

### Parallel Builds

Build multiple projects simultaneously:

```bash
make -j4 build  # Build with 4 parallel jobs
```

### Custom Variables

Override default variables:

```bash
make deploy S3_BUCKET=custom-bucket CLOUDFRONT_ID=custom-id
make -C pi-collector deploy PI_HOST=10.0.0.5 PI_USER=ubuntu
```

### Conditional Deployment

```bash
# Deploy only if tests pass
make test && make deploy-all
```

## Best Practices

1. **Always run tests before deployment**
   ```bash
   make test && make deploy-all
   ```

2. **Use specific targets for updates**
   - Don't rebuild everything if only one component changed
   - Use individual project Makefiles for faster iterations

3. **Version control your .tfvars files**
   - But never commit secrets or credentials

4. **Use workspaces for multiple environments**
   ```bash
   cd terraform
   make create-workspace WS=staging
   make switch-workspace WS=prod
   ```

5. **Monitor deployments**
   - Check logs after Pi deployments
   - Verify Lambda functions in AWS Console
   - Test dashboards after deployment

6. **Keep backups**
   - Terraform state files
   - Production configurations
   - SSL certificates

## License

See the main project README for license information.

## Support

For issues or questions:
- Check the troubleshooting section above
- Review individual project README files
- Check the main ARCHITECTURE.md and DESIGN_DECISIONS.md files
