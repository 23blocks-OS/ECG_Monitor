# Garmin & Strava Activity Data Integration

## Overview

This feature allows users to upload their Garmin and Strava exercise data to match with ECG recordings from the portable device. This enables correlation analysis between exercise sessions and cardiac monitoring data.

## Supported File Formats

### Garmin
- **FIT** (Flexible and Interoperable Data Transfer) - Binary format, most complete data
- **TCX** (Training Center XML) - XML format with HR, cadence, laps
- **GPX** (GPS eXchange Format) - XML format for GPS tracks

### Strava
- **FIT** - Primary export format (from bulk export)
- **TCX** - Individual activity exports
- **GPX** - Alternative export format
- **JSON** - Activity metadata

## Database Schema

### 1. activity_uploads Table
Stores metadata about uploaded files.

**Schema:**
```javascript
{
  upload_id: String,           // Primary key (UUID)
  user_id: String,             // User who uploaded
  upload_timestamp: Number,    // Unix timestamp
  source: String,              // "garmin" or "strava"
  file_name: String,           // Original filename
  file_type: String,           // "fit", "gpx", "tcx", "json"
  file_size: Number,           // Size in bytes
  s3_key: String,              // S3 object key
  s3_bucket: String,           // S3 bucket name
  processing_status: String,   // "pending", "processing", "completed", "failed"
  activities_count: Number,    // Number of activities parsed
  error_message: String,       // Error if processing failed
  ttl: Number                  // TTL for auto-deletion
}
```

**Indexes:**
- `UserUploadsIndex`: user_id (hash) + upload_timestamp (range)
- `SourceUploadsIndex`: source (hash) + upload_timestamp (range)

### 2. activities Table
Stores parsed activity data from uploaded files.

**Schema:**
```javascript
{
  activity_id: String,         // Primary key (UUID)
  user_id: String,             // User who owns this activity
  upload_id: String,           // Reference to upload
  source: String,              // "garmin" or "strava"

  // Activity metadata
  activity_name: String,       // e.g., "Morning Run"
  activity_type: String,       // "running", "cycling", "swimming", etc.
  start_timestamp: Number,     // Activity start time (Unix)
  end_timestamp: Number,       // Activity end time (Unix)
  duration_seconds: Number,    // Total duration

  // GPS data summary
  total_distance_meters: Number,
  start_lat: Number,
  start_lon: Number,
  end_lat: Number,
  end_lon: Number,

  // Heart rate data (if available)
  avg_heart_rate: Number,
  max_heart_rate: Number,
  min_heart_rate: Number,
  heart_rate_zones: Object,    // Zone distribution

  // Other metrics (if available)
  avg_speed: Number,           // m/s
  max_speed: Number,
  avg_cadence: Number,         // steps/min or RPM
  avg_power: Number,           // watts (cycling)
  elevation_gain: Number,      // meters
  elevation_loss: Number,
  calories: Number,

  // Detailed time-series data (stored as arrays)
  time_series: {
    timestamps: [Number],      // Array of timestamps
    heart_rates: [Number],     // HR at each timestamp
    distances: [Number],       // Distance at each point
    speeds: [Number],          // Speed at each point
    elevations: [Number],      // Elevation at each point
    cadences: [Number],        // Cadence at each point
    powers: [Number],          // Power at each point
    positions: [{              // GPS coordinates
      lat: Number,
      lon: Number
    }]
  },

  // Matching status
  has_ecg_match: Boolean,      // Whether matched with ECG session
  ecg_match_count: Number,     // Number of ECG sessions matched

  ttl: Number                  // TTL for auto-deletion
}
```

**Indexes:**
- `UserActivitiesIndex`: user_id (hash) + start_timestamp (range)
- `UploadActivitiesIndex`: upload_id (hash) + start_timestamp (range)
- `SourceActivitiesIndex`: source (hash) + start_timestamp (range)

### 3. activity_ecg_matches Table
Links activities with ECG recording sessions.

**Schema:**
```javascript
{
  match_id: String,            // Primary key (UUID)
  activity_id: String,         // Reference to activity
  session_id: String,          // Reference to ECG session
  user_id: String,             // User

  // Match metadata
  match_timestamp: Number,     // When the match was created
  match_type: String,          // "automatic" or "manual"
  match_quality: Number,       // 0-100 score

  // Overlap analysis
  overlap_start: Number,       // Start of overlap period
  overlap_end: Number,         // End of overlap period
  overlap_duration: Number,    // Duration of overlap in seconds

  // Correlation metrics
  hr_correlation: Number,      // HR correlation coefficient (-1 to 1)
  avg_hr_diff: Number,         // Average HR difference
  max_hr_diff: Number,         // Maximum HR difference

  // Notes
  notes: String,               // User notes about the match
  verified: Boolean            // User-verified match
}
```

**Indexes:**
- `ActivityMatchesIndex`: activity_id (hash)
- `SessionMatchesIndex`: session_id (hash)
- `UserMatchesIndex`: user_id (hash) + match_timestamp (range)

## File Storage

### S3 Bucket: activity-files
- **Purpose**: Store uploaded activity files (FIT, GPX, TCX, JSON)
- **Lifecycle**: Files retained for 1 year, then auto-deleted
- **Versioning**: Enabled
- **Encryption**: AES256 server-side encryption
- **CORS**: Enabled for direct browser uploads

## Data Flow

1. **Upload**:
   - User selects file(s) in dashboard
   - Frontend requests pre-signed S3 URL from API
   - File uploaded directly to S3
   - Upload metadata saved to `activity_uploads` table

2. **Processing**:
   - S3 upload triggers Lambda function
   - Lambda downloads file from S3
   - File parsed based on type (FIT/GPX/TCX/JSON)
   - Activity data extracted and saved to `activities` table
   - Upload status updated to "completed"

3. **Matching**:
   - Automatic: Lambda function searches for ECG sessions with overlapping timestamps
   - Manual: User can manually link activities to sessions in UI
   - Match records created in `activity_ecg_matches` table

4. **Visualization**:
   - Dashboard displays activities and ECG sessions side-by-side
   - Overlay heart rate data from both sources
   - Highlight correlations and differences

## API Endpoints

### Upload Activity File
```
POST /api/activities/upload
Content-Type: multipart/form-data

Request:
{
  file: File,
  source: "garmin" | "strava"
}

Response:
{
  upload_id: string,
  status: "pending",
  s3_url: string  // Pre-signed URL for direct upload
}
```

### Get User Activities
```
GET /api/activities?user_id={user_id}&start={timestamp}&end={timestamp}

Response:
{
  activities: [Activity],
  count: number
}
```

### Get Activity Details
```
GET /api/activities/{activity_id}

Response: Activity object with full time-series data
```

### Match Activity with ECG Session
```
POST /api/activities/match

Request:
{
  activity_id: string,
  session_id: string,
  match_type: "automatic" | "manual"
}

Response: ActivityECGMatch object
```

### Get Matches
```
GET /api/activities/matches?user_id={user_id}

Response:
{
  matches: [ActivityECGMatch],
  count: number
}
```

## File Parsing Libraries

### FIT Files
- **Library**: `fit-file-parser` (npm)
- **Features**: Parses binary FIT files, extracts all data fields
- **Usage**: Primary format for both Garmin and Strava

### GPX Files
- **Library**: `gpxparser` (npm)
- **Features**: Parses GPX XML, extracts tracks and waypoints
- **Usage**: Common export format

### TCX Files
- **Library**: `tcx-js` (npm)
- **Features**: Parses TCX XML, extracts activities and laps
- **Usage**: Garmin's XML format

## Matching Algorithm

The automatic matching algorithm considers:

1. **Time Overlap**: Activity and ECG session must overlap by at least 50%
2. **User**: Must belong to the same user
3. **Heart Rate Correlation**: If both have HR data, correlation must be > 0.7
4. **Quality Score**: Calculated based on:
   - Overlap percentage (0-40 points)
   - HR correlation (0-40 points)
   - Data completeness (0-20 points)

Matches with quality > 70 are automatically created.
Matches with quality 50-70 are suggested to user.
Matches with quality < 50 are not created.

## Privacy & Security

- All data encrypted at rest (DynamoDB and S3)
- All data encrypted in transit (HTTPS)
- User data isolated by user_id
- Files auto-deleted after 1 year
- HIPAA-compliant infrastructure ready

## Future Enhancements

1. **Bulk Import**: Support Garmin/Strava bulk export ZIP files
2. **API Integration**: Direct integration with Garmin Connect and Strava APIs
3. **Advanced Analytics**: ML-based anomaly detection across both datasets
4. **Workout Planning**: Suggest optimal workout intensities based on ECG data
5. **Training Load**: Calculate training load and recovery metrics
6. **Export**: Export combined datasets for research or sharing with doctors
