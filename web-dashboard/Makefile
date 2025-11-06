# Web Dashboard - Makefile
# Build and deployment for static HTML/CSS/JS dashboard

.PHONY: help build serve deploy clean minify validate

# Configuration
S3_BUCKET ?= ecg-web-dashboard
CLOUDFRONT_ID ?=
DIST_DIR := dist

# Default target
help:
	@echo "Web Dashboard - Build & Deployment"
	@echo "==================================="
	@echo ""
	@echo "Development:"
	@echo "  make serve      - Start local development server"
	@echo "  make validate   - Validate HTML/CSS/JS"
	@echo ""
	@echo "Build:"
	@echo "  make build      - Prepare for deployment"
	@echo "  make minify     - Minify CSS/JS files"
	@echo ""
	@echo "Deployment:"
	@echo "  make deploy     - Deploy to S3 + CloudFront"
	@echo "  make deploy-s3  - Deploy to S3 only"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean      - Remove build artifacts"
	@echo ""

# Build (prepare files for deployment)
build:
	@echo "Building web dashboard..."
	@mkdir -p $(DIST_DIR)
	@cp -r *.html $(DIST_DIR)/ 2>/dev/null || true
	@cp -r css $(DIST_DIR)/ 2>/dev/null || true
	@cp -r js $(DIST_DIR)/ 2>/dev/null || true
	@cp -r assets $(DIST_DIR)/ 2>/dev/null || true
	@cp -r images $(DIST_DIR)/ 2>/dev/null || true
	@echo "✓ Build complete"

# Minify CSS and JS files
minify: build
	@echo "Minifying assets..."
	@if command -v terser > /dev/null; then \
		find $(DIST_DIR)/js -name "*.js" -not -name "*.min.js" -exec sh -c 'terser {} -o $${0%.js}.min.js' {} \;; \
		echo "✓ JavaScript minified"; \
	else \
		echo "Note: terser not found. Install with: npm install -g terser"; \
	fi
	@if command -v csso > /dev/null; then \
		find $(DIST_DIR)/css -name "*.css" -not -name "*.min.css" -exec sh -c 'csso {} -o $${0%.css}.min.css' {} \;; \
		echo "✓ CSS minified"; \
	else \
		echo "Note: csso not found. Install with: npm install -g csso-cli"; \
	fi

# Start local development server
serve:
	@echo "Starting local development server on http://localhost:8000"
	@if command -v python3 > /dev/null; then \
		python3 -m http.server 8000; \
	elif command -v python > /dev/null; then \
		python -m SimpleHTTPServer 8000; \
	else \
		echo "Error: Python not found"; \
		exit 1; \
	fi

# Validate HTML/CSS/JS
validate:
	@echo "Validating HTML/CSS/JS..."
	@if command -v htmlhint > /dev/null; then \
		htmlhint *.html; \
	else \
		echo "Note: htmlhint not found. Install with: npm install -g htmlhint"; \
	fi
	@if command -v stylelint > /dev/null; then \
		stylelint "css/*.css"; \
	else \
		echo "Note: stylelint not found. Install with: npm install -g stylelint"; \
	fi
	@if command -v eslint > /dev/null; then \
		eslint "js/*.js"; \
	else \
		echo "Note: eslint not found. Install with: npm install -g eslint"; \
	fi

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf $(DIST_DIR)
	@find . -name "*.min.js" -type f -delete
	@find . -name "*.min.css" -type f -delete
	@echo "✓ Clean complete"

# Deploy to S3
deploy-s3: build
	@if [ -z "$(S3_BUCKET)" ]; then \
		echo "Error: S3_BUCKET not set"; \
		exit 1; \
	fi
	@echo "Deploying to S3 bucket: $(S3_BUCKET)"
	@aws s3 sync $(DIST_DIR)/ s3://$(S3_BUCKET)/ \
		--delete \
		--cache-control "max-age=86400" \
		--exclude "*.html" \
		--exclude "*.xml"
	@aws s3 sync $(DIST_DIR)/ s3://$(S3_BUCKET)/ \
		--delete \
		--cache-control "no-cache" \
		--include "*.html" \
		--include "*.xml"
	@echo "✓ Deployed to S3"

# Deploy with CloudFront invalidation
deploy: deploy-s3
	@if [ -n "$(CLOUDFRONT_ID)" ]; then \
		echo "Invalidating CloudFront cache..."; \
		aws cloudfront create-invalidation \
			--distribution-id $(CLOUDFRONT_ID) \
			--paths "/*"; \
		echo "✓ CloudFront cache invalidated"; \
	else \
		echo "Note: CLOUDFRONT_ID not set, skipping cache invalidation"; \
	fi
	@echo "✓ Deployment complete"

# Set S3 bucket for website hosting
configure-s3:
	@if [ -z "$(S3_BUCKET)" ]; then \
		echo "Error: S3_BUCKET not set"; \
		exit 1; \
	fi
	@echo "Configuring S3 bucket for website hosting..."
	@aws s3 website s3://$(S3_BUCKET)/ \
		--index-document index.html \
		--error-document error.html
	@echo "✓ S3 bucket configured"

# Check file sizes
sizes:
	@echo "File sizes:"
	@du -sh * | sort -hr

# Compress assets
compress: build
	@echo "Compressing assets with gzip..."
	@find $(DIST_DIR) -type f \( -name "*.html" -o -name "*.css" -o -name "*.js" -o -name "*.json" \) -exec gzip -k {} \;
	@echo "✓ Assets compressed"

# Create zip archive for manual deployment
archive: build
	@echo "Creating deployment archive..."
	@cd $(DIST_DIR) && zip -r ../web-dashboard.zip . -q
	@echo "✓ Archive created: web-dashboard.zip"

# Test locally with Docker
docker-serve:
	@echo "Starting Docker container with nginx..."
	@docker run -it --rm -p 8080:80 \
		-v $(PWD):/usr/share/nginx/html:ro \
		nginx:alpine
	@echo "Server running at http://localhost:8080"
