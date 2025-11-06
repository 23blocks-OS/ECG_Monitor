# ECG Monitor - Root Makefile
# Orchestrates build and deployment for all projects

.PHONY: help install build test clean deploy deploy-all status

# Default target
help:
	@echo "ECG Monitor - Build & Deployment Commands"
	@echo "=========================================="
	@echo ""
	@echo "Main Commands:"
	@echo "  make install        - Install dependencies for all projects"
	@echo "  make build          - Build all projects"
	@echo "  make test           - Run tests for all projects"
	@echo "  make clean          - Clean build artifacts"
	@echo "  make deploy-all     - Deploy all projects"
	@echo "  make status         - Show git status"
	@echo ""
	@echo "Individual Project Commands:"
	@echo "  make dashboard      - Build Next.js dashboard"
	@echo "  make mobile         - Build mobile app"
	@echo "  make pi-collector   - Build Pi collector"
	@echo "  make pi-streamer    - Build Pi streamer"
	@echo "  make lambda         - Package Lambda functions"
	@echo "  make web            - Prepare web dashboard"
	@echo "  make infra          - Initialize infrastructure"
	@echo ""
	@echo "Deployment Commands:"
	@echo "  make deploy-dashboard    - Deploy Next.js dashboard"
	@echo "  make deploy-mobile       - Build mobile app for production"
	@echo "  make deploy-lambda       - Deploy Lambda functions"
	@echo "  make deploy-web          - Deploy static web dashboard"
	@echo "  make deploy-infra        - Deploy infrastructure with Terraform"
	@echo ""

# Install all dependencies
install:
	@echo "Installing dependencies for all projects..."
	@$(MAKE) -C dashboard-next install
	@$(MAKE) -C mobile-app install
	@$(MAKE) -C pi-collector install
	@$(MAKE) -C pi-streamer install
	@$(MAKE) -C lambda install
	@echo "✓ All dependencies installed"

# Build all projects
build:
	@echo "Building all projects..."
	@$(MAKE) -C dashboard-next build
	@$(MAKE) -C mobile-app build
	@$(MAKE) -C pi-collector build
	@$(MAKE) -C pi-streamer build
	@$(MAKE) -C lambda build
	@$(MAKE) -C web-dashboard build
	@echo "✓ All projects built"

# Run tests
test:
	@echo "Running tests for all projects..."
	@$(MAKE) -C dashboard-next test
	@$(MAKE) -C mobile-app test
	@$(MAKE) -C pi-collector test
	@$(MAKE) -C pi-streamer test
	@$(MAKE) -C lambda test
	@echo "✓ All tests completed"

# Clean all projects
clean:
	@echo "Cleaning all projects..."
	@$(MAKE) -C dashboard-next clean
	@$(MAKE) -C mobile-app clean
	@$(MAKE) -C pi-collector clean
	@$(MAKE) -C pi-streamer clean
	@$(MAKE) -C lambda clean
	@$(MAKE) -C web-dashboard clean
	@$(MAKE) -C terraform clean
	@echo "✓ All projects cleaned"

# Deploy all projects
deploy-all:
	@echo "Deploying all projects..."
	@$(MAKE) deploy-infra
	@$(MAKE) deploy-lambda
	@$(MAKE) deploy-dashboard
	@$(MAKE) deploy-web
	@echo "✓ All projects deployed"
	@echo ""
	@echo "Note: Mobile app and Pi applications need manual deployment"
	@echo "  - Mobile: make deploy-mobile (creates production builds)"
	@echo "  - Pi Collector: make -C pi-collector deploy PI_HOST=<pi-ip>"
	@echo "  - Pi Streamer: make -C pi-streamer deploy PI_HOST=<pi-ip>"

# Individual project builds
dashboard:
	@$(MAKE) -C dashboard-next build

mobile:
	@$(MAKE) -C mobile-app build

pi-collector:
	@$(MAKE) -C pi-collector build

pi-streamer:
	@$(MAKE) -C pi-streamer build

lambda:
	@$(MAKE) -C lambda build

web:
	@$(MAKE) -C web-dashboard build

infra:
	@$(MAKE) -C terraform init

# Individual deployments
deploy-dashboard:
	@$(MAKE) -C dashboard-next deploy

deploy-mobile:
	@$(MAKE) -C mobile-app deploy

deploy-lambda:
	@$(MAKE) -C lambda deploy

deploy-web:
	@$(MAKE) -C web-dashboard deploy

deploy-infra:
	@$(MAKE) -C terraform apply

# Git status
status:
	@git status

# Development shortcuts
dev-dashboard:
	@$(MAKE) -C dashboard-next dev

dev-mobile:
	@$(MAKE) -C mobile-app dev
