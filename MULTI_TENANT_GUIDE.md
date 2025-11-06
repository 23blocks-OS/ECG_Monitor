# Multi-Tenant Deployment Guide

## Overview

The ECG Monitor system is designed to support multiple deployment scenarios, from personal home use to large institutional multi-tenant environments. This guide explains how to configure and deploy the system for different use cases.

---

## Deployment Modes

### Mode 1: Personal/Standalone
**Use Case:** Individual user monitoring their own heart health at home

### Mode 2: Small Clinic/Practice
**Use Case:** Small medical practice with 10-100 patients and a few staff members

### Mode 3: Hospital/Multi-Tenant
**Use Case:** Large hospital or multi-facility organization with hundreds/thousands of users

---

## Architecture Overview

### User Hierarchy

```
Organization
    ├─ Users (Patients, Doctors, Nurses, Admins)
    ├─ Devices (ECG monitors)
    └─ Device-User Assignments
```

### Data Flow with User Context

```
ECG Device → Session (with user_id) → Analysis (with user_id) → Alerts (with user_id)
                                                                        ↓
User Profile ← Blood Pressure ← Weight ← Health Journal          Email/Notifications
```

---

## Mode 1: Personal/Standalone Deployment

### Characteristics
- **Users:** 1 (the device owner)
- **Devices:** 1
- **Organizations:** Optional (can use "standalone" or skip)
- **Complexity:** Minimal
- **Authentication:** Optional (local-only)

### Setup Steps

#### 1. Create User Profile
```python
import boto3
import uuid
import time

dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table('ecg-poc-users')

# Create standalone user
user_id = str(uuid.uuid4())
users_table.put_item(Item={
    'user_id': user_id,
    'organization_id': 'standalone',  # or omit this field
    'email': 'user@example.com',
    'first_name': 'John',
    'last_name': 'Doe',
    'date_of_birth': '1985-03-15',
    'role': 'patient',
    'created_at': int(time.time() * 1000),
    'account_status': 'active'
})
```

#### 2. Assign Device to User
```python
device_users_table = dynamodb.Table('ecg-poc-device-users')

device_users_table.put_item(Item={
    'device_id': 'ecg-device-001',
    'user_id': user_id,
    'assignment_id': str(uuid.uuid4()),
    'assignment_timestamp': int(time.time() * 1000),
    'assignment_type': 'permanent',
    'assigned_by': user_id,  # Self-assigned
    'status': 'active',
    'notes': 'Personal home monitoring device'
})
```

#### 3. Configure Device
Store the `user_id` on the Raspberry Pi device:
```bash
# On Raspberry Pi
echo "USER_ID=${user_id}" >> /etc/ecg/config.env
echo "DEVICE_ID=ecg-device-001" >> /etc/ecg/config.env
```

#### 4. Update Lambda Functions
Ensure all ECG data includes `user_id`:
```python
# In Lambda preprocessing handler
session_item = {
    'session_id': session_id,
    'device_id': device_id,
    'user_id': user_id,  # Add this
    'start_timestamp': timestamp,
    # ... other fields
}
```

### Simplified Access Pattern
For standalone mode, you can hardcode the user_id or retrieve it once:
```python
# Get user_id from device_id
response = device_users_table.query(
    KeyConditionExpression='device_id = :did',
    FilterExpression='#status = :active',
    ExpressionAttributeNames={'#status': 'status'},
    ExpressionAttributeValues={
        ':did': device_id,
        ':active': 'active'
    },
    Limit=1
)
user_id = response['Items'][0]['user_id']
```

### Benefits of Standalone Mode
- Minimal configuration
- No organization management
- Direct device-to-user mapping
- Simplified authentication
- Can still access full health tracking features

---

## Mode 2: Small Clinic/Practice Deployment

### Characteristics
- **Users:** 10-100 (patients + staff)
- **Devices:** 5-20
- **Organizations:** 1 organization
- **Complexity:** Medium
- **Authentication:** Required (role-based)

### Setup Steps

#### 1. Create Organization
```python
organizations_table = dynamodb.Table('ecg-poc-organizations')

org_id = str(uuid.uuid4())
organizations_table.put_item(Item={
    'organization_id': org_id,
    'organization_name': 'Downtown Family Clinic',
    'organization_type': 'clinic',
    'address': {
        'street': '456 Main St',
        'city': 'Springfield',
        'state': 'IL',
        'zip': '62701'
    },
    'contact': {
        'email': 'admin@downtownclinic.com',
        'phone': '+1-555-0200'
    },
    'settings': {
        'timezone': 'America/Chicago',
        'max_users': 100,
        'max_devices': 20,
        'retention_days': 365
    },
    'subscription': {
        'plan': 'professional',
        'status': 'active'
    },
    'created_at': int(time.time() * 1000),
    'account_status': 'active'
})
```

#### 2. Create Admin User
```python
admin_id = str(uuid.uuid4())
users_table.put_item(Item={
    'user_id': admin_id,
    'organization_id': org_id,
    'email': 'admin@downtownclinic.com',
    'first_name': 'Jane',
    'last_name': 'Smith',
    'role': 'admin',
    'created_at': int(time.time() * 1000),
    'account_status': 'active'
})
```

#### 3. Create Staff Users
```python
# Doctor
doctor_id = str(uuid.uuid4())
users_table.put_item(Item={
    'user_id': doctor_id,
    'organization_id': org_id,
    'email': 'dr.johnson@downtownclinic.com',
    'first_name': 'Robert',
    'last_name': 'Johnson',
    'role': 'doctor',
    'created_at': int(time.time() * 1000),
    'account_status': 'active'
})

# Nurse
nurse_id = str(uuid.uuid4())
users_table.put_item(Item={
    'user_id': nurse_id,
    'organization_id': org_id,
    'email': 'nurse.williams@downtownclinic.com',
    'first_name': 'Sarah',
    'last_name': 'Williams',
    'role': 'nurse',
    'created_at': int(time.time() * 1000),
    'account_status': 'active'
})
```

#### 4. Create Patient Users
```python
patient_id = str(uuid.uuid4())
users_table.put_item(Item={
    'user_id': patient_id,
    'organization_id': org_id,
    'email': 'john.doe@email.com',
    'first_name': 'John',
    'last_name': 'Doe',
    'date_of_birth': '1975-06-20',
    'role': 'patient',
    'medical_history': {
        'conditions': ['hypertension'],
        'allergies': [],
        'medications': ['lisinopril']
    },
    'created_at': int(time.time() * 1000),
    'account_status': 'active'
})
```

#### 5. Device Management
Assign devices to patients:
```python
# Assign device to patient
device_users_table.put_item(Item={
    'device_id': 'ecg-device-clinic-01',
    'user_id': patient_id,
    'assignment_id': str(uuid.uuid4()),
    'assignment_timestamp': int(time.time() * 1000),
    'assignment_type': 'temporary',
    'assigned_by': nurse_id,
    'status': 'active',
    'notes': 'Assigned for 24-hour Holter monitoring',
    'ttl': int(time.time()) + (24 * 60 * 60)  # Expires in 24 hours
})
```

#### 6. Access Control
Implement role-based access:
```python
def can_access_patient_data(requester_user_id, patient_user_id):
    """Check if user can access patient data"""
    requester = users_table.get_item(Key={'user_id': requester_user_id})['Item']
    patient = users_table.get_item(Key={'user_id': patient_user_id})['Item']

    # Same organization check
    if requester['organization_id'] != patient['organization_id']:
        return False

    # Role-based access
    if requester['role'] in ['admin', 'doctor', 'nurse']:
        return True

    # Patients can only access their own data
    if requester['role'] == 'patient' and requester_user_id == patient_user_id:
        return True

    return False
```

### Workflow Example: Patient Visit

1. **Patient arrives at clinic**
2. **Nurse assigns available device:**
   ```python
   # Find available device
   response = device_users_table.scan(
       FilterExpression='#status = :inactive',
       ExpressionAttributeNames={'#status': 'status'},
       ExpressionAttributeValues={':inactive': 'inactive'}
   )
   available_device = response['Items'][0]['device_id']

   # Assign to patient
   assign_device(available_device, patient_id, assigned_by=nurse_id)
   ```

3. **Patient wears device during exam**
4. **ECG data collected with patient's user_id**
5. **Doctor reviews data:**
   ```python
   # Get patient's ECG sessions
   response = sessions_table.query(
       IndexName='UserIndex',
       KeyConditionExpression='user_id = :uid',
       ExpressionAttributeValues={':uid': patient_id},
       ScanIndexForward=False,
       Limit=10
   )
   ```

6. **Device unassigned after visit:**
   ```python
   unassign_device(available_device, patient_id)
   ```

---

## Mode 3: Hospital/Multi-Tenant Deployment

### Characteristics
- **Organizations:** Multiple (different hospitals/facilities)
- **Users per Org:** 100-10,000+
- **Devices per Org:** 50-500+
- **Complexity:** High
- **Authentication:** Required (SSO, SAML)
- **Features:** Multi-tenancy, data isolation, organization management

### Setup Steps

#### 1. Create Multiple Organizations
```python
# Hospital System A
org_a_id = str(uuid.uuid4())
organizations_table.put_item(Item={
    'organization_id': org_a_id,
    'organization_name': 'University Medical Center',
    'organization_type': 'hospital',
    'settings': {
        'timezone': 'America/New_York',
        'max_users': 5000,
        'max_devices': 200,
        'retention_days': 730
    },
    'subscription': {
        'plan': 'enterprise',
        'status': 'active'
    },
    'created_at': int(time.time() * 1000),
    'account_status': 'active'
})

# Hospital System B
org_b_id = str(uuid.uuid4())
organizations_table.put_item(Item={
    'organization_id': org_b_id,
    'organization_name': 'Regional Health Network',
    'organization_type': 'hospital',
    'settings': {
        'timezone': 'America/Los_Angeles',
        'max_users': 3000,
        'max_devices': 150,
        'retention_days': 730
    },
    'subscription': {
        'plan': 'enterprise',
        'status': 'active'
    },
    'created_at': int(time.time() * 1000),
    'account_status': 'active'
})
```

#### 2. Data Isolation Strategy

**Ensure all queries filter by organization:**
```python
def get_organization_users(organization_id):
    """Get all users in an organization"""
    response = users_table.query(
        IndexName='OrganizationIndex',
        KeyConditionExpression='organization_id = :oid',
        ExpressionAttributeValues={':oid': organization_id}
    )
    return response['Items']

def get_user_data_in_org(user_id, organization_id):
    """Get user data with org verification"""
    user = users_table.get_item(Key={'user_id': user_id})['Item']

    # Verify user belongs to organization
    if user['organization_id'] != organization_id:
        raise PermissionError('User not in organization')

    return user
```

#### 3. Device Pool Management

Hospitals often have device pools per ward/department:
```python
def get_available_devices_in_org(organization_id):
    """Find available devices for an organization"""
    # Get all users in org
    org_users = get_organization_users(organization_id)
    user_ids = [u['user_id'] for u in org_users]

    # Query device assignments
    # (In production, you'd use a more efficient approach)
    all_assignments = device_users_table.scan()

    # Filter active assignments for org users
    active_devices = set()
    for assignment in all_assignments['Items']:
        if assignment['status'] == 'active' and assignment['user_id'] in user_ids:
            active_devices.add(assignment['device_id'])

    # Get all devices and filter out active ones
    # (Assumes you have a devices table)
    return available_devices

def assign_device_from_pool(organization_id, patient_user_id, assigned_by_user_id):
    """Assign an available device from organization pool"""
    available = get_available_devices_in_org(organization_id)

    if not available:
        raise Exception('No devices available')

    device_id = available[0]

    device_users_table.put_item(Item={
        'device_id': device_id,
        'user_id': patient_user_id,
        'assignment_id': str(uuid.uuid4()),
        'assignment_timestamp': int(time.time() * 1000),
        'assignment_type': 'temporary',
        'assigned_by': assigned_by_user_id,
        'status': 'active'
    })

    return device_id
```

#### 4. Multi-Tenant API Design

**Lambda function with organization context:**
```python
import boto3
from functools import wraps

def require_organization(f):
    """Decorator to enforce organization context"""
    @wraps(f)
    def wrapper(event, context):
        # Extract organization from JWT or request
        organization_id = event['requestContext']['authorizer']['organization_id']
        user_id = event['requestContext']['authorizer']['user_id']

        # Verify user belongs to organization
        users_table = boto3.resource('dynamodb').Table('ecg-poc-users')
        user = users_table.get_item(Key={'user_id': user_id})['Item']

        if user['organization_id'] != organization_id:
            return {
                'statusCode': 403,
                'body': 'Forbidden: Organization mismatch'
            }

        # Add to event for handler use
        event['organization_id'] = organization_id
        event['user_id'] = user_id

        return f(event, context)

    return wrapper

@require_organization
def get_patient_ecg_data(event, context):
    """Get ECG data for a patient - organization-scoped"""
    organization_id = event['organization_id']
    requester_user_id = event['user_id']
    patient_user_id = event['pathParameters']['patient_id']

    # Verify patient is in same organization
    users_table = boto3.resource('dynamodb').Table('ecg-poc-users')
    patient = users_table.get_item(Key={'user_id': patient_user_id})['Item']

    if patient['organization_id'] != organization_id:
        return {
            'statusCode': 404,
            'body': 'Patient not found'
        }

    # Check access permissions
    if not can_access_patient_data(requester_user_id, patient_user_id):
        return {
            'statusCode': 403,
            'body': 'Access denied'
        }

    # Get ECG sessions
    sessions_table = boto3.resource('dynamodb').Table('ecg-poc-sessions')
    response = sessions_table.query(
        IndexName='UserIndex',
        KeyConditionExpression='user_id = :uid',
        ExpressionAttributeValues={':uid': patient_user_id}
    )

    return {
        'statusCode': 200,
        'body': json.dumps(response['Items'])
    }
```

#### 5. Organization Admin Portal

Create admin functions for organization management:
```python
def get_organization_stats(organization_id):
    """Get statistics for an organization"""
    # Count users
    users = get_organization_users(organization_id)
    user_count = len(users)

    # Count active sessions
    session_count = 0
    for user in users:
        sessions = sessions_table.query(
            IndexName='UserIndex',
            KeyConditionExpression='user_id = :uid',
            ExpressionAttributeValues={':uid': user['user_id']},
            Select='COUNT'
        )
        session_count += sessions['Count']

    # Count alerts
    alert_count = 0
    for user in users:
        alerts = alerts_table.query(
            IndexName='UserTimestampIndex',
            KeyConditionExpression='user_id = :uid',
            ExpressionAttributeValues={':uid': user['user_id']},
            Select='COUNT'
        )
        alert_count += alerts['Count']

    return {
        'organization_id': organization_id,
        'user_count': user_count,
        'session_count': session_count,
        'alert_count': alert_count
    }
```

---

## Security Considerations

### Data Isolation
- **Always filter by organization_id** in multi-tenant queries
- **Verify organization membership** before granting access
- **Use IAM roles** to restrict cross-organization access

### Authentication & Authorization
- **Standalone:** Optional or simple password
- **Clinic:** Username/password with role-based access
- **Hospital:** SSO (SAML/OAuth) with role-based access

### Audit Logging
Track all data access:
```python
def log_access(user_id, resource_type, resource_id, action, organization_id):
    """Log data access for audit trail"""
    audit_table = boto3.resource('dynamodb').Table('ecg-poc-audit-log')
    audit_table.put_item(Item={
        'log_id': str(uuid.uuid4()),
        'timestamp': int(time.time() * 1000),
        'user_id': user_id,
        'organization_id': organization_id,
        'resource_type': resource_type,
        'resource_id': resource_id,
        'action': action,
        'ip_address': get_client_ip()
    })
```

---

## Migration Paths

### From Standalone to Clinic
1. Create organization
2. Update user with `organization_id`
3. Add staff users
4. Implement authentication
5. Add role-based access control

### From Clinic to Multi-Tenant
1. Audit all queries for organization filtering
2. Implement organization context in all APIs
3. Add organization admin portal
4. Implement data isolation enforcement
5. Add audit logging
6. Test cross-organization access prevention

---

## Best Practices

### 1. Always Use User Context
Never rely solely on `device_id`. Always include `user_id` in all ECG data.

### 2. Device Assignment is Critical
In shared environments, always check device-user assignments before processing data.

### 3. Organization Filtering
In multi-tenant mode, ALWAYS filter by organization_id.

### 4. Role-Based Access
Implement proper role-based access control:
- **Patient:** Can only view their own data
- **Nurse:** Can view patients in their org, can assign devices
- **Doctor:** Can view all patients in their org
- **Admin:** Can manage users and devices in their org
- **Super Admin:** Can manage multiple organizations (use sparingly)

### 5. Device Pool Management
For institutions:
- Track device location (ward, department)
- Implement device checkout/checkin
- Monitor device battery and status
- Schedule device maintenance

### 6. Data Retention
Respect organization-specific retention policies:
```python
# Set TTL based on organization settings
org = organizations_table.get_item(Key={'organization_id': org_id})['Item']
retention_days = org['settings']['retention_days']
ttl = int(time.time()) + (retention_days * 24 * 60 * 60)
```

---

## Deployment Comparison

| Feature | Standalone | Clinic | Hospital/Multi-Tenant |
|---------|-----------|--------|----------------------|
| Organizations | Optional | 1 | Multiple |
| Users | 1 | 10-100 | 100-10,000+ |
| Devices | 1 | 5-20 | 50-500+ |
| Authentication | Optional | Required | Required (SSO) |
| Role-Based Access | No | Yes | Yes |
| Device Sharing | No | Yes | Yes (pools) |
| Data Isolation | N/A | N/A | Critical |
| Audit Logging | Optional | Recommended | Required |
| Organization Admin | No | Optional | Required |

---

## Related Documentation

- [HEALTH_DATA_SCHEMA.md](./HEALTH_DATA_SCHEMA.md) - Database schema details
- [DATA_FLOW.md](./DATA_FLOW.md) - ECG data processing pipeline
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture overview
