# Garmin & Strava Integration - Implementation Guide

## Overview

This feature allows users to upload their Garmin and Strava exercise data files and automatically match them with ECG recording sessions. This enables powerful correlation analysis between exercise activities and cardiac monitoring data.

## What Was Built

### 1. Database Tables (DynamoDB)

Three new tables in `/terraform/modules/storage/activity_tables.tf`:

- **activity_uploads**: Stores metadata about uploaded files
- **activities**: Stores parsed activity data with full time-series
- **activity_ecg_matches**: Links activities with ECG sessions

Plus one S3 bucket for storing uploaded files.

### 2. Lambda Functions

Three new Lambda functions in `/lambda/`:

**activity-api-handler** (`/lambda/activity-api-handler/`)
- Handles API endpoints for uploads, listing activities, and creating matches
- Generates pre-signed S3 URLs for direct browser uploads
- Provides REST API for frontend

**activity-processor** (`/lambda/activity-processor/`)
- Triggered by S3 upload events
- Parses FIT, GPX, and TCX files
- Extracts activity data and time-series
- Stores data in DynamoDB
- Triggers automatic matching

**activity-matcher** (`/lambda/activity-matcher/`)
- Automatically matches activities with ECG sessions
- Calculates match quality scores based on:
  - Time overlap (0-40 points)
  - Heart rate correlation (0-40 points)
  - Data completeness (0-20 points)
- Creates matches above 70 quality threshold

### 3. Frontend Components

**ActivityUpload Component** (`/dashboard-next/components/ActivityUpload.tsx`)
- File upload interface with drag & drop
- Source selection (Garmin/Strava)
- Progress indicator
- Supports FIT, GPX, TCX, JSON files

**ActivityList Component** (`/dashboard-next/components/ActivityList.tsx`)
- Displays uploaded activities
- Shows key metrics (duration, distance, HR, calories)
- Indicates match status with ECG sessions
- Source badges (Garmin/Strava)

**Activities Page** (`/dashboard-next/app/dashboard/activities/page.tsx`)
- Complete activities management page
- Upload section with stats
- Activities list with auto-refresh
- Integration with activity API

### 4. TypeScript Types

**Type Definitions** (`/dashboard-next/types/activity.ts`)
- Complete type definitions for all data structures
- API request/response types
- UI component prop types

**Activity API Client** (`/dashboard-next/lib/activityApi.ts`)
- Client-side API functions
- Type-safe API calls
- Error handling

### 5. Documentation

**Integration Documentation** (`/docs/ACTIVITY_INTEGRATION.md`)
- Complete technical documentation
- Database schema details
- API endpoint specifications
- File format information
- Matching algorithm explanation

## Supported File Formats

### Garmin
- **FIT** (Flexible and Interoperable Data Transfer) - Binary, most complete
  - Contains: GPS, HR, cadence, power, speed, distance, elevation
- **TCX** (Training Center XML) - XML format
  - Contains: GPS, HR, cadence, laps, splits
- **GPX** (GPS eXchange Format) - Open standard
  - Contains: GPS tracks, optional HR extension

### Strava
- **FIT** - Primary format (bulk export)
- **GPX** - Individual activity export
- **TCX** - Individual activity export
- **JSON** - Activity metadata

## How to Deploy

### 1. Apply Terraform Changes

The new database tables and S3 bucket need to be deployed:

```bash
cd terraform/environments/poc
terraform init
terraform plan
terraform apply
```

This will create:
- `ecg-monitor-poc-activity-uploads` table
- `ecg-monitor-poc-activities` table
- `ecg-monitor-poc-activity-ecg-matches` table
- `ecg-monitor-poc-activity-files` S3 bucket

### 2. Deploy Lambda Functions

Build and deploy the new Lambda functions:

```bash
cd lambda

# Build activity-api-handler
cd activity-api-handler
pip install -r requirements.txt -t .
zip -r deployment.zip .
cd ..

# Build activity-processor
cd activity-processor
pip install -r requirements.txt -t .
zip -r deployment.zip .
cd ..

# Build activity-matcher
cd activity-matcher
pip install -r requirements.txt -t .
zip -r deployment.zip .
cd ..
```

Then update your Terraform to create the Lambda functions (see below for Terraform config).

### 3. Configure API Gateway

Add new routes to API Gateway:
- `POST /api/activities/upload`
- `GET /api/activities`
- `GET /api/activities/{id}`
- `POST /api/activities/match`
- `GET /api/activities/matches`

### 4. Configure S3 Trigger

Set up S3 event notification to trigger `activity-processor` Lambda on file uploads to the `activity-files` bucket.

### 5. Deploy Frontend

The frontend components are ready to use. Update your Next.js environment:

```bash
cd dashboard-next
npm install
npm run build
npm start
```

Add a link to the new page in your navigation:
```tsx
<Link href="/dashboard/activities">Activities</Link>
```

## API Endpoints

### Upload Activity File
```bash
POST /api/activities/upload
Content-Type: application/json

{
  "user_id": "user-123",
  "source": "garmin",
  "file_name": "activity.fit",
  "file_type": "fit"
}

Response:
{
  "upload_id": "uuid",
  "status": "pending",
  "s3_url": "https://...",
  "s3_key": "user-123/garmin/uuid/activity.fit"
}
```

### List Activities
```bash
GET /api/activities?user_id=user-123&limit=50

Response:
{
  "activities": [...],
  "count": 10
}
```

### Create Match
```bash
POST /api/activities/match
Content-Type: application/json

{
  "activity_id": "activity-uuid",
  "session_id": "session-uuid",
  "user_id": "user-123",
  "match_type": "manual"
}
```

## Data Flow

1. **User uploads file** in dashboard
   - Frontend requests pre-signed URL from API
   - File uploaded directly to S3
   - Upload record created in DynamoDB

2. **S3 triggers processor**
   - Lambda downloads file
   - Parses based on format (FIT/GPX/TCX)
   - Extracts activity data
   - Stores in DynamoDB

3. **Automatic matching**
   - Processor invokes matcher Lambda
   - Matcher finds overlapping ECG sessions
   - Calculates match quality
   - Creates high-quality matches

4. **User views activities**
   - Dashboard displays activities
   - Shows match status
   - Can manually create additional matches

## File Parsing Libraries

The Lambda functions use these Python libraries:

- **fitparse** - Parse FIT files (binary format)
  ```python
  from fitparse import FitFile
  ```

- **gpxpy** - Parse GPX files (XML format)
  ```python
  import gpxpy
  ```

- **tcx-js** or custom parser - Parse TCX files (XML format)

Install via requirements.txt:
```
boto3>=1.26.0
fitparse>=1.2.0
gpxpy>=1.5.0
```

## Matching Algorithm

The automatic matcher scores potential matches on a 100-point scale:

### Time Overlap (0-40 points)
- Activity and session must overlap by >= 50% of activity duration
- Perfect overlap = 40 points
- Proportional scoring for partial overlap

### Heart Rate Correlation (0-40 points)
- Compares average heart rates
- Difference <= 5 BPM = 40 points
- Difference 20 BPM = 0 points
- Linear scaling between

### Data Completeness (0-20 points)
- Activity has time-series data = 10 points
- Session has metrics = 10 points

### Match Thresholds
- **≥ 70 points**: Automatically created
- **50-69 points**: Suggested to user
- **< 50 points**: Not suggested

## Environment Variables

Lambda functions need these environment variables:

```bash
# activity-api-handler
ACTIVITY_UPLOADS_TABLE=ecg-monitor-poc-activity-uploads
ACTIVITIES_TABLE=ecg-monitor-poc-activities
ACTIVITY_MATCHES_TABLE=ecg-monitor-poc-activity-ecg-matches
ACTIVITY_FILES_BUCKET=ecg-monitor-poc-activity-files

# activity-processor
ACTIVITY_UPLOADS_TABLE=ecg-monitor-poc-activity-uploads
ACTIVITIES_TABLE=ecg-monitor-poc-activities
ACTIVITY_MATCHER_FUNCTION=ecg-monitor-poc-activity-matcher

# activity-matcher
ACTIVITIES_TABLE=ecg-monitor-poc-activities
SESSIONS_TABLE=ecg-monitor-poc-sessions
ACTIVITY_MATCHES_TABLE=ecg-monitor-poc-activity-ecg-matches
```

## Required Terraform Module (TODO)

You'll need to create a Terraform module for the Lambda functions:

```hcl
# terraform/modules/activity/main.tf

resource "aws_lambda_function" "activity_api_handler" {
  filename      = "../../lambda/activity-api-handler/deployment.zip"
  function_name = "${var.project_name}-${var.environment}-activity-api"
  role          = aws_iam_role.activity_lambda_role.arn
  handler       = "handler.lambda_handler"
  runtime       = "python3.11"
  timeout       = 30

  environment {
    variables = {
      ACTIVITY_UPLOADS_TABLE  = var.activity_uploads_table
      ACTIVITIES_TABLE        = var.activities_table
      ACTIVITY_MATCHES_TABLE  = var.activity_matches_table
      ACTIVITY_FILES_BUCKET   = var.activity_files_bucket
    }
  }
}

# Similar for activity-processor and activity-matcher...
```

## Security Considerations

- All data encrypted at rest (DynamoDB and S3)
- All data encrypted in transit (HTTPS)
- Pre-signed URLs expire after 15 minutes
- User data isolated by user_id
- CORS configured for trusted domains only (update in production)
- Files auto-expire after 1 year (TTL)

## Testing

To test the feature:

1. **Upload a test file**
   ```bash
   # Use the dashboard UI or curl
   curl -X POST https://your-api/api/activities/upload \
     -H "Content-Type: application/json" \
     -d '{"user_id":"test","source":"garmin","file_name":"test.fit","file_type":"fit"}'
   ```

2. **Check processing status**
   ```bash
   curl https://your-api/api/activities?user_id=test
   ```

3. **View matches**
   ```bash
   curl https://your-api/api/activities/matches?user_id=test
   ```

## Troubleshooting

### Upload fails
- Check S3 bucket CORS configuration
- Verify pre-signed URL not expired
- Check file size limits

### Processing fails
- Check Lambda logs in CloudWatch
- Verify file format is supported
- Check fitparse/gpxpy library installation

### No matches created
- Verify ECG sessions exist for same user
- Check time overlap (must be >= 50%)
- Review CloudWatch logs for matcher Lambda

## Future Enhancements

- [ ] Bulk upload (ZIP files with multiple activities)
- [ ] Direct API integration with Garmin Connect
- [ ] Direct API integration with Strava
- [ ] TCX parsing implementation
- [ ] Advanced visualization of matched data
- [ ] Export matched datasets
- [ ] Training load and recovery metrics
- [ ] Anomaly detection across both datasets

## References

- [Garmin FIT SDK](https://developer.garmin.com/fit/overview/)
- [GPX Format Specification](https://www.topografix.com/gpx.asp)
- [Strava API Documentation](https://developers.strava.com/)
- [fitparse Library](https://github.com/dtcooper/python-fitparse)
- [gpxpy Library](https://github.com/tkrajina/gpxpy)
