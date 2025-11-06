# CI/CD Pipeline Implementation Plan

## Current State
**Status:** Manual deployment only
**Risk:** No automated testing, quality inconsistency, deployment errors
**Priority:** 🟡 **MEDIUM - Improves quality and velocity**

---

## Goals

### Continuous Integration
1. **Automated Testing**: Run tests on every commit
2. **Code Quality**: Lint, format check, security scanning
3. **Build Validation**: Ensure Lambda packages build successfully
4. **Documentation**: Validate markdown, check links

### Continuous Deployment
1. **Automated Deployments**: Deploy to dev/staging/prod environments
2. **Rollback Capability**: Quick revert if issues found
3. **Deployment Notifications**: Slack/email on deploy success/failure

---

## Implementation Plan

### Phase 1: GitHub Actions Setup (Week 1)

#### Step 1.1: Repository Secrets Configuration

**Add to GitHub Secrets** (Settings → Secrets → Actions):

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
ANTHROPIC_API_KEY (for testing)
SLACK_WEBHOOK_URL (optional, for notifications)
```

#### Step 1.2: Python Testing Workflow

**Create** `.github/workflows/python-tests.yml`:

```yaml
name: Python Tests

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'pi-collector/**'
      - 'pi-streamer/**'
      - 'lambda/**'
  pull_request:
    branches: [ main, develop ]

jobs:
  test-python:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        python-version: ['3.9', '3.10', '3.11']

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python ${{ matrix.python-version }}
        uses: actions/setup-python@v4
        with:
          python-version: ${{ matrix.python-version }}

      - name: Cache pip packages
        uses: actions/cache@v3
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}
          restore-keys: |
            ${{ runner.os }}-pip-

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install pytest pytest-cov flake8 black mypy
          pip install -r pi-collector/requirements.txt
          pip install -r pi-streamer/requirements.txt

      - name: Lint with flake8
        run: |
          # Stop build if syntax errors or undefined names
          flake8 pi-collector pi-streamer lambda --count --select=E9,F63,F7,F82 --show-source --statistics
          # Exit-zero treats all errors as warnings
          flake8 pi-collector pi-streamer lambda --count --exit-zero --max-complexity=10 --max-line-length=120 --statistics

      - name: Check code formatting with black
        run: |
          black --check pi-collector pi-streamer lambda

      - name: Type check with mypy
        run: |
          mypy pi-collector pi-streamer lambda --ignore-missing-imports
        continue-on-error: true  # Don't fail on type errors yet

      - name: Run unit tests
        run: |
          pytest tests/ -v --cov=. --cov-report=xml --cov-report=term

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.xml
          flags: unittests
          name: codecov-umbrella

  security-scan:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Run Bandit security scanner
        run: |
          pip install bandit
          bandit -r pi-collector pi-streamer lambda -f json -o bandit-report.json
        continue-on-error: true

      - name: Upload Bandit report
        uses: actions/upload-artifact@v3
        with:
          name: bandit-security-report
          path: bandit-report.json
```

#### Step 1.3: Frontend Testing Workflow

**Create** `.github/workflows/frontend-tests.yml`:

```yaml
name: Frontend Tests

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'dashboard-next/**'
      - 'dashboard-org/**'
      - 'mobile-app/**'
  pull_request:
    branches: [ main, develop ]

jobs:
  test-dashboards:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: ['18.x', '20.x']
        dashboard: ['dashboard-next', 'dashboard-org']

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
          cache-dependency-path: ${{ matrix.dashboard }}/package-lock.json

      - name: Install dependencies
        working-directory: ${{ matrix.dashboard }}
        run: npm ci

      - name: Lint
        working-directory: ${{ matrix.dashboard }}
        run: npm run lint

      - name: Type check
        working-directory: ${{ matrix.dashboard }}
        run: npm run type-check || npx tsc --noEmit
        continue-on-error: true

      - name: Run tests
        working-directory: ${{ matrix.dashboard }}
        run: npm test -- --coverage --watchAll=false
        continue-on-error: true  # Don't fail if no tests yet

      - name: Build
        working-directory: ${{ matrix.dashboard }}
        run: npm run build

  test-mobile:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.x'
          cache: 'npm'
          cache-dependency-path: mobile-app/package-lock.json

      - name: Install dependencies
        working-directory: mobile-app
        run: npm ci

      - name: Lint
        working-directory: mobile-app
        run: npm run lint || npx expo lint
        continue-on-error: true

      - name: Type check
        working-directory: mobile-app
        run: npm run type-check || npx tsc --noEmit
        continue-on-error: true
```

#### Step 1.4: Terraform Validation Workflow

**Create** `.github/workflows/terraform-validate.yml`:

```yaml
name: Terraform Validation

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'terraform/**'
  pull_request:
    branches: [ main, develop ]

jobs:
  validate:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        environment: ['poc', 'prod']

    steps:
      - uses: actions/checkout@v3

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: 1.5.0

      - name: Terraform Format Check
        working-directory: terraform/environments/${{ matrix.environment }}
        run: terraform fmt -check -recursive

      - name: Terraform Init
        working-directory: terraform/environments/${{ matrix.environment }}
        run: terraform init -backend=false

      - name: Terraform Validate
        working-directory: terraform/environments/${{ matrix.environment }}
        run: terraform validate

      - name: TFLint
        uses: terraform-linters/setup-tflint@v3
        with:
          tflint_version: latest

      - name: Run TFLint
        working-directory: terraform
        run: |
          tflint --init
          tflint --recursive

      - name: Checkov Security Scan
        uses: bridgecrewio/checkov-action@master
        with:
          directory: terraform/
          framework: terraform
          output_format: sarif
          soft_fail: true
```

### Phase 2: Automated Testing (Week 2)

#### Step 2.1: Add Unit Tests

**Create test structure:**
```
tests/
├── unit/
│   ├── test_ecg_reader.py
│   ├── test_signal_processor.py
│   ├── test_buffer_manager.py
│   ├── test_iot_publisher.py
│   └── test_lambda_handlers.py
├── integration/
│   ├── test_end_to_end.py
│   └── test_aws_services.py
└── conftest.py
```

**Example unit test** (`tests/unit/test_signal_processor.py`):

```python
import pytest
import numpy as np
from pi_collector.signal_processor import SignalProcessor

@pytest.fixture
def processor():
    return SignalProcessor(sampling_rate=250)

def test_bandpass_filter(processor):
    """Test bandpass filter reduces noise"""
    # Generate clean sine wave
    t = np.linspace(0, 1, 250)
    clean_signal = np.sin(2 * np.pi * 1.0 * t)  # 1 Hz

    # Add high-frequency noise
    noisy_signal = clean_signal + 0.5 * np.sin(2 * np.pi * 50 * t)  # 50 Hz noise

    # Apply filter
    filtered = processor.apply_bandpass_filter(noisy_signal)

    # Filtered signal should be closer to clean signal
    clean_error = np.mean((clean_signal - noisy_signal) ** 2)
    filtered_error = np.mean((clean_signal - filtered) ** 2)

    assert filtered_error < clean_error, "Filter should reduce noise"

def test_qrs_detection(processor):
    """Test QRS complex detection"""
    # Load test ECG data
    ecg_data = np.load('tests/fixtures/test_ecg_normal.npy')

    # Detect QRS complexes
    qrs_indices = processor.detect_qrs(ecg_data)

    # Should find approximately 60-100 BPM worth of beats
    # For 10 seconds of data at 70 BPM: ~12 beats
    expected_beats = 12
    assert len(qrs_indices) >= expected_beats * 0.8, "Should detect most QRS complexes"
    assert len(qrs_indices) <= expected_beats * 1.2, "Shouldn't over-detect"

def test_heart_rate_calculation(processor):
    """Test heart rate calculation"""
    # R-R intervals for 60 BPM (1000ms between beats)
    rr_intervals = [1000, 1000, 1000, 1000]

    hr = processor.calculate_heart_rate(rr_intervals)

    assert 58 <= hr <= 62, f"Expected ~60 BPM, got {hr}"

def test_signal_quality_assessment(processor):
    """Test signal quality scoring"""
    # High quality signal (low noise)
    good_signal = np.sin(2 * np.pi * 1.0 * np.linspace(0, 1, 250))
    good_quality = processor.assess_signal_quality(good_signal)

    # Low quality signal (high noise)
    bad_signal = np.random.randn(250)
    bad_quality = processor.assess_signal_quality(bad_signal)

    assert good_quality > 0.7, "Good signal should have high quality score"
    assert bad_quality < 0.5, "Noisy signal should have low quality score"
    assert good_quality > bad_quality, "Good signal should score higher"
```

**Example integration test** (`tests/integration/test_end_to_end.py`):

```python
import pytest
import boto3
import time
from datetime import datetime

@pytest.fixture
def dynamodb():
    return boto3.resource('dynamodb', endpoint_url='http://localhost:8000')  # LocalStack

@pytest.fixture
def s3():
    return boto3.client('s3', endpoint_url='http://localhost:4566')  # LocalStack

def test_data_collection_to_storage(dynamodb, s3):
    """Test complete data flow from collection to storage"""
    # This would use mock hardware or test data

    # 1. Simulate ECG data collection
    # 2. Buffer data
    # 3. Publish to IoT Core (mocked)
    # 4. Verify arrival in S3
    # 5. Verify DynamoDB session record

    # For now, test structure only
    pass

@pytest.mark.slow
def test_lambda_processing_pipeline():
    """Test Lambda functions process data correctly"""
    # This would invoke Lambdas with test data

    # 1. Upload test ECG data to S3
    # 2. Trigger preprocessor Lambda
    # 3. Verify metrics calculation
    # 4. Trigger AI analyzer Lambda (with mocked Claude API)
    # 5. Verify analysis results
    # 6. Trigger alert worker
    # 7. Verify email sent

    pass
```

#### Step 2.2: Add Pre-commit Hooks

**Create** `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
      - id: check-merge-conflict
      - id: check-json
      - id: pretty-format-json
        args: ['--autofix']

  - repo: https://github.com/psf/black
    rev: 23.3.0
    hooks:
      - id: black
        language_version: python3

  - repo: https://github.com/PyCQA/flake8
    rev: 6.0.0
    hooks:
      - id: flake8
        args: ['--max-line-length=120']

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.3.0
    hooks:
      - id: mypy
        additional_dependencies: [types-all]
        args: [--ignore-missing-imports]

  - repo: https://github.com/PyCQA/bandit
    rev: 1.7.5
    hooks:
      - id: bandit
        args: ['-c', '.bandit.yml']
        exclude: tests/
```

**Install:**
```bash
pip install pre-commit
pre-commit install
```

### Phase 3: Continuous Deployment (Week 3)

#### Step 3.1: Automated Deployment Workflow

**Create** `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches:
      - main  # Deploy to production
      - develop  # Deploy to staging
    tags:
      - 'v*'  # Deploy on version tags

  workflow_dispatch:  # Manual trigger
    inputs:
      environment:
        description: 'Environment to deploy to'
        required: true
        type: choice
        options:
          - poc
          - staging
          - prod

jobs:
  deploy-infrastructure:
    runs-on: ubuntu-latest

    env:
      AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
      AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      AWS_REGION: ${{ secrets.AWS_REGION }}

    steps:
      - uses: actions/checkout@v3

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: 1.5.0

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Build Lambda packages
        run: |
          cd lambda
          for func in preprocessor ai-analyzer alert-worker api-handler; do
            cd $func
            pip install -r requirements.txt -t .
            zip -r ../${func}.zip .
            cd ..
          done

      - name: Determine environment
        id: env
        run: |
          if [[ "${{ github.event_name }}" == "workflow_dispatch" ]]; then
            echo "environment=${{ github.event.inputs.environment }}" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            echo "environment=prod" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref }}" == "refs/heads/develop" ]]; then
            echo "environment=staging" >> $GITHUB_OUTPUT
          else
            echo "environment=poc" >> $GITHUB_OUTPUT
          fi

      - name: Terraform Init
        working-directory: terraform/environments/${{ steps.env.outputs.environment }}
        run: terraform init

      - name: Terraform Plan
        working-directory: terraform/environments/${{ steps.env.outputs.environment }}
        run: terraform plan -out=tfplan

      - name: Terraform Apply
        working-directory: terraform/environments/${{ steps.env.outputs.environment }}
        run: terraform apply -auto-approve tfplan

      - name: Save Terraform outputs
        working-directory: terraform/environments/${{ steps.env.outputs.environment }}
        run: |
          terraform output -json > outputs.json
          echo "API_URL=$(terraform output -raw api_gateway_url)" >> $GITHUB_ENV
          echo "USER_POOL_ID=$(terraform output -raw cognito_user_pool_id)" >> $GITHUB_ENV

      - name: Notify deployment
        if: always()
        run: |
          if [[ "${{ job.status }}" == "success" ]]; then
            echo "✅ Deployment to ${{ steps.env.outputs.environment }} successful!"
          else
            echo "❌ Deployment to ${{ steps.env.outputs.environment }} failed!"
          fi

  deploy-dashboards:
    runs-on: ubuntu-latest
    needs: deploy-infrastructure

    strategy:
      matrix:
        dashboard: ['dashboard-next', 'dashboard-org']

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.x'
          cache: 'npm'
          cache-dependency-path: ${{ matrix.dashboard }}/package-lock.json

      - name: Install Vercel CLI
        run: npm install -g vercel

      - name: Deploy to Vercel
        working-directory: ${{ matrix.dashboard }}
        run: |
          vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          NEXT_PUBLIC_API_URL: ${{ env.API_URL }}
          NEXT_PUBLIC_COGNITO_USER_POOL_ID: ${{ env.USER_POOL_ID }}
```

#### Step 3.2: Deployment Notifications

**Add Slack notification** (optional):

```yaml
      - name: Notify Slack
        if: always()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          payload: |
            {
              "text": "Deployment ${{ job.status }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Deployment Status*: ${{ job.status }}\n*Environment*: ${{ steps.env.outputs.environment }}\n*Branch*: ${{ github.ref_name }}\n*Commit*: <${{ github.event.head_commit.url }}|${{ github.sha }}>"
                  }
                }
              ]
            }
```

### Phase 4: Quality Gates (Week 3)

#### Step 4.1: Branch Protection Rules

**Configure in GitHub** (Settings → Branches):

```yaml
main:
  protection_rules:
    - require_pull_request_reviews: true
      required_approving_review_count: 1
    - require_status_checks_to_pass: true
      required_status_checks:
        - "Python Tests (3.11)"
        - "Frontend Tests (dashboard-next)"
        - "Terraform Validation (poc)"
    - require_linear_history: true
    - enforce_admins: false
    - restrictions: null
```

#### Step 4.2: Code Coverage Requirements

**Add to** `.github/workflows/python-tests.yml`:

```yaml
      - name: Check coverage threshold
        run: |
          coverage_pct=$(coverage report | grep TOTAL | awk '{print $4}' | sed 's/%//')
          if (( $(echo "$coverage_pct < 70" | bc -l) )); then
            echo "❌ Coverage is $coverage_pct%, minimum is 70%"
            exit 1
          fi
          echo "✅ Coverage is $coverage_pct%"
```

---

## Timeline & Effort

| Phase | Duration | Effort |
|-------|----------|--------|
| Phase 1: GitHub Actions Setup | 1 week | 16-24 hours |
| Phase 2: Automated Testing | 1 week | 20-30 hours |
| Phase 3: Continuous Deployment | 1 week | 16-24 hours |
| Phase 4: Quality Gates | 2-3 days | 8-12 hours |
| **Total** | **3-4 weeks** | **60-90 hours** |

---

## Cost Impact

**GitHub Actions:**
- 2,000 minutes/month free for public repos
- $0.008/minute for private repos beyond free tier
- Estimated: $10-30/month for private repo

**Additional Services:**
- CodeCov (optional): Free for open source, $10/month for private
- Vercel: Free for hobby, $20/month for pro

**Total:** $0-60/month depending on repo visibility and usage

---

## Success Criteria

- [ ] All Python code passes linting (flake8, black)
- [ ] Unit tests run on every commit
- [ ] Test coverage > 70%
- [ ] Terraform validates successfully
- [ ] Frontend builds without errors
- [ ] Automated deployment to poc/staging/prod
- [ ] Deployment notifications work
- [ ] Branch protection rules enforced
- [ ] Pre-commit hooks installed and working

---

## Post-Implementation Benefits

1. **Faster Development**: Catch bugs early, before deployment
2. **Higher Quality**: Consistent code standards enforced
3. **Safer Deployments**: Automated testing reduces human error
4. **Better Collaboration**: Clear feedback on pull requests
5. **Documentation**: Tests serve as living documentation
6. **Confidence**: Deploy to production with confidence

---

**Status:** Ready to implement
**Priority:** 🟡 MEDIUM
**Blockers:** None
**Estimated Completion:** 3-4 weeks
