# Pi Streamer - Makefile
# Build and deployment for Raspberry Pi data streaming service

.PHONY: help install dev run test clean deploy setup-pi lint

# Configuration
PYTHON := python3
PIP := $(PYTHON) -m pip
VENV := venv
PI_HOST ?=
PI_USER ?= pi
DEPLOY_PATH ?= /home/pi/ecg-streamer

# Default target
help:
	@echo "Pi Streamer - Build & Deployment"
	@echo "================================="
	@echo ""
	@echo "Development:"
	@echo "  make install      - Install Python dependencies"
	@echo "  make dev          - Run in development mode"
	@echo "  make run          - Run the streamer"
	@echo "  make run-multi    - Run multi-transport version"
	@echo "  make lint         - Run linting"
	@echo ""
	@echo "Testing:"
	@echo "  make test         - Run tests"
	@echo "  make test-wifi    - Test WiFi connection"
	@echo "  make test-bt      - Test Bluetooth connection"
	@echo ""
	@echo "Deployment:"
	@echo "  make deploy PI_HOST=<ip>  - Deploy to Raspberry Pi"
	@echo "  make setup-pi PI_HOST=<ip> - Initial Pi setup"
	@echo "  make start-service         - Start systemd service"
	@echo "  make stop-service          - Stop systemd service"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean        - Remove build artifacts"
	@echo "  make venv         - Create virtual environment"
	@echo "  make setup-certs  - Setup AWS IoT certificates"
	@echo ""

# Create virtual environment
venv:
	@echo "Creating virtual environment..."
	$(PYTHON) -m venv $(VENV)
	@echo "✓ Virtual environment created"
	@echo "Activate with: source $(VENV)/bin/activate"

# Install dependencies
install:
	@echo "Installing Python dependencies..."
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt
	@echo "✓ Dependencies installed"

# Install with venv
install-venv: venv
	@echo "Installing dependencies in virtual environment..."
	./$(VENV)/bin/pip install --upgrade pip
	./$(VENV)/bin/pip install -r requirements.txt
	@echo "✓ Dependencies installed in venv"

# Run in development mode
dev:
	@echo "Running in development mode..."
	$(PYTHON) main.py --debug

# Run the streamer
run:
	@echo "Starting ECG streamer..."
	$(PYTHON) main.py

# Run multi-transport version
run-multi:
	@echo "Starting multi-transport streamer..."
	$(PYTHON) multi_transport_main.py

# Run with config
run-with-config:
	@echo "Starting ECG streamer with config..."
	$(PYTHON) main.py --config config/config.yaml

# Run tests
test:
	@echo "Running tests..."
	@if [ -d "tests" ]; then \
		$(PYTHON) -m pytest tests/ -v; \
	else \
		echo "No tests directory found"; \
	fi

# Test WiFi connection
test-wifi:
	@echo "Testing WiFi connection to AWS IoT..."
	$(PYTHON) -c "from iot_client import IoTClient; client = IoTClient(); client.test_connection()"

# Test Bluetooth
test-bt:
	@echo "Testing Bluetooth setup..."
	$(PYTHON) -c "from transport_bluetooth import BluetoothTransport; bt = BluetoothTransport(); bt.test()"

# Lint code
lint:
	@echo "Running linting..."
	@if command -v pylint > /dev/null; then \
		pylint *.py; \
	elif command -v flake8 > /dev/null; then \
		flake8 *.py; \
	else \
		echo "No linter found. Install with: pip install pylint"; \
	fi

# Build (prepare for deployment)
build:
	@echo "Building deployment package..."
	@mkdir -p dist
	@cp *.py dist/
	@cp requirements.txt dist/
	@if [ -d "config" ]; then cp -r config dist/; fi
	@if [ -d "certs" ]; then \
		echo "Note: Certificate directory found. Copy certs manually for security."; \
	fi
	@echo "✓ Build complete - package in dist/"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf dist
	rm -rf $(VENV)
	rm -rf __pycache__
	rm -rf *.pyc
	rm -rf .pytest_cache
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@echo "✓ Clean complete"

# Deploy to Raspberry Pi
deploy:
	@if [ -z "$(PI_HOST)" ]; then \
		echo "Error: PI_HOST not set"; \
		echo "Usage: make deploy PI_HOST=192.168.1.100"; \
		exit 1; \
	fi
	@echo "Deploying to Pi at $(PI_HOST)..."
	@echo "Creating deployment directory..."
	ssh $(PI_USER)@$(PI_HOST) "mkdir -p $(DEPLOY_PATH)"
	@echo "Copying files..."
	scp -r *.py requirements.txt $(PI_USER)@$(PI_HOST):$(DEPLOY_PATH)/
	@if [ -d "config" ]; then \
		scp -r config $(PI_USER)@$(PI_HOST):$(DEPLOY_PATH)/; \
	fi
	@echo ""
	@echo "⚠️  Don't forget to copy AWS IoT certificates!"
	@echo "    scp -r certs $(PI_USER)@$(PI_HOST):$(DEPLOY_PATH)/"
	@echo ""
	@echo "Installing dependencies on Pi..."
	ssh $(PI_USER)@$(PI_HOST) "cd $(DEPLOY_PATH) && python3 -m pip install -r requirements.txt"
	@echo "✓ Deployment complete"

# Copy certificates to Pi
deploy-certs:
	@if [ -z "$(PI_HOST)" ]; then \
		echo "Error: PI_HOST not set"; \
		exit 1; \
	fi
	@if [ ! -d "certs" ]; then \
		echo "Error: certs directory not found"; \
		exit 1; \
	fi
	@echo "Copying certificates to Pi..."
	ssh $(PI_USER)@$(PI_HOST) "mkdir -p $(DEPLOY_PATH)/certs"
	scp -r certs/* $(PI_USER)@$(PI_HOST):$(DEPLOY_PATH)/certs/
	ssh $(PI_USER)@$(PI_HOST) "chmod 600 $(DEPLOY_PATH)/certs/*"
	@echo "✓ Certificates deployed"

# Initial Pi setup
setup-pi:
	@if [ -z "$(PI_HOST)" ]; then \
		echo "Error: PI_HOST not set"; \
		exit 1; \
	fi
	@echo "Setting up Raspberry Pi at $(PI_HOST)..."
	@echo "Installing system dependencies..."
	ssh $(PI_USER)@$(PI_HOST) "sudo apt-get update && sudo apt-get install -y python3-pip python3-venv bluetooth bluez libbluetooth-dev"
	@$(MAKE) deploy PI_HOST=$(PI_HOST)
	@echo ""
	@echo "⚠️  Next steps:"
	@echo "  1. Copy AWS IoT certificates: make deploy-certs PI_HOST=$(PI_HOST)"
	@echo "  2. Configure Bluetooth if needed"
	@echo "  3. Install service: make install-service PI_HOST=$(PI_HOST)"
	@echo ""

# Create systemd service
install-service:
	@if [ -z "$(PI_HOST)" ]; then \
		echo "Error: PI_HOST not set"; \
		exit 1; \
	fi
	@echo "Installing systemd service..."
	@echo "[Unit]" > /tmp/ecg-streamer.service
	@echo "Description=ECG Data Streamer" >> /tmp/ecg-streamer.service
	@echo "After=network.target bluetooth.target" >> /tmp/ecg-streamer.service
	@echo "" >> /tmp/ecg-streamer.service
	@echo "[Service]" >> /tmp/ecg-streamer.service
	@echo "Type=simple" >> /tmp/ecg-streamer.service
	@echo "User=$(PI_USER)" >> /tmp/ecg-streamer.service
	@echo "WorkingDirectory=$(DEPLOY_PATH)" >> /tmp/ecg-streamer.service
	@echo "ExecStart=/usr/bin/python3 $(DEPLOY_PATH)/multi_transport_main.py" >> /tmp/ecg-streamer.service
	@echo "Restart=always" >> /tmp/ecg-streamer.service
	@echo "RestartSec=10" >> /tmp/ecg-streamer.service
	@echo "" >> /tmp/ecg-streamer.service
	@echo "[Install]" >> /tmp/ecg-streamer.service
	@echo "WantedBy=multi-user.target" >> /tmp/ecg-streamer.service
	scp /tmp/ecg-streamer.service $(PI_USER)@$(PI_HOST):/tmp/
	ssh $(PI_USER)@$(PI_HOST) "sudo mv /tmp/ecg-streamer.service /etc/systemd/system/ && sudo systemctl daemon-reload"
	@echo "✓ Service installed"

# Start service on Pi
start-service:
	@if [ -z "$(PI_HOST)" ]; then \
		echo "Error: PI_HOST not set"; \
		exit 1; \
	fi
	@echo "Starting service on Pi..."
	ssh $(PI_USER)@$(PI_HOST) "sudo systemctl start ecg-streamer && sudo systemctl enable ecg-streamer"
	@echo "✓ Service started and enabled"

# Stop service on Pi
stop-service:
	@if [ -z "$(PI_HOST)" ]; then \
		echo "Error: PI_HOST not set"; \
		exit 1; \
	fi
	@echo "Stopping service on Pi..."
	ssh $(PI_USER)@$(PI_HOST) "sudo systemctl stop ecg-streamer"
	@echo "✓ Service stopped"

# Restart service
restart-service:
	@if [ -z "$(PI_HOST)" ]; then \
		echo "Error: PI_HOST not set"; \
		exit 1; \
	fi
	@echo "Restarting service on Pi..."
	ssh $(PI_USER)@$(PI_HOST) "sudo systemctl restart ecg-streamer"
	@echo "✓ Service restarted"

# View service logs
logs:
	@if [ -z "$(PI_HOST)" ]; then \
		echo "Error: PI_HOST not set"; \
		exit 1; \
	fi
	ssh $(PI_USER)@$(PI_HOST) "sudo journalctl -u ecg-streamer -f"

# Check service status
status:
	@if [ -z "$(PI_HOST)" ]; then \
		echo "Error: PI_HOST not set"; \
		exit 1; \
	fi
	ssh $(PI_USER)@$(PI_HOST) "sudo systemctl status ecg-streamer"

# SSH into Pi
ssh:
	@if [ -z "$(PI_HOST)" ]; then \
		echo "Error: PI_HOST not set"; \
		exit 1; \
	fi
	ssh $(PI_USER)@$(PI_HOST)

# Setup AWS IoT certificates
setup-certs:
	@echo "Setting up AWS IoT certificates..."
	@mkdir -p certs
	@echo ""
	@echo "Download your AWS IoT certificates and place them in the certs/ directory:"
	@echo "  - certs/certificate.pem.crt"
	@echo "  - certs/private.pem.key"
	@echo "  - certs/AmazonRootCA1.pem"
	@echo ""
	@echo "Then run: make deploy-certs PI_HOST=<your-pi-ip>"
