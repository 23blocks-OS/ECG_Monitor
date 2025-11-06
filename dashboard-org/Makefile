# Dashboard Next.js - Makefile
# Build and deployment for Next.js ECG dashboard

.PHONY: help install dev build start lint clean test deploy

# Configuration
NODE_ENV ?= production
S3_BUCKET ?= ecg-dashboard-static
CLOUDFRONT_ID ?=

# Default target
help:
	@echo "Dashboard Next.js - Build & Deployment"
	@echo "======================================"
	@echo ""
	@echo "Development:"
	@echo "  make install    - Install dependencies"
	@echo "  make dev        - Start development server"
	@echo "  make lint       - Run ESLint"
	@echo ""
	@echo "Build:"
	@echo "  make build      - Build for production"
	@echo "  make start      - Start production server"
	@echo ""
	@echo "Deployment:"
	@echo "  make deploy     - Deploy to AWS (S3 + CloudFront)"
	@echo "  make deploy-s3  - Deploy static files to S3"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean      - Remove build artifacts"
	@echo "  make test       - Run tests (if configured)"
	@echo ""

# Install dependencies
install:
	@echo "Installing npm dependencies..."
	npm install
	@echo "✓ Dependencies installed"

# Development server
dev:
	@echo "Starting development server..."
	npm run dev

# Build for production
build:
	@echo "Building Next.js application..."
	npm run build
	@echo "✓ Build complete"

# Start production server
start:
	@echo "Starting production server..."
	npm run start

# Run linter
lint:
	@echo "Running ESLint..."
	npm run lint
	@echo "✓ Linting complete"

# Run tests
test:
	@echo "Running tests..."
	@if grep -q '"test"' package.json; then \
		npm test; \
	else \
		echo "No tests configured"; \
	fi

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf .next
	rm -rf out
	rm -rf node_modules/.cache
	@echo "✓ Clean complete"

# Deploy to S3 (static export)
deploy-s3: build
	@echo "Exporting static site..."
	npm run build
	@if [ -z "$(S3_BUCKET)" ]; then \
		echo "Error: S3_BUCKET not set"; \
		exit 1; \
	fi
	@echo "Deploying to S3 bucket: $(S3_BUCKET)"
	aws s3 sync out/ s3://$(S3_BUCKET)/ --delete
	@echo "✓ Deployed to S3"

# Deploy with CloudFront invalidation
deploy: deploy-s3
	@if [ -n "$(CLOUDFRONT_ID)" ]; then \
		echo "Invalidating CloudFront cache..."; \
		aws cloudfront create-invalidation --distribution-id $(CLOUDFRONT_ID) --paths "/*"; \
		echo "✓ CloudFront cache invalidated"; \
	else \
		echo "Note: CLOUDFRONT_ID not set, skipping cache invalidation"; \
	fi
	@echo "✓ Deployment complete"

# Docker build (optional)
docker-build:
	@echo "Building Docker image..."
	docker build -t ecg-dashboard:latest .
	@echo "✓ Docker image built"

# Docker run
docker-run:
	@echo "Running Docker container..."
	docker run -p 3000:3000 ecg-dashboard:latest

# Check for updates
check-updates:
	@echo "Checking for dependency updates..."
	npm outdated
