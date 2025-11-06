# Lambda Functions - Makefile
# Build and deployment for AWS Lambda functions

.PHONY: help install build test clean deploy deploy-all package lint

# Configuration
PYTHON := python3
FUNCTIONS := api-handler preprocessor ai-analyzer alert-worker
PACKAGE_DIR := packages

# Default target
help:
	@echo "Lambda Functions - Build & Deployment"
	@echo "======================================"
	@echo ""
	@echo "Build:"
	@echo "  make install     - Install dependencies for all functions"
	@echo "  make build       - Build all Lambda packages"
	@echo "  make package     - Create deployment packages"
	@echo ""
	@echo "Individual Builds:"
	@echo "  make build-api-handler    - Build API handler"
	@echo "  make build-preprocessor   - Build preprocessor"
	@echo "  make build-ai-analyzer    - Build AI analyzer"
	@echo "  make build-alert-worker   - Build alert worker"
	@echo ""
	@echo "Deployment:"
	@echo "  make deploy-all           - Deploy all functions"
	@echo "  make deploy-api           - Deploy API handler"
	@echo "  make deploy-preprocessor  - Deploy preprocessor"
	@echo "  make deploy-ai            - Deploy AI analyzer"
	@echo "  make deploy-alerts        - Deploy alert worker"
	@echo ""
	@echo "Testing:"
	@echo "  make test                 - Run tests for all functions"
	@echo "  make lint                 - Run linting"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean                - Remove build artifacts"
	@echo ""

# Install dependencies for all functions
install:
	@echo "Installing dependencies for all Lambda functions..."
	@for func in $(FUNCTIONS); do \
		echo "Installing $$func..."; \
		if [ -f "$$func/requirements.txt" ]; then \
			pip install -r "$$func/requirements.txt" -t "$$func/package/"; \
		fi; \
	done
	@echo "✓ All dependencies installed"

# Build all Lambda packages
build:
	@echo "Building all Lambda packages..."
	@mkdir -p $(PACKAGE_DIR)
	@$(MAKE) build-api-handler
	@$(MAKE) build-preprocessor
	@$(MAKE) build-ai-analyzer
	@$(MAKE) build-alert-worker
	@echo "✓ All Lambda packages built"

# Build individual functions
build-api-handler:
	@echo "Building api-handler..."
	@mkdir -p $(PACKAGE_DIR)
	@cd api-handler && \
		if [ -f "requirements.txt" ] && [ -s "requirements.txt" ]; then \
			pip install -r requirements.txt -t package/ --upgrade; \
			cp handler.py package/; \
			cd package && zip -r ../../$(PACKAGE_DIR)/api-handler.zip . -q; \
		else \
			mkdir -p package; \
			cp handler.py package/; \
			cd package && zip -r ../../$(PACKAGE_DIR)/api-handler.zip . -q; \
		fi
	@echo "✓ api-handler built"

build-preprocessor:
	@echo "Building preprocessor..."
	@mkdir -p $(PACKAGE_DIR)
	@cd preprocessor && \
		if [ -f "requirements.txt" ] && [ -s "requirements.txt" ]; then \
			pip install -r requirements.txt -t package/ --upgrade; \
			cp handler.py package/; \
			cd package && zip -r ../../$(PACKAGE_DIR)/preprocessor.zip . -q; \
		else \
			mkdir -p package; \
			cp handler.py package/; \
			cd package && zip -r ../../$(PACKAGE_DIR)/preprocessor.zip . -q; \
		fi
	@echo "✓ preprocessor built"

build-ai-analyzer:
	@echo "Building ai-analyzer..."
	@mkdir -p $(PACKAGE_DIR)
	@cd ai-analyzer && \
		if [ -f "requirements.txt" ] && [ -s "requirements.txt" ]; then \
			pip install -r requirements.txt -t package/ --upgrade; \
			cp handler.py package/; \
			cd package && zip -r ../../$(PACKAGE_DIR)/ai-analyzer.zip . -q; \
		else \
			mkdir -p package; \
			cp handler.py package/; \
			cd package && zip -r ../../$(PACKAGE_DIR)/ai-analyzer.zip . -q; \
		fi
	@echo "✓ ai-analyzer built"

build-alert-worker:
	@echo "Building alert-worker..."
	@mkdir -p $(PACKAGE_DIR)
	@cd alert-worker && \
		if [ -f "requirements.txt" ] && [ -s "requirements.txt" ]; then \
			pip install -r requirements.txt -t package/ --upgrade; \
			cp handler.py package/; \
			cd package && zip -r ../../$(PACKAGE_DIR)/alert-worker.zip . -q; \
		else \
			mkdir -p package; \
			cp handler.py package/; \
			cd package && zip -r ../../$(PACKAGE_DIR)/alert-worker.zip . -q; \
		fi
	@echo "✓ alert-worker built"

# Package (alias for build)
package: build

# Run tests
test:
	@echo "Running tests for Lambda functions..."
	@for func in $(FUNCTIONS); do \
		echo "Testing $$func..."; \
		if [ -d "$$func/tests" ]; then \
			cd "$$func" && python -m pytest tests/ -v && cd ..; \
		else \
			echo "No tests found for $$func"; \
		fi; \
	done
	@echo "✓ Tests complete"

# Lint code
lint:
	@echo "Running linting on Lambda functions..."
	@for func in $(FUNCTIONS); do \
		echo "Linting $$func..."; \
		if command -v pylint > /dev/null; then \
			pylint "$$func/handler.py" || true; \
		elif command -v flake8 > /dev/null; then \
			flake8 "$$func/handler.py" || true; \
		fi; \
	done
	@echo "✓ Linting complete"

# Clean build artifacts
clean:
	@echo "Cleaning Lambda build artifacts..."
	@rm -rf $(PACKAGE_DIR)
	@for func in $(FUNCTIONS); do \
		rm -rf "$$func/package"; \
		rm -rf "$$func/__pycache__"; \
		rm -f "$$func/deployment.zip"; \
	done
	@echo "✓ Clean complete"

# Deploy all functions
deploy-all: build
	@echo "Deploying all Lambda functions..."
	@$(MAKE) deploy-api
	@$(MAKE) deploy-preprocessor
	@$(MAKE) deploy-ai
	@$(MAKE) deploy-alerts
	@echo "✓ All functions deployed"

# Deploy individual functions
deploy-api: build-api-handler
	@echo "Deploying api-handler..."
	@if [ -f "$(PACKAGE_DIR)/api-handler.zip" ]; then \
		aws lambda update-function-code \
			--function-name ecg-api-handler \
			--zip-file fileb://$(PACKAGE_DIR)/api-handler.zip \
			--no-cli-pager; \
		echo "✓ api-handler deployed"; \
	else \
		echo "Error: Package not found. Run 'make build-api-handler' first"; \
		exit 1; \
	fi

deploy-preprocessor: build-preprocessor
	@echo "Deploying preprocessor..."
	@if [ -f "$(PACKAGE_DIR)/preprocessor.zip" ]; then \
		aws lambda update-function-code \
			--function-name ecg-preprocessor \
			--zip-file fileb://$(PACKAGE_DIR)/preprocessor.zip \
			--no-cli-pager; \
		echo "✓ preprocessor deployed"; \
	else \
		echo "Error: Package not found. Run 'make build-preprocessor' first"; \
		exit 1; \
	fi

deploy-ai: build-ai-analyzer
	@echo "Deploying ai-analyzer..."
	@if [ -f "$(PACKAGE_DIR)/ai-analyzer.zip" ]; then \
		aws lambda update-function-code \
			--function-name ecg-ai-analyzer \
			--zip-file fileb://$(PACKAGE_DIR)/ai-analyzer.zip \
			--no-cli-pager; \
		echo "✓ ai-analyzer deployed"; \
	else \
		echo "Error: Package not found. Run 'make build-ai-analyzer' first"; \
		exit 1; \
	fi

deploy-alerts: build-alert-worker
	@echo "Deploying alert-worker..."
	@if [ -f "$(PACKAGE_DIR)/alert-worker.zip" ]; then \
		aws lambda update-function-code \
			--function-name ecg-alert-worker \
			--zip-file fileb://$(PACKAGE_DIR)/alert-worker.zip \
			--no-cli-pager; \
		echo "✓ alert-worker deployed"; \
	else \
		echo "Error: Package not found. Run 'make build-alert-worker' first"; \
		exit 1; \
	fi

# Deploy using Terraform (if configured)
deploy: build
	@echo "Deploying via Terraform..."
	@cd ../terraform && terraform apply -target=aws_lambda_function -auto-approve
	@echo "✓ Deployed via Terraform"

# List package sizes
sizes:
	@echo "Lambda package sizes:"
	@ls -lh $(PACKAGE_DIR)/*.zip 2>/dev/null || echo "No packages built yet"

# Validate packages
validate:
	@echo "Validating Lambda packages..."
	@for func in $(FUNCTIONS); do \
		if [ -f "$(PACKAGE_DIR)/$$func.zip" ]; then \
			size=$$(stat -f%z "$(PACKAGE_DIR)/$$func.zip" 2>/dev/null || stat -c%s "$(PACKAGE_DIR)/$$func.zip" 2>/dev/null); \
			echo "$$func: $$size bytes"; \
			if [ $$size -gt 52428800 ]; then \
				echo "  ⚠️  Warning: Package exceeds 50MB Lambda limit"; \
			fi; \
		fi; \
	done
	@echo "✓ Validation complete"

# Test locally with SAM
sam-local:
	@echo "Starting SAM local API..."
	@if command -v sam > /dev/null; then \
		sam local start-api; \
	else \
		echo "AWS SAM CLI not found. Install from: https://aws.amazon.com/serverless/sam/"; \
	fi

# Invoke function locally
invoke-local:
	@echo "Invoking Lambda function locally..."
	@echo '{"test": "data"}' | aws lambda invoke --function-name ecg-api-handler --payload file:///dev/stdin /tmp/output.json
	@cat /tmp/output.json
	@rm /tmp/output.json
