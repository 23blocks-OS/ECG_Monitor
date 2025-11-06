# API Documentation Implementation Plan

## Current State
**Status:** No formal API documentation
**Risk:** Hard to integrate, poor developer experience, undiscovered issues
**Priority:** 🟢 **MEDIUM-LOW - Improves integration and adoption**

---

## Goals

1. **Developer-Friendly**: Easy to understand and use
2. **Comprehensive**: Cover all endpoints, parameters, responses
3. **Interactive**: Allow testing in browser (Swagger UI)
4. **Versioned**: Track API changes over time
5. **Examples**: Real request/response examples
6. **Authentication Guide**: Clear auth flow documentation

---

## Implementation Plan

### Phase 1: OpenAPI Specification (Week 1)

#### Step 1.1: Create OpenAPI 3.0 Spec

**Create** `docs/api/openapi.yaml`:

```yaml
openapi: 3.0.3
info:
  title: ECG Monitor API
  description: |
    REST API for ECG Monitor - AI-powered cardiac monitoring system.

    ## Authentication
    All endpoints require JWT authentication via AWS Cognito.
    Include the access token in the Authorization header:
    ```
    Authorization: Bearer <your-jwt-token>
    ```

    ## Rate Limiting
    - 100 requests per minute per user
    - 1000 requests per hour per organization

    ## Base URL
    - Production: https://api.ecg-monitor.example.com
    - Staging: https://api-staging.ecg-monitor.example.com

  version: 1.0.0
  contact:
    name: API Support
    email: support@ecg-monitor.example.com
    url: https://github.com/23blocks-OS/ECG_Monitor
  license:
    name: Dual-Use License
    url: https://github.com/23blocks-OS/ECG_Monitor/blob/main/LICENSE

servers:
  - url: https://api.ecg-monitor.example.com/api
    description: Production
  - url: https://api-staging.ecg-monitor.example.com/api
    description: Staging
  - url: http://localhost:3000/api
    description: Local Development

tags:
  - name: Live Data
    description: Real-time ECG data and metrics
  - name: Historical Data
    description: Past ECG sessions and analysis
  - name: Alerts
    description: Arrhythmia alerts and notifications
  - name: Analysis
    description: AI-powered ECG analysis results
  - name: Users
    description: User management and profiles
  - name: Organizations
    description: Organization management

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT token from AWS Cognito

  schemas:
    ECGMetrics:
      type: object
      properties:
        heart_rate:
          type: number
          description: Heart rate in BPM
          example: 72
        hrv_rmssd:
          type: number
          description: Heart Rate Variability (RMSSD in ms)
          example: 42.5
        hrv_sdnn:
          type: number
          description: HRV Standard Deviation (SDNN in ms)
          example: 55.2
        qrs_width:
          type: number
          description: QRS complex width in ms
          example: 95
        signal_quality:
          type: number
          format: float
          minimum: 0
          maximum: 1
          description: Signal quality score (0-1)
          example: 0.95
        rr_intervals:
          type: array
          items:
            type: number
          description: R-R intervals in milliseconds
          example: [830, 840, 825, 850]

    ECGWaveform:
      type: object
      properties:
        channel:
          type: integer
          description: ECG lead/channel (1, 2, or 3)
          example: 1
        samples:
          type: array
          items:
            type: number
          description: ECG voltage samples (downsampled for web display)
          example: [0.1, 0.15, 0.2, 0.5, 0.8, 1.2, 0.9, 0.3, 0.1]
        sampling_rate:
          type: integer
          description: Sampling rate in Hz (after downsampling)
          example: 100
        timestamp:
          type: string
          format: date-time
          description: ISO 8601 timestamp
          example: "2025-01-15T10:30:00Z"

    LiveDataResponse:
      type: object
      properties:
        session_id:
          type: string
          description: Current ECG session ID
          example: "session-abc123"
        user_id:
          type: string
          description: User ID
          example: "user-xyz789"
        timestamp:
          type: string
          format: date-time
          example: "2025-01-15T10:30:00Z"
        metrics:
          $ref: '#/components/schemas/ECGMetrics'
        waveforms:
          type: array
          items:
            $ref: '#/components/schemas/ECGWaveform'
          description: ECG waveform data for all channels

    Alert:
      type: object
      properties:
        alert_id:
          type: string
          example: "alert-def456"
        user_id:
          type: string
          example: "user-xyz789"
        session_id:
          type: string
          example: "session-abc123"
        timestamp:
          type: string
          format: date-time
          example: "2025-01-15T10:30:00Z"
        severity:
          type: string
          enum: [low, medium, high, critical]
          example: "high"
        alert_type:
          type: string
          enum: [afib, pvcs, pacs, bradycardia, tachycardia, irregular_rhythm]
          example: "afib"
        description:
          type: string
          example: "Atrial fibrillation detected with heart rate 140 BPM"
        confidence:
          type: number
          format: float
          minimum: 0
          maximum: 1
          example: 0.92
        acknowledged:
          type: boolean
          example: false
        acknowledged_by:
          type: string
          nullable: true
          example: null

    AIAnalysis:
      type: object
      properties:
        analysis_id:
          type: string
          example: "analysis-ghi789"
        session_id:
          type: string
          example: "session-abc123"
        user_id:
          type: string
          example: "user-xyz789"
        timestamp:
          type: string
          format: date-time
          example: "2025-01-15T10:30:00Z"
        model:
          type: string
          example: "claude-3.5-sonnet"
        findings:
          type: array
          items:
            type: object
            properties:
              finding:
                type: string
                example: "Atrial fibrillation"
              confidence:
                type: number
                example: 0.92
              severity:
                type: string
                enum: [low, medium, high]
                example: "high"
        interpretation:
          type: string
          example: "The ECG shows irregular R-R intervals with absent P waves, consistent with atrial fibrillation..."
        recommendations:
          type: array
          items:
            type: string
          example:
            - "Consider anticoagulation therapy"
            - "Monitor heart rate control"
            - "Follow up with cardiologist"

    Error:
      type: object
      properties:
        error:
          type: string
          example: "Invalid request"
        message:
          type: string
          example: "Missing required parameter: start_time"
        code:
          type: string
          example: "INVALID_PARAMETER"

security:
  - BearerAuth: []

paths:
  /live:
    get:
      summary: Get live ECG data
      description: |
        Retrieve the most recent ECG data and metrics for a user.
        Returns latest 10-second window of data.

        **Permissions:**
        - Patients can only access their own data
        - Providers can access data for patients in their organization

      tags:
        - Live Data
      parameters:
        - name: user_id
          in: query
          description: User ID (optional for patients, required for providers)
          schema:
            type: string
          example: "user-xyz789"
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LiveDataResponse'
              example:
                session_id: "session-abc123"
                user_id: "user-xyz789"
                timestamp: "2025-01-15T10:30:00Z"
                metrics:
                  heart_rate: 72
                  hrv_rmssd: 42.5
                  hrv_sdnn: 55.2
                  qrs_width: 95
                  signal_quality: 0.95
                  rr_intervals: [830, 840, 825, 850]
                waveforms:
                  - channel: 1
                    samples: [0.1, 0.15, 0.2, 0.5, 0.8, 1.2, 0.9, 0.3, 0.1]
                    sampling_rate: 100
                    timestamp: "2025-01-15T10:30:00Z"
        '401':
          description: Unauthorized - Invalid or expired token
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '403':
          description: Forbidden - Insufficient permissions
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '404':
          description: No data available
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /history:
    get:
      summary: Get historical ECG data
      description: |
        Retrieve aggregated ECG metrics over a time range.
        Data is aggregated into 1-minute summaries.

      tags:
        - Historical Data
      parameters:
        - name: user_id
          in: query
          description: User ID (optional for patients)
          schema:
            type: string
        - name: start_time
          in: query
          required: true
          description: Start time (ISO 8601 format)
          schema:
            type: string
            format: date-time
          example: "2025-01-15T00:00:00Z"
        - name: end_time
          in: query
          required: true
          description: End time (ISO 8601 format)
          schema:
            type: string
            format: date-time
          example: "2025-01-15T23:59:59Z"
        - name: granularity
          in: query
          description: Aggregation granularity
          schema:
            type: string
            enum: [minute, hour, day]
            default: minute
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  user_id:
                    type: string
                  start_time:
                    type: string
                    format: date-time
                  end_time:
                    type: string
                    format: date-time
                  granularity:
                    type: string
                  data_points:
                    type: array
                    items:
                      type: object
                      properties:
                        timestamp:
                          type: string
                          format: date-time
                        metrics:
                          $ref: '#/components/schemas/ECGMetrics'
        '400':
          description: Invalid parameters
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /alerts:
    get:
      summary: Get alerts
      description: |
        Retrieve arrhythmia alerts for a user.
        Returns alerts from the last 24 hours by default.

      tags:
        - Alerts
      parameters:
        - name: user_id
          in: query
          description: User ID (optional for patients)
          schema:
            type: string
        - name: start_time
          in: query
          description: Start time (default: 24 hours ago)
          schema:
            type: string
            format: date-time
        - name: severity
          in: query
          description: Filter by severity
          schema:
            type: string
            enum: [low, medium, high, critical]
        - name: acknowledged
          in: query
          description: Filter by acknowledgment status
          schema:
            type: boolean
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  user_id:
                    type: string
                  alerts:
                    type: array
                    items:
                      $ref: '#/components/schemas/Alert'

    patch:
      summary: Acknowledge alert
      description: Mark an alert as acknowledged
      tags:
        - Alerts
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - alert_id
              properties:
                alert_id:
                  type: string
                  example: "alert-def456"
                notes:
                  type: string
                  example: "Contacted patient, scheduled follow-up"
      responses:
        '200':
          description: Alert acknowledged successfully
        '404':
          description: Alert not found

  /analysis/{session_id}:
    get:
      summary: Get AI analysis for a session
      description: Retrieve detailed AI analysis results for an ECG session
      tags:
        - Analysis
      parameters:
        - name: session_id
          in: path
          required: true
          schema:
            type: string
          example: "session-abc123"
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AIAnalysis'
        '404':
          description: Analysis not found

  /users/me:
    get:
      summary: Get current user profile
      description: Retrieve authenticated user's profile information
      tags:
        - Users
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  user_id:
                    type: string
                  email:
                    type: string
                  name:
                    type: string
                  organization_id:
                    type: string
                  role:
                    type: string
                    enum: [patient, doctor, nurse, admin, caregiver]
                  created_at:
                    type: string
                    format: date-time

  /export:
    post:
      summary: Export user data
      description: |
        Export all user data (GDPR compliance).
        Returns a download URL valid for 7 days.

      tags:
        - Users
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                user_id:
                  type: string
                  description: User ID (only needed for admins)
                format:
                  type: string
                  enum: [json, csv]
                  default: json
      responses:
        '200':
          description: Export initiated successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  export_id:
                    type: string
                  download_url:
                    type: string
                  expires_at:
                    type: string
                    format: date-time
```

### Phase 2: Interactive Documentation (Week 2)

#### Step 2.1: Set Up Swagger UI

**Create** `docs/api/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ECG Monitor API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
    <style>
        body {
            margin: 0;
            padding: 0;
        }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>

    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: "openapi.yaml",
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                requestInterceptor: (request) => {
                    // Optionally add auth token for testing
                    const token = localStorage.getItem('jwt_token');
                    if (token) {
                        request.headers['Authorization'] = `Bearer ${token}`;
                    }
                    return request;
                }
            });

            window.ui = ui;
        };
    </script>
</body>
</html>
```

**Host on GitHub Pages or with docs site:**

```bash
# Option 1: GitHub Pages
cp docs/api/* docs/
git add docs/ && git commit -m "Add API documentation" && git push

# Option 2: Include in main website
cp docs/api/* website/api-docs/
```

#### Step 2.2: Add Postman Collection

**Generate Postman collection from OpenAPI:**

```bash
npm install -g openapi-to-postmanv2

openapi2postmanv2 -s docs/api/openapi.yaml -o docs/api/postman-collection.json -p
```

**Or manually create** `docs/api/postman-collection.json`:

```json
{
  "info": {
    "name": "ECG Monitor API",
    "description": "API collection for ECG Monitor",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{jwt_token}}",
        "type": "string"
      }
    ]
  },
  "item": [
    {
      "name": "Live Data",
      "item": [
        {
          "name": "Get Live ECG Data",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{base_url}}/api/live",
              "host": ["{{base_url}}"],
              "path": ["api", "live"]
            }
          }
        }
      ]
    },
    {
      "name": "Historical Data",
      "item": [
        {
          "name": "Get Historical Data",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{base_url}}/api/history?start_time=2025-01-15T00:00:00Z&end_time=2025-01-15T23:59:59Z",
              "host": ["{{base_url}}"],
              "path": ["api", "history"],
              "query": [
                {
                  "key": "start_time",
                  "value": "2025-01-15T00:00:00Z"
                },
                {
                  "key": "end_time",
                  "value": "2025-01-15T23:59:59Z"
                }
              ]
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "https://api.ecg-monitor.example.com"
    },
    {
      "key": "jwt_token",
      "value": "your-jwt-token-here"
    }
  ]
}
```

### Phase 3: SDK/Client Libraries (Week 3, Optional)

#### Step 3.1: Generate Python Client

**Using OpenAPI Generator:**

```bash
docker run --rm -v "${PWD}:/local" openapitools/openapi-generator-cli generate \
  -i /local/docs/api/openapi.yaml \
  -g python \
  -o /local/sdk/python \
  --additional-properties=projectName=ecg-monitor-sdk,packageName=ecg_monitor
```

**Example usage:**

```python
from ecg_monitor import ECGMonitorAPI

# Initialize client
client = ECGMonitorAPI(
    base_url="https://api.ecg-monitor.example.com",
    access_token="your-jwt-token"
)

# Get live data
live_data = client.get_live_data(user_id="user-123")
print(f"Heart Rate: {live_data.metrics.heart_rate} BPM")

# Get historical data
history = client.get_historical_data(
    user_id="user-123",
    start_time="2025-01-15T00:00:00Z",
    end_time="2025-01-15T23:59:59Z"
)
```

#### Step 3.2: Generate JavaScript/TypeScript Client

```bash
docker run --rm -v "${PWD}:/local" openapitools/openapi-generator-cli generate \
  -i /local/docs/api/openapi.yaml \
  -g typescript-fetch \
  -o /local/sdk/typescript
```

### Phase 4: Documentation Website (Week 3-4)

#### Step 4.1: Create Developer Portal

**Structure:**

```
docs/developer-portal/
├── getting-started.md
├── authentication.md
├── quickstart.md
├── api-reference.md (generated from OpenAPI)
├── examples/
│   ├── python-examples.md
│   ├── javascript-examples.md
│   └── curl-examples.md
├── webhooks.md (future)
├── rate-limits.md
└── changelog.md
```

**Example: Getting Started** (`docs/developer-portal/getting-started.md`):

```markdown
# Getting Started with ECG Monitor API

## Prerequisites

1. **ECG Monitor Account**: Sign up at https://app.ecg-monitor.example.com
2. **AWS Cognito Credentials**: Obtain from your organization admin
3. **API Access**: Ensure your user has appropriate role/permissions

## Authentication

The ECG Monitor API uses JWT tokens from AWS Cognito for authentication.

### Step 1: Sign In

```bash
curl -X POST https://cognito-idp.us-east-1.amazonaws.com/ \
  -H "Content-Type: application/x-amz-json-1.1" \
  -H "X-Amz-Target: AWSCognitoIdentityProviderService.InitiateAuth" \
  -d '{
    "AuthFlow": "USER_PASSWORD_AUTH",
    "ClientId": "YOUR_CLIENT_ID",
    "AuthParameters": {
      "USERNAME": "your-email@example.com",
      "PASSWORD": "your-password"
    }
  }'
```

### Step 2: Extract Access Token

```json
{
  "AuthenticationResult": {
    "AccessToken": "eyJraWQiOiJ...",
    "IdToken": "eyJraWQiOiJ...",
    "RefreshToken": "eyJjdHkiOiJ...",
    "ExpiresIn": 3600
  }
}
```

### Step 3: Make API Requests

```bash
curl https://api.ecg-monitor.example.com/api/live \
  -H "Authorization: Bearer eyJraWQiOiJ..."
```

## Quick Example

### Python

```python
import requests

# Authenticate
auth_response = requests.post(
    'https://YOUR_COGNITO_DOMAIN.auth.us-east-1.amazoncognito.com/oauth2/token',
    data={
        'grant_type': 'password',
        'client_id': 'YOUR_CLIENT_ID',
        'username': 'your-email@example.com',
        'password': 'your-password'
    }
)

access_token = auth_response.json()['access_token']

# Get live data
response = requests.get(
    'https://api.ecg-monitor.example.com/api/live',
    headers={'Authorization': f'Bearer {access_token}'}
)

data = response.json()
print(f"Heart Rate: {data['metrics']['heart_rate']} BPM")
```

## Next Steps

- [API Reference](api-reference.html) - Complete endpoint documentation
- [Examples](examples/) - Code examples in multiple languages
- [Rate Limits](rate-limits.html) - API usage limits
```

---

## Timeline & Effort

| Phase | Duration | Effort |
|-------|----------|--------|
| Phase 1: OpenAPI Spec | 1 week | 16-24 hours |
| Phase 2: Interactive Docs | 3-5 days | 8-12 hours |
| Phase 3: SDK Generation (Optional) | 3-5 days | 12-16 hours |
| Phase 4: Developer Portal | 1 week | 16-24 hours |
| **Total** | **3-4 weeks** | **52-76 hours** |

---

## Cost Impact

**Hosting:**
- GitHub Pages: Free
- Custom domain: $10-20/year

**Tools:**
- Swagger UI: Free (open source)
- OpenAPI Generator: Free (open source)
- Postman: Free for individual use

**Total:** $0-20/year

---

## Success Criteria

- [ ] OpenAPI 3.0 spec covers all endpoints
- [ ] Swagger UI deployed and accessible
- [ ] Postman collection available for download
- [ ] Authentication flow documented
- [ ] At least 5 code examples per language
- [ ] Error codes documented
- [ ] Rate limits documented
- [ ] Changelog established

---

## Post-Implementation Benefits

1. **Better Integration**: Developers can integrate easily
2. **Reduced Support**: Self-service documentation
3. **Faster Onboarding**: New team members get up to speed quickly
4. **API Quality**: Writing docs reveals API design issues
5. **Community Growth**: Open documentation attracts contributors

---

## Maintenance

### Regular Updates
- Update OpenAPI spec with each API change
- Keep examples current
- Document breaking changes in changelog
- Update SDKs when API changes

### Versioning Strategy
```
/api/v1/live  -> Current stable version
/api/v2/live  -> Next version (beta)
```

---

**Status:** Ready to implement
**Priority:** 🟢 MEDIUM-LOW
**Blockers:** None
**Estimated Completion:** 3-4 weeks
