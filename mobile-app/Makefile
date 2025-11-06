# ECG Monitor Mobile App - Makefile
# Build and deployment for Expo/React Native mobile app

.PHONY: help install dev build clean test deploy ios android web

# Default target
help:
	@echo "ECG Monitor Mobile App - Build & Deployment"
	@echo "==========================================="
	@echo ""
	@echo "Development:"
	@echo "  make install    - Install dependencies"
	@echo "  make dev        - Start Expo development server"
	@echo "  make ios        - Start iOS simulator"
	@echo "  make android    - Start Android emulator"
	@echo "  make web        - Start web version"
	@echo ""
	@echo "Build:"
	@echo "  make build           - Build for all platforms"
	@echo "  make build-ios       - Build iOS app"
	@echo "  make build-android   - Build Android APK"
	@echo "  make build-aab       - Build Android App Bundle"
	@echo ""
	@echo "Quality:"
	@echo "  make lint            - Run ESLint"
	@echo "  make type-check      - Run TypeScript type checking"
	@echo "  make test            - Run tests"
	@echo ""
	@echo "Deployment:"
	@echo "  make deploy          - Build production versions"
	@echo "  make publish         - Publish to Expo"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean           - Remove build artifacts"
	@echo "  make prebuild        - Generate native projects"
	@echo ""

# Install dependencies
install:
	@echo "Installing npm dependencies..."
	npm install
	@echo "✓ Dependencies installed"

# Development server
dev:
	@echo "Starting Expo development server..."
	npm start

# Platform-specific development
ios:
	@echo "Starting iOS development..."
	npm run ios

android:
	@echo "Starting Android development..."
	npm run android

web:
	@echo "Starting web development..."
	npm run web

# Linting
lint:
	@echo "Running ESLint..."
	npm run lint
	@echo "✓ Linting complete"

# Type checking
type-check:
	@echo "Running TypeScript type checking..."
	npm run type-check
	@echo "✓ Type checking complete"

# Tests
test:
	@echo "Running tests..."
	@if grep -q '"test"' package.json; then \
		npm test; \
	else \
		echo "No tests configured"; \
	fi

# Build production apps
build: build-ios build-android
	@echo "✓ All platform builds complete"

# iOS build
build-ios:
	@echo "Building iOS app..."
	@if command -v eas > /dev/null; then \
		eas build --platform ios --profile production; \
	else \
		echo "EAS CLI not found. Install with: npm install -g eas-cli"; \
		echo "Alternatively, use: npx expo build:ios"; \
	fi

# Android APK build
build-android:
	@echo "Building Android APK..."
	@if command -v eas > /dev/null; then \
		eas build --platform android --profile production; \
	else \
		echo "EAS CLI not found. Install with: npm install -g eas-cli"; \
		echo "Alternatively, use: npx expo build:android"; \
	fi

# Android App Bundle
build-aab:
	@echo "Building Android App Bundle..."
	@if command -v eas > /dev/null; then \
		eas build --platform android --profile production --local; \
	else \
		echo "EAS CLI not found. Install with: npm install -g eas-cli"; \
	fi

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf node_modules/.cache
	rm -rf .expo
	rm -rf dist
	@if [ -d "android" ]; then \
		cd android && ./gradlew clean 2>/dev/null || true; \
	fi
	@if [ -d "ios" ]; then \
		rm -rf ios/build; \
	fi
	@echo "✓ Clean complete"

# Generate native projects (for bare workflow)
prebuild:
	@echo "Generating native projects..."
	npx expo prebuild
	@echo "✓ Prebuild complete"

# Publish to Expo
publish:
	@echo "Publishing to Expo..."
	@if command -v eas > /dev/null; then \
		eas update --branch production --message "$(shell date +%Y-%m-%d)"; \
	else \
		echo "EAS CLI not found. Install with: npm install -g eas-cli"; \
	fi

# Deploy (build production versions)
deploy: type-check lint
	@echo "Building production versions..."
	@$(MAKE) build
	@echo "✓ Production builds ready"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Test the builds on physical devices"
	@echo "  2. Submit to App Store: eas submit --platform ios"
	@echo "  3. Submit to Play Store: eas submit --platform android"

# Development helpers
doctor:
	@echo "Running Expo doctor..."
	npx expo-doctor

start-tunnel:
	@echo "Starting Expo with tunnel..."
	npm start -- --tunnel

clear-cache:
	@echo "Clearing Expo cache..."
	npx expo start -c
