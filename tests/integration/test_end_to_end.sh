#!/bin/bash
#
# End-to-End Integration Test
#
# Tests the complete ECG monitoring pipeline:
# 1. Simulated data → IoT Core
# 2. IoT → S3, SQS, DynamoDB
# 3. Lambda processing
# 4. API endpoints
# 5. Dashboard data
#

set -e

echo "=========================================="
echo "ECG Monitor - End-to-End Integration Test"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TEST_DATA_DIR="$PROJECT_ROOT/tests/data"
TERRAFORM_DIR="$PROJECT_ROOT/terraform/environments/poc"

# Check if deployed
if [ ! -f "$TERRAFORM_DIR/terraform.tfstate" ]; then
    echo -e "${RED}✗ Terraform not deployed${NC}"
    echo "Please run: ./deploy.sh first"
    exit 1
fi

cd "$TERRAFORM_DIR"

# Get outputs
echo "Getting deployment information..."
IOT_ENDPOINT=$(terraform output -raw iot_endpoint 2>/dev/null || echo "")
API_URL=$(terraform output -raw api_gateway_url 2>/dev/null || echo "")
CLOUDFRONT_URL=$(terraform output -raw cloudfront_url 2>/dev/null || echo "")
RAW_BUCKET=$(terraform output -raw raw_data_bucket 2>/dev/null || echo "")
SESSIONS_TABLE=$(terraform output -raw sessions_table 2>/dev/null || echo "")

if [ -z "$API_URL" ]; then
    echo -e "${RED}✗ Could not get Terraform outputs${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Deployment found${NC}"
echo "  IoT Endpoint: $IOT_ENDPOINT"
echo "  API URL: $API_URL"
echo ""

# Test 1: Check AWS Resources
echo "=========================================="
echo "Test 1: Verify AWS Resources"
echo "=========================================="
echo ""

echo "Checking Lambda functions..."
LAMBDA_COUNT=$(aws lambda list-functions --query 'Functions[?contains(FunctionName, `ecg-monitor-poc`)].FunctionName' --output text | wc -w)
if [ "$LAMBDA_COUNT" -ge 4 ]; then
    echo -e "${GREEN}✓ Found $LAMBDA_COUNT Lambda functions${NC}"
else
    echo -e "${RED}✗ Expected 4+ Lambda functions, found $LAMBDA_COUNT${NC}"
fi

echo "Checking DynamoDB tables..."
TABLE_COUNT=$(aws dynamodb list-tables --query 'TableNames[?contains(@, `ecg-monitor-poc`)]' --output text | wc -w)
if [ "$TABLE_COUNT" -ge 3 ]; then
    echo -e "${GREEN}✓ Found $TABLE_COUNT DynamoDB tables${NC}"
else
    echo -e "${RED}✗ Expected 3+ DynamoDB tables, found $TABLE_COUNT${NC}"
fi

echo "Checking S3 buckets..."
BUCKET_COUNT=$(aws s3 ls | grep ecg-monitor-poc | wc -l)
if [ "$BUCKET_COUNT" -ge 3 ]; then
    echo -e "${GREEN}✓ Found $BUCKET_COUNT S3 buckets${NC}"
else
    echo -e "${RED}✗ Expected 3+ S3 buckets, found $BUCKET_COUNT${NC}"
fi

echo ""

# Test 2: API Endpoints
echo "=========================================="
echo "Test 2: Test API Endpoints"
echo "=========================================="
echo ""

echo "Testing GET /api/live..."
LIVE_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/api/live?device_id=ecg-device-001")
HTTP_CODE=$(echo "$LIVE_RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ API /live endpoint working (HTTP $HTTP_CODE)${NC}"
    echo "$LIVE_RESPONSE" | head -n-1 | jq -r '.device_id, .status, .metrics.heart_rate_bpm' | head -3
else
    echo -e "${RED}✗ API /live endpoint failed (HTTP $HTTP_CODE)${NC}"
fi

echo ""
echo "Testing GET /api/alerts..."
ALERTS_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/api/alerts?device_id=ecg-device-001")
HTTP_CODE=$(echo "$ALERTS_RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ API /alerts endpoint working (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}✗ API /alerts endpoint failed (HTTP $HTTP_CODE)${NC}"
fi

echo ""

# Test 3: Simulate Data Injection
echo "=========================================="
echo "Test 3: Inject Test Data"
echo "=========================================="
echo ""

# Check if test data exists
if [ ! -f "$TEST_DATA_DIR/normal_sinus_rhythm.json" ]; then
    echo "Generating test data..."
    cd "$PROJECT_ROOT"
    python3 tests/data/generate_test_data.py
fi

echo "Injecting test ECG batch via IoT Core..."

# Create test payload
TEST_BATCH=$(cat "$TEST_DATA_DIR/normal_sinus_rhythm.json")
TIMESTAMP=$(date +%s)000

# Publish to IoT (requires IoT data plane permissions)
echo "Publishing test data to IoT Core topic..."
if aws iot-data publish \
    --topic "ecg/device001/data" \
    --payload "$(echo $TEST_BATCH | jq -c '.')" \
    --cli-binary-format raw-in-base64-out 2>/dev/null; then
    echo -e "${GREEN}✓ Test data published to IoT Core${NC}"
else
    echo -e "${YELLOW}⚠ Could not publish to IoT (may need additional permissions)${NC}"
    echo "  You can test manually using the simulator:"
    echo "  python3 tests/simulators/ecg_system_simulator.py --cert <cert> --key <key> --ca <ca>"
fi

echo ""

# Test 4: Wait and Check Processing
echo "=========================================="
echo "Test 4: Verify Data Processing"
echo "=========================================="
echo ""

echo "Waiting 30 seconds for Lambda processing..."
sleep 30

echo "Checking S3 for raw data..."
S3_OBJECTS=$(aws s3 ls s3://$RAW_BUCKET/ --recursive | tail -5)
if [ -n "$S3_OBJECTS" ]; then
    echo -e "${GREEN}✓ Found objects in S3:${NC}"
    echo "$S3_OBJECTS" | head -3
else
    echo -e "${YELLOW}⚠ No objects found in S3 yet${NC}"
fi

echo ""
echo "Checking DynamoDB sessions table..."
SESSIONS=$(aws dynamodb scan --table-name $SESSIONS_TABLE --limit 3 --output json 2>/dev/null)
SESSION_COUNT=$(echo "$SESSIONS" | jq -r '.Items | length')
if [ "$SESSION_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Found $SESSION_COUNT session(s) in DynamoDB${NC}"
    echo "$SESSIONS" | jq -r '.Items[0] | {session_id, last_update, last_heart_rate}'
else
    echo -e "${YELLOW}⚠ No sessions found in DynamoDB yet${NC}"
fi

echo ""

# Test 5: Check CloudWatch Logs
echo "=========================================="
echo "Test 5: Check Lambda Execution Logs"
echo "=========================================="
echo ""

echo "Checking preprocessor logs..."
PREPROCESSOR_LOGS=$(aws logs tail /aws/lambda/ecg-monitor-poc-preprocessor --since 5m --format short 2>/dev/null | head -10)
if [ -n "$PREPROCESSOR_LOGS" ]; then
    echo -e "${GREEN}✓ Preprocessor Lambda has recent logs${NC}"
    echo "$PREPROCESSOR_LOGS" | head -5
else
    echo -e "${YELLOW}⚠ No recent logs from preprocessor${NC}"
fi

echo ""

# Test 6: Dashboard Accessibility
echo "=========================================="
echo "Test 6: Verify Dashboard Access"
echo "=========================================="
echo ""

echo "Testing CloudFront distribution..."
DASHBOARD_RESPONSE=$(curl -s -w "\n%{http_code}" "$CLOUDFRONT_URL")
HTTP_CODE=$(echo "$DASHBOARD_RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Dashboard accessible (HTTP $HTTP_CODE)${NC}"
    echo "  URL: $CLOUDFRONT_URL"
else
    echo -e "${RED}✗ Dashboard not accessible (HTTP $HTTP_CODE)${NC}"
fi

echo ""

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo ""

# Calculate results
TOTAL_TESTS=6
PASSED_TESTS=0

[ "$LAMBDA_COUNT" -ge 4 ] && PASSED_TESTS=$((PASSED_TESTS + 1))
[ "$HTTP_CODE" = "200" ] && PASSED_TESTS=$((PASSED_TESTS + 1))
[ -n "$S3_OBJECTS" ] && PASSED_TESTS=$((PASSED_TESTS + 1))
[ "$SESSION_COUNT" -gt 0 ] && PASSED_TESTS=$((PASSED_TESTS + 1))
[ -n "$PREPROCESSOR_LOGS" ] && PASSED_TESTS=$((PASSED_TESTS + 1))
[ "$HTTP_CODE" = "200" ] && PASSED_TESTS=$((PASSED_TESTS + 1))

echo "Passed: $PASSED_TESTS/$TOTAL_TESTS tests"
echo ""

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "Your ECG Monitor system is fully functional!"
    echo "Dashboard: $CLOUDFRONT_URL"
    exit 0
else
    echo -e "${YELLOW}⚠ Some tests failed or pending${NC}"
    echo ""
    echo "This is normal if:"
    echo "  - System was just deployed (Lambda cold start)"
    echo "  - No real data has been sent yet"
    echo "  - IoT permissions need configuration"
    echo ""
    echo "Try running the full simulator:"
    echo "  python3 tests/simulators/ecg_system_simulator.py --cert <cert> --key <key> --ca <ca>"
    exit 1
fi
