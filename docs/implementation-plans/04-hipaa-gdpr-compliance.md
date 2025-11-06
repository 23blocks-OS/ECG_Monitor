# HIPAA/GDPR Compliance Implementation Plan

## Current State
**Status:** Foundation in place (encryption, access control) but not compliant
**Risk:** Cannot legally deploy for healthcare in US (HIPAA) or EU (GDPR) without addressing gaps
**Priority:** 🟠 **HIGH - Required for healthcare deployments**

---

## Legal Disclaimer

⚠️ **IMPORTANT**: This document provides technical guidance only. **It is not legal advice**. Before deploying in production for healthcare:
1. Consult with HIPAA/GDPR compliance attorney
2. Conduct formal risk assessment
3. Obtain Business Associate Agreements where required
4. Document all compliance measures

This system is **NOT FDA-approved** and should not be used for clinical diagnosis or treatment decisions.

---

## Compliance Overview

### HIPAA (US Healthcare)

**What it regulates:** Protected Health Information (PHI) for covered entities
**Applies to:** US hospitals, medical practices, health plans, clearinghouses
**Key requirements:**
- Administrative safeguards (policies, training)
- Physical safeguards (facility security)
- Technical safeguards (encryption, access control, audit logs)
- Business Associate Agreements (BAAs)
- Breach notification

### GDPR (EU Data Protection)

**What it regulates:** Personal data of EU residents
**Applies to:** Any organization processing EU resident data, regardless of location
**Key requirements:**
- Lawful basis for processing (consent, legitimate interest, etc.)
- Data minimization
- Right to access, portability, erasure
- Data protection by design and default
- Data breach notification (72 hours)
- Data Processing Agreements (DPAs)

---

## Implementation Plan

### Phase 1: Technical Safeguards (Weeks 1-2)

#### 1.1 Encryption Enhancements

**Already Implemented:**
- ✅ TLS 1.2+ for data in transit
- ✅ S3 server-side encryption (AES-256)
- ✅ DynamoDB encryption at rest

**Still Needed:**

**Add encryption key management** (`terraform/modules/kms/main.tf`):

```hcl
# Customer-Managed KMS Key (required for HIPAA)
resource "aws_kms_key" "ecg_monitor_key" {
  description             = "ECG Monitor encryption key"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name        = "${var.environment}-ecg-monitor-key"
    Environment = var.environment
    HIPAA       = "true"
  }
}

resource "aws_kms_alias" "ecg_monitor_key_alias" {
  name          = "alias/${var.environment}-ecg-monitor"
  target_key_id = aws_kms_key.ecg_monitor_key.key_id
}

# Key policy - restrict access
resource "aws_kms_key_policy" "ecg_monitor_key_policy" {
  key_id = aws_kms_key.ecg_monitor_key.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow services to use key"
        Effect = "Allow"
        Principal = {
          Service = [
            "s3.amazonaws.com",
            "dynamodb.amazonaws.com",
            "lambda.amazonaws.com",
            "logs.amazonaws.com"
          ]
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })
}

output "kms_key_id" {
  value = aws_kms_key.ecg_monitor_key.id
}

output "kms_key_arn" {
  value = aws_kms_key.ecg_monitor_key.arn
}
```

**Update S3 to use KMS** (`terraform/modules/s3/main.tf`):

```hcl
resource "aws_s3_bucket_server_side_encryption_configuration" "ecg_raw_data" {
  bucket = aws_s3_bucket.ecg_raw_data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = var.kms_key_id  # Customer-managed key
    }
    bucket_key_enabled = true
  }
}

# Enable versioning (for data protection and auditability)
resource "aws_s3_bucket_versioning" "ecg_raw_data" {
  bucket = aws_s3_bucket.ecg_raw_data.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Block public access (HIPAA requirement)
resource "aws_s3_bucket_public_access_block" "ecg_raw_data" {
  bucket = aws_s3_bucket.ecg_raw_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

**Update DynamoDB to use KMS**:

```hcl
resource "aws_dynamodb_table" "ecg_sessions" {
  name           = "${var.environment}-ecg-sessions"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "session_id"
  range_key      = "timestamp"

  # Enable encryption with customer-managed key
  server_side_encryption {
    enabled     = true
    kms_key_arn = var.kms_key_arn
  }

  # Enable point-in-time recovery (HIPAA requirement)
  point_in_time_recovery {
    enabled = true
  }

  # ... rest of configuration
}
```

#### 1.2 Enhanced Audit Logging

**Create comprehensive audit trail** (`terraform/modules/cloudtrail/main.tf`):

```hcl
# CloudTrail for API activity logging
resource "aws_cloudtrail" "ecg_monitor_audit" {
  name                          = "${var.environment}-ecg-monitor-audit"
  s3_bucket_name                = aws_s3_bucket.audit_logs.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true  # HIPAA requirement
  kms_key_id                    = var.kms_key_arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::${var.ecg_data_bucket}/*"]
    }

    data_resource {
      type   = "AWS::DynamoDB::Table"
      values = [var.dynamodb_table_arns]
    }
  }

  tags = {
    Name        = "${var.environment}-ecg-audit-trail"
    HIPAA       = "true"
    Environment = var.environment
  }
}

# S3 bucket for audit logs (separate from data buckets)
resource "aws_s3_bucket" "audit_logs" {
  bucket = "${var.environment}-ecg-audit-logs-${random_id.bucket.hex}"

  tags = {
    Name  = "${var.environment}-ecg-audit-logs"
    HIPAA = "true"
  }
}

# Lifecycle policy for audit log retention
resource "aws_s3_bucket_lifecycle_configuration" "audit_logs_lifecycle" {
  bucket = aws_s3_bucket.audit_logs.id

  rule {
    id     = "audit-log-retention"
    status = "Enabled"

    # Move to Glacier after 90 days
    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    # Keep for 7 years (HIPAA requirement: 6 years minimum)
    expiration {
      days = 2555  # ~7 years
    }
  }
}

# Bucket versioning for audit logs (immutability)
resource "aws_s3_bucket_versioning" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Object lock for immutability (prevent deletion/modification)
resource "aws_s3_bucket_object_lock_configuration" "audit_logs_lock" {
  bucket = aws_s3_bucket.audit_logs.id

  rule {
    default_retention {
      mode = "GOVERNANCE"  # Can be overridden by admins
      days = 2555          # 7 years
    }
  }
}
```

**Application-level audit logging** (`lambda/layers/audit/audit_logger.py`):

```python
import json
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
audit_table = dynamodb.Table('ecg-audit-log')

def log_audit_event(event_type, user_id, organization_id, resource_type, resource_id, action, result, details=None):
    """
    Log audit event for compliance

    event_type: 'data_access', 'data_modification', 'user_action', 'system_event'
    action: 'read', 'write', 'update', 'delete', 'export', 'login', 'logout'
    result: 'success', 'failure', 'denied'
    """
    audit_entry = {
        'audit_id': f"{int(datetime.now().timestamp() * 1000)}_{user_id}",
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'event_type': event_type,
        'user_id': user_id,
        'organization_id': organization_id,
        'resource_type': resource_type,
        'resource_id': resource_id,
        'action': action,
        'result': result,
        'details': details or {},
        'ip_address': details.get('ip_address', 'unknown'),
        'user_agent': details.get('user_agent', 'unknown'),
    }

    try:
        audit_table.put_item(Item=audit_entry)
        print(f"Audit log: {json.dumps(audit_entry)}")
    except Exception as e:
        # Never fail on audit logging
        print(f"Failed to write audit log: {e}")

# Example usage in Lambda
def lambda_handler(event, context):
    user_claims = get_user_from_event(event)
    user_id = user_claims['sub']
    organization_id = user_claims['custom:organization_id']

    # Log data access
    log_audit_event(
        event_type='data_access',
        user_id=user_id,
        organization_id=organization_id,
        resource_type='ecg_session',
        resource_id='session-123',
        action='read',
        result='success',
        details={
            'ip_address': event['requestContext']['identity']['sourceIp'],
            'user_agent': event['headers'].get('User-Agent', 'unknown')
        }
    )

    # ... rest of handler
```

#### 1.3 Access Control Enhancements

**Implement least privilege IAM roles** (`terraform/modules/iam/lambda-roles.tf`):

```hcl
# Separate role for each Lambda function (least privilege)

resource "aws_iam_role" "lambda_preprocessor" {
  name = "${var.environment}-lambda-preprocessor-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "lambda_preprocessor_policy" {
  name = "${var.environment}-lambda-preprocessor-policy"
  role = aws_iam_role.lambda_preprocessor.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject"  # Read raw data only
        ]
        Resource = "${var.raw_data_bucket_arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject"  # Write processed data only
        ]
        Resource = "${var.processed_data_bucket_arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ]
        Resource = [
          var.sessions_table_arn,
          var.metrics_table_arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = var.ai_analyzer_queue_arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = var.kms_key_arn
      }
    ]
  })
}
```

### Phase 2: Administrative Safeguards (Weeks 3-4)

#### 2.1 Policies and Procedures Documentation

**Create compliance documentation** (`docs/compliance/`):

```
docs/compliance/
├── HIPAA/
│   ├── 01-security-management-process.md
│   ├── 02-workforce-security.md
│   ├── 03-information-access-management.md
│   ├── 04-security-awareness-training.md
│   ├── 05-incident-response-plan.md
│   ├── 06-contingency-plan.md
│   ├── 07-risk-assessment.md
│   └── 08-business-associate-agreement-template.md
├── GDPR/
│   ├── 01-data-protection-impact-assessment.md
│   ├── 02-data-processing-agreement-template.md
│   ├── 03-privacy-policy.md
│   ├── 04-data-breach-notification-procedure.md
│   ├── 05-data-subject-rights-procedures.md
│   └── 06-records-of-processing-activities.md
└── shared/
    ├── acceptable-use-policy.md
    ├── data-retention-policy.md
    └── incident-response-playbook.md
```

**Example: Risk Assessment Template** (`docs/compliance/HIPAA/07-risk-assessment.md`):

```markdown
# HIPAA Security Risk Assessment

## Purpose
Document security risks to ePHI and implement appropriate safeguards.

## Risk Assessment Methodology

### 1. Asset Inventory
| Asset | Type | Contains ePHI | Criticality |
|-------|------|---------------|-------------|
| S3 raw data bucket | Data Store | Yes | High |
| DynamoDB tables | Data Store | Yes | High |
| Lambda functions | Compute | Yes (processes) | High |
| API Gateway | Network | Yes (transmits) | High |
| Raspberry Pi devices | Edge Device | Yes (collects) | High |
| Web dashboards | Application | Yes (displays) | Medium |

### 2. Threat Identification
| Threat | Likelihood | Impact | Risk Level |
|--------|-----------|--------|------------|
| Unauthorized data access | Medium | High | High |
| Data breach via API | Low | High | Medium |
| Physical device theft | Medium | Medium | Medium |
| Insider threat | Low | High | Medium |
| Ransomware | Low | High | Medium |
| Natural disaster | Low | High | Medium |

### 3. Vulnerability Assessment
| Vulnerability | Affected Asset | Mitigation Status |
|---------------|----------------|-------------------|
| Weak authentication | Web dashboards | ✅ Cognito with MFA |
| Unencrypted data at rest | S3, DynamoDB | ✅ KMS encryption |
| Lack of audit logging | All systems | ✅ CloudTrail + app logs |
| No data backup | DynamoDB | ✅ Point-in-time recovery |
| No incident response plan | Organization | ⏳ In progress |

### 4. Risk Mitigation Plan
[Document for each risk...]

## Approval
- **Prepared by:** [Name, Date]
- **Reviewed by:** [Security Officer, Date]
- **Approved by:** [Privacy Officer, Date]
- **Next Review Date:** [Date + 1 year]
```

#### 2.2 Business Associate Agreements

**Create BAA template** (`docs/compliance/HIPAA/08-business-associate-agreement-template.md`):

```markdown
# Business Associate Agreement (BAA) Template

**IMPORTANT**: This is a template only. Have your attorney review before use.

## Parties
- **Covered Entity**: [Healthcare organization name]
- **Business Associate**: [Your organization name]

## Purpose
Business Associate will provide ECG monitoring services that involve access to Protected Health Information (PHI).

## Definitions
- **PHI**: As defined in 45 CFR § 160.103
- **ePHI**: Electronic Protected Health Information

## Obligations of Business Associate

### 1. Permitted Uses and Disclosures
Business Associate may only use or disclose PHI:
a) To perform services for Covered Entity
b) As required by law
c) For proper management and administration of Business Associate

### 2. Safeguards (45 CFR § 164.308-312)
Business Associate shall:
a) Implement administrative, physical, and technical safeguards
b) Encrypt PHI in transit and at rest
c) Implement access controls and audit logging
d) Train workforce members on PHI handling

### 3. Reporting
Business Associate shall report to Covered Entity:
a) Any security incident within 24 hours
b) Any breach of unsecured PHI within 24 hours
c) Any unauthorized use or disclosure

### 4. Subcontractors
Business Associate shall:
a) Enter into BAAs with subcontractors (e.g., AWS)
b) Ensure subcontractors comply with HIPAA

### 5. Individual Rights
Business Associate shall:
a) Provide access to PHI within 30 days of request
b) Amend PHI as directed by Covered Entity
c) Provide accounting of disclosures

### 6. Return or Destruction of PHI
Upon termination, Business Associate shall:
a) Return or destroy all PHI
b) Provide certification of destruction

## Obligations of Covered Entity
[Define obligations...]

## Term and Termination
[Define term and termination conditions...]

## Liability and Indemnification
[Define liability...]

## Signatures
- **Covered Entity**: _____________________ Date: _______
- **Business Associate**: _________________ Date: _______
```

**AWS BAA**: Sign AWS Business Associate Addendum
- Navigate to: AWS Artifact (in AWS Console)
- Download and sign AWS BAA
- This covers S3, DynamoDB, Lambda, etc.

#### 2.3 Workforce Training

**Create training program** (`docs/compliance/training/`):

```markdown
# HIPAA Security Awareness Training

## Required for all workforce members with access to ePHI

### Module 1: HIPAA Basics (30 minutes)
- What is HIPAA?
- What is PHI/ePHI?
- Privacy Rule vs Security Rule
- Penalties for violations

### Module 2: Security Safeguards (45 minutes)
- Password security (strong passwords, MFA)
- Device security (lock screens, encryption)
- Physical security (don't leave devices unattended)
- Email security (don't email PHI)

### Module 3: Incident Response (30 minutes)
- What is a security incident?
- What is a breach?
- How to report incidents
- Breach notification requirements

### Module 4: Role-Specific Training
**For Developers:**
- Secure coding practices
- Data minimization
- Encryption requirements
- Audit logging

**For System Administrators:**
- Access control management
- Log monitoring
- Backup procedures
- Incident response

### Quiz (Required 80% to pass)
[10-15 questions on key concepts]

### Certification
I certify that I have completed HIPAA security awareness training.

Name: ___________________
Date: ___________________
Signature: ___________________

**Note:** Training must be repeated annually.
```

### Phase 3: GDPR-Specific Implementation (Weeks 4-5)

#### 3.1 Data Subject Rights Implementation

**Right to Access** (`lambda/gdpr/data-access.py`):

```python
import boto3
import json
from datetime import datetime

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

def export_user_data(user_id, organization_id):
    """
    Export all data for a user (GDPR Article 15)
    Returns JSON file with all user data
    """
    user_data = {
        'export_date': datetime.utcnow().isoformat(),
        'user_id': user_id,
        'organization_id': organization_id,
        'data': {}
    }

    # Get user profile
    users_table = dynamodb.Table('users')
    response = users_table.get_item(Key={'user_id': user_id})
    user_data['data']['profile'] = response.get('Item', {})

    # Get ECG sessions
    sessions_table = dynamodb.Table('ecg-sessions')
    response = sessions_table.query(
        IndexName='user_id-index',
        KeyConditionExpression='user_id = :uid',
        ExpressionAttributeValues={':uid': user_id}
    )
    user_data['data']['ecg_sessions'] = response.get('Items', [])

    # Get alerts
    alerts_table = dynamodb.Table('ecg-alerts')
    response = alerts_table.query(
        IndexName='user_id-index',
        KeyConditionExpression='user_id = :uid',
        ExpressionAttributeValues={':uid': user_id}
    )
    user_data['data']['alerts'] = response.get('Items', [])

    # Get AI analysis results
    analysis_table = dynamodb.Table('ecg-analysis')
    response = analysis_table.query(
        IndexName='user_id-index',
        KeyConditionExpression='user_id = :uid',
        ExpressionAttributeValues={':uid': user_id}
    )
    user_data['data']['ai_analysis'] = response.get('Items', [])

    # Get health journal
    journal_table = dynamodb.Table('health-journal')
    response = journal_table.query(
        IndexName='user_id-index',
        KeyConditionExpression='user_id = :uid',
        ExpressionAttributeValues={':uid': user_id}
    )
    user_data['data']['health_journal'] = response.get('Items', [])

    # Get audit logs (redacted)
    audit_table = dynamodb.Table('ecg-audit-log')
    response = audit_table.query(
        IndexName='user_id-index',
        KeyConditionExpression='user_id = :uid',
        ExpressionAttributeValues={':uid': user_id}
    )
    user_data['data']['access_history'] = response.get('Items', [])

    # Save export to S3
    export_key = f"gdpr-exports/{user_id}/{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}.json"
    s3.put_object(
        Bucket='ecg-gdpr-exports',
        Key=export_key,
        Body=json.dumps(user_data, indent=2, default=str),
        ServerSideEncryption='aws:kms',
        KMSKeyId=os.environ['KMS_KEY_ID']
    )

    # Generate pre-signed URL (valid for 7 days)
    download_url = s3.generate_presigned_url(
        'get_object',
        Params={'Bucket': 'ecg-gdpr-exports', 'Key': export_key},
        ExpiresIn=604800  # 7 days
    )

    return {
        'export_key': export_key,
        'download_url': download_url,
        'expires_at': (datetime.utcnow() + timedelta(days=7)).isoformat()
    }
```

**Right to Erasure** (`lambda/gdpr/data-deletion.py`):

```python
def delete_user_data(user_id, organization_id, deletion_reason):
    """
    Delete all user data (GDPR Article 17 - Right to be Forgotten)

    IMPORTANT: Some data may need to be retained for legal reasons
    (e.g., financial records, legal holds)
    """

    # Log deletion request
    log_audit_event(
        event_type='gdpr_deletion',
        user_id=user_id,
        organization_id=organization_id,
        resource_type='user_data',
        resource_id=user_id,
        action='delete',
        result='initiated',
        details={'reason': deletion_reason}
    )

    deletion_report = {
        'user_id': user_id,
        'deletion_date': datetime.utcnow().isoformat(),
        'reason': deletion_reason,
        'deleted_items': [],
        'retained_items': []
    }

    # Delete user profile
    users_table = dynamodb.Table('users')
    users_table.delete_item(Key={'user_id': user_id})
    deletion_report['deleted_items'].append('user_profile')

    # Delete ECG sessions metadata
    sessions_table = dynamodb.Table('ecg-sessions')
    response = sessions_table.query(
        IndexName='user_id-index',
        KeyConditionExpression='user_id = :uid',
        ExpressionAttributeValues={':uid': user_id}
    )
    for session in response.get('Items', []):
        sessions_table.delete_item(Key={'session_id': session['session_id']})

        # Delete S3 raw data
        s3_key = session.get('s3_key')
        if s3_key:
            s3.delete_object(Bucket='ecg-raw-data', Key=s3_key)

    deletion_report['deleted_items'].append(f"ecg_sessions (count: {len(response.get('Items', []))})")

    # Delete alerts
    alerts_table = dynamodb.Table('ecg-alerts')
    response = alerts_table.query(
        IndexName='user_id-index',
        KeyConditionExpression='user_id = :uid',
        ExpressionAttributeValues={':uid': user_id}
    )
    for alert in response.get('Items', []):
        alerts_table.delete_item(Key={'alert_id': alert['alert_id']})
    deletion_report['deleted_items'].append(f"alerts (count: {len(response.get('Items', []))})")

    # Similar for other tables...

    # RETAIN audit logs (legal requirement)
    deletion_report['retained_items'].append('audit_logs (legal retention requirement)')

    # Save deletion report
    deletion_table = dynamodb.Table('gdpr-deletion-log')
    deletion_table.put_item(Item=deletion_report)

    # Log completion
    log_audit_event(
        event_type='gdpr_deletion',
        user_id=user_id,
        organization_id=organization_id,
        resource_type='user_data',
        resource_id=user_id,
        action='delete',
        result='completed',
        details=deletion_report
    )

    return deletion_report
```

#### 3.2 Privacy Policy & Consent

**Create privacy policy** (`website/privacy-policy.html`):

```html
<!-- Include comprehensive privacy policy covering:
- What data is collected
- How data is used
- Who data is shared with
- Data retention periods
- User rights (access, rectification, erasure, portability)
- Contact information for Data Protection Officer
- Cookie policy
- Changes to privacy policy
-->
```

**Implement consent tracking**:

```typescript
// dashboard-next/src/lib/consent.ts
export async function getConsentStatus(userId: string) {
  // Check if user has consented to data processing
  const response = await apiCall(`/api/consent/${userId}`);
  return response.consent;
}

export async function recordConsent(userId: string, consentType: string) {
  // Record consent with timestamp and IP
  await apiCall(`/api/consent`, {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      consent_type: consentType,
      timestamp: new Date().toISOString(),
      ip_address: await fetch('https://api.ipify.org?format=json').then(r => r.json()).then(d => d.ip)
    })
  });
}
```

#### 3.3 Data Breach Notification

**Create breach notification procedure** (`docs/compliance/shared/breach-notification-procedure.md`):

```markdown
# Data Breach Notification Procedure

## Detection
Breach detected by: [monitoring, report, etc.]

## Assessment (within 4 hours)
1. Determine if breach occurred
2. Identify affected individuals
3. Assess severity and scope
4. Contain breach immediately

## Notification Timeline

### HIPAA (US)
- **60 days** from discovery:
  - Notify affected individuals (letter or email)
  - If >500 individuals, notify HHS and media

### GDPR (EU)
- **72 hours** from discovery:
  - Notify supervisory authority (Data Protection Authority)
- **Without undue delay**:
  - Notify affected data subjects (if high risk)

## Breach Notification Template

**Subject: Important Security Notice**

Dear [Name],

We are writing to inform you of a data security incident that may have affected your personal information.

**What Happened:**
[Description of breach]

**What Information Was Involved:**
[Types of data affected]

**What We Are Doing:**
[Steps taken to contain and remediate]

**What You Can Do:**
[Recommendations for affected individuals]

**Contact Information:**
[Contact details for questions]

We take the security of your information seriously and apologize for any concern this may cause.

Sincerely,
[Organization]
```

---

## Timeline & Effort

| Phase | Duration | Effort | Cost |
|-------|----------|--------|------|
| Phase 1: Technical Safeguards | 2 weeks | 40-60 hours | Minimal |
| Phase 2: Administrative Safeguards | 2 weeks | 30-40 hours | $2K-5K (legal review) |
| Phase 3: GDPR Implementation | 1 week | 20-30 hours | Minimal |
| Legal Review & BAAs | 2-4 weeks | N/A | $5K-15K |
| **Total** | **7-9 weeks** | **90-130 hours** | **$7K-20K** |

Note: Legal costs can vary significantly based on attorney rates and complexity.

---

## Cost Impact

**AWS Services:**
- KMS: $1/key/month + $0.03/10,000 requests
- CloudTrail: $2/100,000 events
- S3 audit logs storage: $5-20/month
- **Total:** $10-30/month additional

**Legal/Consulting:**
- HIPAA attorney review: $5,000-10,000
- GDPR attorney review: $3,000-5,000
- Annual compliance audit: $5,000-15,000

---

## Compliance Checklist

### HIPAA Technical Safeguards
- [ ] Unique user identification (Cognito)
- [ ] Emergency access procedure documented
- [ ] Automatic logoff (session timeout)
- [ ] Encryption and decryption (KMS)
- [ ] Audit controls (CloudTrail + application logs)
- [ ] Integrity controls (checksums, versioning)
- [ ] Transmission security (TLS 1.2+)

### HIPAA Administrative Safeguards
- [ ] Security management process documented
- [ ] Risk assessment completed
- [ ] Workforce security policies
- [ ] Security awareness training program
- [ ] Incident response plan
- [ ] Contingency plan (backup & disaster recovery)
- [ ] Business associate agreements signed

### GDPR Requirements
- [ ] Privacy policy published
- [ ] Consent mechanism implemented
- [ ] Data subject rights procedures
- [ ] Data protection impact assessment
- [ ] Data processing agreements
- [ ] Breach notification procedures
- [ ] Data retention policies
- [ ] Right to access (data export)
- [ ] Right to erasure (deletion)
- [ ] Data portability

### Organizational
- [ ] Designate Security Officer
- [ ] Designate Privacy Officer / DPO
- [ ] Designate Incident Response Team
- [ ] Train all workforce members
- [ ] Conduct annual risk assessments
- [ ] Review and update policies annually

---

## Post-Implementation

### Annual Requirements
1. **Risk Assessment** (HIPAA) - Every 12 months
2. **Workforce Training** - Annual refresher for all staff
3. **Policy Review** - Update policies and procedures
4. **Penetration Testing** - Annual security assessment
5. **Compliance Audit** - Internal or external audit

### Ongoing Monitoring
1. Review CloudTrail logs weekly
2. Monitor CloudWatch alarms for security events
3. Review access logs for anomalies
4. Test incident response procedures quarterly
5. Test backup/recovery procedures quarterly

---

## Key Contacts

- **Security Officer:** [Name, Email]
- **Privacy Officer:** [Name, Email]
- **HIPAA Attorney:** [Firm, Contact]
- **GDPR Attorney:** [Firm, Contact]
- **Compliance Consultant:** [Name, Contact]

---

**Status:** Ready to implement
**Priority:** 🟠 HIGH (for healthcare deployments)
**Blockers:** Need legal review before production
**Estimated Completion:** 7-9 weeks + legal review time
