# Pi Collector - Makefile
# Build and deployment for Raspberry Pi ECG data collector

.PHONY: help install dev run test clean deploy setup-pi lint

# Configuration
PYTHON := python3
PIP := $(PYTHON) -m pip
VENV := venv
PI_HOST ?=
PI_USER ?= pi
DEPLOY_PATH ?= /home/pi/ecg-collector

# Default target
help:
	@echo "Pi Collector - Build & Deployment"
	@echo "=================================="
	@echo ""
	@echo "Development:"
	@echo "  make install      - Install Python dependencies"
	@echo "  make dev          - Run in development mode"
	@echo "  make run          - Run the collector"
	@echo "  make lint         - Run linting"
	@echo ""
	@echo "Testing:"
	@echo "  make test         - Run tests"
	@echo "  make test-hw      - Test hardware connections"
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

# Run the collector
run:
	@echo "Starting ECG collector..."
	$(PYTHON) main.py

# Run with config
run-with-config:
	@echo "Starting ECG collector with config..."
	$(PYTHON) main.py --config config/config.yaml

# Run tests
test:
	@echo "Running tests..."
	@if [ -d "tests" ]; then \
		$(PYTHON) -m pytest tests/ -v; \
	else \
		echo "No tests directory found"; \
	fi

# Test hardware
test-hw:
	@echo "Testing hardware connections..."
	$(PYTHON) -c "import ecg_reader; ecg_reader.test_hardware()"

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
	@if [ -f "config/config.yaml" ]; then cp -r config dist/; fi
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
	@if [ -f "setup_pi.sh" ]; then \
		scp setup_pi.sh $(PI_USER)@$(PI_HOST):$(DEPLOY_PATH)/; \
	fi
	@echo "Installing dependencies on Pi..."
	ssh $(PI_USER)@$(PI_HOST) "cd $(DEPLOY_PATH) && python3 -m pip install -r requirements.txt"
	@echo "✓ Deployment complete"

# Initial Pi setup
setup-pi:
	@if [ -z "$(PI_HOST)" ]; then \
		echo "Error: PI_HOST not set"; \
		exit 1; \
	fi
	@echo "Setting up Raspberry Pi at $(PI_HOST)..."
	@if [ -f "setup_pi.sh" ]; then \
		scp setup_pi.sh $(PI_USER)@$(PI_HOST):/tmp/; \
		ssh $(PI_USER)@$(PI_HOST) "chmod +x /tmp/setup_pi.sh && /tmp/setup_pi.sh"; \
	else \
		ssh $(PI_USER)@$(PI_HOST) "sudo apt-get update && sudo apt-get install -y python3-pip python3-venv"; \
	fi
	@$(MAKE) deploy PI_HOST=$(PI_HOST)
	@echo "✓ Pi setup complete"

# Create systemd service
install-service:
	@if [ -z "$(PI_HOST)" ]; then \
		echo "Error: PI_HOST not set"; \
		exit 1; \
	fi
	@echo "Installing systemd service..."
	@echo "[Unit]" > /tmp/ecg-collector.service
	@echo "Description=ECG Data Collector" >> /tmp/ecg-collector.service
	@echo "After=network.target" >> /tmp/ecg-collector.service
	@echo "" >> /tmp/ecg-collector.service
	@echo "[Service]" >> /tmp/ecg-collector.service
	@echo "Type=simple" >> /tmp/ecg-collector.service
	@echo "User=$(PI_USER)" >> /tmp/ecg-collector.service
	@echo "WorkingDirectory=$(DEPLOY_PATH)" >> /tmp/ecg-collector.service
	@echo "ExecStart=/usr/bin/python3 $(DEPLOY_PATH)/main.py" >> /tmp/ecg-collector.service
	@echo "Restart=always" >> /tmp/ecg-collector.service
	@echo "" >> /tmp/ecg-collector.service
	@echo "[Install]" >> /tmp/ecg-collector.service
	@echo "WantedBy=multi-user.target" >> /tmp/ecg-collector.service
	scp /tmp/ecg-collector.service $(PI_USER)@$(PI_HOST):/tmp/
	ssh $(PI_USER)@$(PI_HOST) "sudo mv /tmp/ecg-collector.service /etc/systemd/system/ && sudo systemctl daemon-reload"
	@echo "✓ Service installed"

# Start service on Pi
start-service:
	@if [ -z "$(PI_HOST)" ]; then \
		echo "Error: PI_HOST not set"; \
		exit 1; \
	fi
	@echo "Starting service on Pi..."
	ssh $(PI_USER)@$(PI_HOST) "sudo systemctl start ecg-collector && sudo systemctl enable ecg-collector"
	@echo "✓ Service started and enabled"

# Stop service on Pi
stop-service:
	@if [ -z "$(PI_HOST)" ]; then \
		echo "Error: PI_HOST not set"; \
		exit 1; \
	fi
	@echo "Stopping service on Pi..."
	ssh $(PI_USER)@$(PI_HOST) "sudo systemctl stop ecg-collector"
	@echo "✓ Service stopped"

# View service logs
logs:
	@if [ -z "$(PI_HOST)" ]; then \
		echo "Error: PI_HOST not set"; \
		exit 1; \
	fi
	ssh $(PI_USER)@$(PI_HOST) "sudo journalctl -u ecg-collector -f"

# SSH into Pi
ssh:
	@if [ -z "$(PI_HOST)" ]; then \
		echo "Error: PI_HOST not set"; \
		exit 1; \
	fi
	ssh $(PI_USER)@$(PI_HOST)
