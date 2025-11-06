# Health Data Schema Documentation

## Overview
This document describes the user health data tables that complement the ECG monitoring data, enabling a holistic view of user health. These tables store user profiles, vital signs, and health journal entries.

---

## Database Architecture

**Database System:** AWS DynamoDB (NoSQL)
**Infrastructure Management:** Terraform
**Location:** `terraform/modules/storage/main.tf`

All tables use:
- **Billing Mode:** PAY_PER_REQUEST (serverless)
- **Encryption:** Server-side encryption enabled
- **Point-in-Time Recovery:** Available but disabled by default
- **TTL:** Time-to-live enabled for automatic data expiration (where applicable)

---

## Table Schemas

### 1. Users Table

**Table Name:** `{project}-{env}-users`
**Purpose:** Store user profile information and demographics

#### Primary Key
- **Partition Key:** `user_id` (String) - UUID identifier

#### Global Secondary Indexes
- **EmailIndex:** Partition key `email` - For user lookup by email address

#### Attributes
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john.doe@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "date_of_birth": "1985-03-15",
  "gender": "male",
  "height_cm": 178,
  "phone": "+1-555-0123",
  "emergency_contact": {
    "name": "Jane Doe",
    "phone": "+1-555-0124",
    "relationship": "spouse"
  },
  "medical_history": {
    "conditions": ["hypertension", "type2_diabetes"],
    "allergies": ["penicillin"],
    "medications": ["metformin", "lisinopril"]
  },
  "created_at": 1699123456789,
  "updated_at": 1699123456789,
  "account_status": "active"
}
```

#### Query Patterns
- Get user by ID: `GetItem` with `user_id`
- Find user by email: Query `EmailIndex` with `email`

---

### 2. Blood Pressure Table

**Table Name:** `{project}-{env}-blood-pressure`
**Purpose:** Track blood pressure readings over time

#### Primary Key
- **Partition Key:** `user_id` (String) - User identifier
- **Sort Key:** `timestamp` (Number) - Reading timestamp in milliseconds

#### Attributes
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": 1699123456789,
  "reading_id": "bp-uuid-v4",
  "systolic": 120,
  "diastolic": 80,
  "pulse": 72,
  "measurement_position": "sitting",
  "arm": "left",
  "notes": "Measured after 5 minutes rest",
  "device_used": "Omron BP785N",
  "tags": ["morning", "fasting"],
  "ttl": 1762195456
}
```

#### Field Descriptions
- **systolic** (Number): Systolic pressure in mmHg
- **diastolic** (Number): Diastolic pressure in mmHg
- **pulse** (Number): Heart rate in BPM (optional)
- **measurement_position** (String): sitting | standing | lying
- **arm** (String): left | right
- **notes** (String): Free-form notes
- **tags** (Array): Categorization tags (e.g., "morning", "exercise", "stressed")
- **ttl** (Number): Auto-expiration timestamp (optional, default: 2 years)

#### Query Patterns
- Get all readings for user: Query with `user_id`
- Get readings in time range: Query with `user_id` and `timestamp` range
- Get recent readings: Query with `user_id`, sort descending, limit N

#### Example Queries
```python
# Get last 30 days of readings
response = dynamodb.query(
    TableName='ecg-poc-blood-pressure',
    KeyConditionExpression='user_id = :uid AND #ts >= :start',
    ExpressionAttributeNames={'#ts': 'timestamp'},
    ExpressionAttributeValues={
        ':uid': user_id,
        ':start': (now - 30 days in ms)
    },
    ScanIndexForward=False  # Descending order
)
```

---

### 3. Weight Table

**Table Name:** `{project}-{env}-weight`
**Purpose:** Track weight measurements over time

#### Primary Key
- **Partition Key:** `user_id` (String) - User identifier
- **Sort Key:** `timestamp` (Number) - Measurement timestamp in milliseconds

#### Attributes
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": 1699123456789,
  "reading_id": "weight-uuid-v4",
  "weight_kg": 75.5,
  "weight_lbs": 166.4,
  "body_fat_percentage": 18.5,
  "bmi": 23.8,
  "muscle_mass_kg": 61.5,
  "water_percentage": 62.0,
  "measurement_time": "morning",
  "conditions": ["fasting", "after_bathroom"],
  "device_used": "Withings Body+",
  "notes": "Feeling good, regular exercise routine",
  "tags": ["weekly_check"],
  "ttl": 1762195456
}
```

#### Field Descriptions
- **weight_kg** (Number): Weight in kilograms (required)
- **weight_lbs** (Number): Weight in pounds (optional, can be calculated)
- **body_fat_percentage** (Number): Body fat % (if smart scale available)
- **bmi** (Number): Body Mass Index (can be calculated from height + weight)
- **muscle_mass_kg** (Number): Muscle mass in kg (if available)
- **water_percentage** (Number): Body water percentage
- **measurement_time** (String): morning | evening | midday
- **conditions** (Array): Measurement conditions (e.g., "fasting", "after_exercise")
- **ttl** (Number): Auto-expiration timestamp (optional, default: 2 years)

#### Query Patterns
- Get all weight records: Query with `user_id`
- Get weight trends: Query with `user_id` and time range
- Calculate weight change: Query first and last measurements in period

---

### 4. Health Journal Table

**Table Name:** `{project}-{env}-health-journal`
**Purpose:** Store daily health notes, mood tracking, and symptom logs

#### Primary Key
- **Partition Key:** `user_id` (String) - User identifier
- **Sort Key:** `timestamp` (Number) - Entry timestamp in milliseconds

#### Attributes
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": 1699123456789,
  "entry_id": "journal-uuid-v4",
  "entry_type": "daily_log",
  "mood": {
    "rating": 7,
    "scale": 10,
    "description": "positive",
    "notes": "Feeling energetic and focused"
  },
  "symptoms": [
    {
      "name": "headache",
      "severity": 3,
      "duration_hours": 2,
      "notes": "Mild tension headache, resolved with water"
    }
  ],
  "sleep": {
    "hours": 7.5,
    "quality": "good",
    "woke_up_count": 1
  },
  "exercise": {
    "activities": ["running"],
    "duration_minutes": 30,
    "intensity": "moderate"
  },
  "diet_notes": "Ate healthy, avoided caffeine after 2pm",
  "medications_taken": [
    {
      "name": "lisinopril",
      "dosage": "10mg",
      "time": "08:00"
    }
  ],
  "stress_level": {
    "rating": 4,
    "scale": 10,
    "triggers": ["work_deadline"]
  },
  "health_notes": "Blood pressure seems more stable. Continuing morning walks.",
  "tags": ["routine_day", "work_stress"],
  "ttl": 1762195456
}
```

#### Field Descriptions
- **entry_type** (String): daily_log | symptom_report | medication_log | doctor_visit
- **mood** (Object): Mood tracking with rating and notes
- **symptoms** (Array): List of symptoms with severity and duration
- **sleep** (Object): Sleep duration and quality metrics
- **exercise** (Object): Physical activity tracking
- **diet_notes** (String): Dietary observations
- **medications_taken** (Array): Daily medication log
- **stress_level** (Object): Stress rating and triggers
- **health_notes** (String): General health observations
- **tags** (Array): Custom categorization tags
- **ttl** (Number): Auto-expiration timestamp (optional, default: 5 years)

#### Query Patterns
- Get all journal entries: Query with `user_id`
- Get entries by date range: Query with `user_id` and `timestamp` range
- Search for symptom patterns: Query then filter by `symptoms` array
- Mood trends analysis: Query range and aggregate `mood.rating`

#### Example Queries
```python
# Get last 7 days of journal entries
response = dynamodb.query(
    TableName='ecg-poc-health-journal',
    KeyConditionExpression='user_id = :uid AND #ts >= :start',
    ExpressionAttributeNames={'#ts': 'timestamp'},
    ExpressionAttributeValues={
        ':uid': user_id,
        ':start': (now - 7 days in ms)
    },
    ScanIndexForward=False
)

# Get entries with specific tag
response = dynamodb.query(
    TableName='ecg-poc-health-journal',
    KeyConditionExpression='user_id = :uid',
    FilterExpression='contains(tags, :tag)',
    ExpressionAttributeValues={
        ':uid': user_id,
        ':tag': 'doctor_visit'
    }
)
```

---

## Integration with ECG Data

### Updated Sessions Table

The `ecg-sessions` table now includes a `user_id` attribute and a new Global Secondary Index:

**New GSI:** `UserIndex`
- **Partition Key:** `user_id`
- **Sort Key:** `start_timestamp`
- **Projection:** ALL

This allows querying all ECG sessions for a specific user:
```python
response = dynamodb.query(
    TableName='ecg-poc-sessions',
    IndexName='UserIndex',
    KeyConditionExpression='user_id = :uid',
    ExpressionAttributeValues={':uid': user_id}
)
```

### Holistic Health View

By linking ECG data with health metrics, you can:

1. **Correlate ECG patterns with lifestyle**
   - Compare heart rate variability with sleep quality
   - Identify stress impact on cardiac metrics
   - Track exercise effects on heart health

2. **Identify trends and triggers**
   - Blood pressure spikes with mood/stress levels
   - Weight changes impacting heart rate
   - Medication effects on ECG readings

3. **Generate comprehensive health reports**
   ```python
   # Example: Get all health data for a user in a date range
   user_data = {
       'profile': get_user(user_id),
       'ecg_sessions': query_sessions_by_user(user_id, start, end),
       'blood_pressure': query_bp_readings(user_id, start, end),
       'weight': query_weight_readings(user_id, start, end),
       'journal': query_journal_entries(user_id, start, end)
   }
   ```

---

## Data Retention and TTL

### Default TTL Settings

| Table | Default Retention | TTL Field |
|-------|------------------|-----------|
| users | Permanent | No TTL |
| blood-pressure | 2 years | ttl |
| weight | 2 years | ttl |
| health-journal | 5 years | ttl |
| sessions | 90 days | ttl |

### Setting TTL Values

TTL values are Unix timestamps in seconds (not milliseconds):
```python
import time

# Set TTL to 2 years from now
ttl_value = int(time.time()) + (2 * 365 * 24 * 60 * 60)

# Add to item
item['ttl'] = ttl_value
```

DynamoDB will automatically delete items after the TTL expires (typically within 48 hours of expiration).

---

## Security and Privacy

### Encryption
- All tables use AWS-managed server-side encryption (SSE)
- Data encrypted at rest using AES-256
- Encryption keys managed by AWS KMS

### Access Control
Ensure Lambda functions and applications have appropriate IAM permissions:
```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:GetItem",
    "dynamodb:PutItem",
    "dynamodb:Query",
    "dynamodb:UpdateItem"
  ],
  "Resource": [
    "arn:aws:dynamodb:region:account:table/{project}-{env}-users",
    "arn:aws:dynamodb:region:account:table/{project}-{env}-blood-pressure",
    "arn:aws:dynamodb:region:account:table/{project}-{env}-weight",
    "arn:aws:dynamodb:region:account:table/{project}-{env}-health-journal"
  ]
}
```

### PHI/PII Considerations
These tables contain Protected Health Information (PHI) and Personally Identifiable Information (PII):
- Ensure HIPAA compliance if applicable
- Implement proper access controls
- Enable CloudTrail logging for audit trails
- Consider enabling Point-in-Time Recovery for production environments

---

## Deployment

### Terraform Apply

To create/update these tables:

```bash
cd terraform/environments/poc
terraform plan
terraform apply
```

### Table Name Outputs

After deployment, table names are available as Terraform outputs:
```bash
terraform output users_table
terraform output blood_pressure_table
terraform output weight_table
terraform output health_journal_table
```

### Migration from Existing Systems

If migrating data from an existing system:
1. Export data in JSON format
2. Transform to match the schema above
3. Use AWS Data Pipeline or custom scripts to bulk load
4. Set appropriate TTL values during import

---

## Usage Examples

### Python (Boto3)

```python
import boto3
import time
import uuid
from datetime import datetime

dynamodb = boto3.resource('dynamodb')

# Add blood pressure reading
bp_table = dynamodb.Table('ecg-poc-blood-pressure')
bp_table.put_item(Item={
    'user_id': user_id,
    'timestamp': int(time.time() * 1000),
    'reading_id': str(uuid.uuid4()),
    'systolic': 120,
    'diastolic': 80,
    'pulse': 72,
    'measurement_position': 'sitting',
    'notes': 'Morning reading',
    'ttl': int(time.time()) + (365 * 24 * 60 * 60)
})

# Add health journal entry
journal_table = dynamodb.Table('ecg-poc-health-journal')
journal_table.put_item(Item={
    'user_id': user_id,
    'timestamp': int(time.time() * 1000),
    'entry_id': str(uuid.uuid4()),
    'entry_type': 'daily_log',
    'mood': {
        'rating': 8,
        'description': 'positive',
        'notes': 'Feeling great after morning run'
    },
    'health_notes': 'Energy levels high, no symptoms',
    'tags': ['exercise_day'],
    'ttl': int(time.time()) + (5 * 365 * 24 * 60 * 60)
})

# Query recent readings
response = bp_table.query(
    KeyConditionExpression='user_id = :uid',
    ExpressionAttributeValues={':uid': user_id},
    Limit=10,
    ScanIndexForward=False
)
readings = response['Items']
```

---

## Monitoring and Observability

### CloudWatch Metrics to Monitor

- **Read/Write Capacity:** Monitor throttling
- **User Errors:** Track validation failures
- **System Errors:** Monitor DynamoDB service issues
- **Item Count:** Track table growth
- **TTL Deletions:** Monitor automatic deletions

### Alarms to Set

1. **High Error Rate:** > 1% of requests fail
2. **Read/Write Throttling:** Any throttled requests
3. **Table Size:** Unusual growth patterns
4. **User Errors:** Spike in client-side errors

---

## Future Enhancements

Consider adding:

1. **Activity Table:** Detailed exercise/activity tracking
2. **Medication Table:** Comprehensive medication management
3. **Lab Results Table:** Store clinical lab test results
4. **Doctor Visits Table:** Track appointments and diagnoses
5. **Nutrition Table:** Detailed meal and calorie tracking
6. **Glucose Readings Table:** For diabetic users
7. **Sleep Data Table:** Detailed sleep stages and metrics

---

## Related Documentation

- [DATA_FLOW.md](./DATA_FLOW.md) - ECG data pipeline and processing
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overall system architecture
- [terraform/modules/storage/](./terraform/modules/storage/) - Infrastructure code
