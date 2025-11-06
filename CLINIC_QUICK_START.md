# 🏥 Clinic Quick Start Guide

**Get your clinic up and running with ECG monitoring in under 2 hours!**

---

## What You'll Get

✅ **Provider Portal** - For doctors and nurses to monitor all patients
✅ **Patient Portal** - For patients to view their own health data
✅ **Real-time ECG Monitoring** - 3-lead ECG with AI-powered analysis
✅ **100% Free** - No cost for medical institutions, non-profits, and government facilities

---

## Prerequisites

Before you start, make sure you have:

- [ ] AWS Account (with billing enabled)
- [ ] Raspberry Pi 4 + CJMCU-1293 ECG module (for each monitoring device)
- [ ] Computer with terminal access
- [ ] Credit card for AWS (though costs are minimal - ~$25-50/month for small clinics)

---

## Step-by-Step Setup

### 1️⃣ Deploy Cloud Infrastructure (30 minutes)

```bash
# Clone the repository
git clone https://github.com/23blocks-OS/ECG_Monitor.git
cd ECG_Monitor

# Configure AWS credentials
aws configure
# Enter your AWS Access Key, Secret Key, and region (e.g., us-east-1)

# Setup Terraform
cd terraform/environments/poc
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars - add your email and Claude API key
nano terraform.tfvars
```

In `terraform.tfvars`:
```hcl
project_name       = "ecg-clinic"
environment        = "prod"
alert_email        = "admin@yourclinic.com"
anthropic_api_key  = "sk-ant-YOUR-KEY-HERE"  # Get from https://console.anthropic.com/
aws_region         = "us-east-1"
```

```bash
# Deploy infrastructure
terraform init
terraform apply  # Type 'yes' when prompted

# Save outputs
terraform output > ../../deployment-info.txt
```

✅ **Done!** AWS infrastructure is now ready.

---

### 2️⃣ Deploy Provider Portal (15 minutes)

#### Option A: Vercel (Easiest - Free)

```bash
cd ../../../dashboard-org

# Install dependencies
npm install

# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel deploy --prod
```

When prompted:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- What's your project name? `ecg-provider-portal`
- In which directory is your code? `./`
- Want to override settings? **N**

After deployment:
1. Go to Vercel dashboard
2. Click your project → Settings → Environment Variables
3. Add: `NEXT_PUBLIC_API_URL` = `[Your API Gateway URL from terraform output]`
4. Redeploy

✅ **Done!** Your provider portal is live at `https://ecg-provider-portal.vercel.app`

---

### 3️⃣ Deploy Patient Portal (15 minutes)

```bash
cd ../dashboard-next
npm install
vercel deploy --prod
```

Same process as Step 2, but name it `ecg-patient-portal`.

✅ **Done!** Patient portal is live at `https://ecg-patient-portal.vercel.app`

---

### 4️⃣ Create Your Organization (10 minutes)

Save this Python script as `setup-org.py`:

```python
import boto3
import uuid
import time

# Configure for your region
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')

# Create organization
org_table = dynamodb.Table('ecg-prod-organizations')
org_id = str(uuid.uuid4())

org_table.put_item(Item={
    'organization_id': org_id,
    'organization_name': 'Your Clinic Name Here',
    'organization_type': 'clinic',
    'settings': {
        'timezone': 'America/New_York',
        'max_users': 100,
        'max_devices': 20,
        'retention_days': 365
    },
    'subscription': {
        'plan': 'free',
        'status': 'active'
    },
    'created_at': int(time.time() * 1000),
    'account_status': 'active'
})

# Create admin user
users_table = dynamodb.Table('ecg-prod-users')
admin_id = str(uuid.uuid4())

users_table.put_item(Item={
    'user_id': admin_id,
    'organization_id': org_id,
    'email': 'admin@yourclinic.com',
    'first_name': 'Admin',
    'last_name': 'User',
    'role': 'admin',
    'created_at': int(time.time() * 1000),
    'account_status': 'active'
})

# Create a doctor
doctor_id = str(uuid.uuid4())
users_table.put_item(Item={
    'user_id': doctor_id,
    'organization_id': org_id,
    'email': 'doctor@yourclinic.com',
    'first_name': 'Dr. Jane',
    'last_name': 'Smith',
    'role': 'doctor',
    'created_at': int(time.time() * 1000),
    'account_status': 'active'
})

# Create a test patient
patient_id = str(uuid.uuid4())
users_table.put_item(Item={
    'user_id': patient_id,
    'organization_id': org_id,
    'email': 'patient@email.com',
    'first_name': 'John',
    'last_name': 'Doe',
    'date_of_birth': '1975-06-20',
    'role': 'patient',
    'created_at': int(time.time() * 1000),
    'account_status': 'active'
})

print("✅ Setup complete!")
print(f"Organization ID: {org_id}")
print(f"Admin User: admin@yourclinic.com")
print(f"Doctor User: doctor@yourclinic.com")
print(f"Test Patient: patient@email.com ({patient_id})")
print("\nUpdate AuthWrapper.tsx with this org_id for development!")
```

Run it:
```bash
pip3 install boto3
python3 setup-org.py
```

✅ **Done!** Your organization and users are created.

---

### 5️⃣ Configure Authentication (5 minutes)

For now, we'll use development mode (any credentials work).

In production, you'll want to:
1. Implement real authentication (Auth0, AWS Cognito, etc.)
2. Add password management
3. Enable MFA

---

### 6️⃣ Setup Raspberry Pi Device (30 minutes)

On your Raspberry Pi:

```bash
# Install dependencies
sudo apt update
sudo apt install python3-pip git -y

# Clone repository
git clone https://github.com/23blocks-OS/ECG_Monitor.git
cd ECG_Monitor

# Install Python packages
cd pi-collector
pip3 install -r requirements.txt

cd ../pi-streamer
pip3 install -r requirements.txt

# Create certificates directory
mkdir -p ~/certs

# Download AWS IoT certificates
# (Get these from AWS IoT Console → Things → Your Device → Certificates)
# Save as: device.crt, device.key, AmazonRootCA1.pem
```

Configure the device:
```bash
cd ~/ECG_Monitor
cp config-example.yaml config.yaml
nano config.yaml
```

In `config.yaml`:
```yaml
device_id: "ecg-device-001"
user_id: "patient-uuid-from-step-4"

aws:
  iot_endpoint: "YOUR-IOT-ENDPOINT.iot.us-east-1.amazonaws.com"
  region: "us-east-1"

certificates:
  ca: "/home/pi/certs/AmazonRootCA1.pem"
  cert: "/home/pi/certs/device.crt"
  key: "/home/pi/certs/device.key"
```

Start the services:
```bash
# Test run
python3 pi-collector/main.py &
python3 pi-streamer/main.py &

# If working, make them start on boot:
sudo cp systemd/ecg-*.service /etc/systemd/system/
sudo systemctl enable ecg-collector ecg-streamer
sudo systemctl start ecg-collector ecg-streamer
```

✅ **Done!** Your ECG device is streaming data.

---

## 🎉 You're Live!

### Test Your Setup

1. **Provider Portal Test**:
   - Go to `https://ecg-provider-portal.vercel.app`
   - Login with any credentials (dev mode)
   - Search for "John Doe" (your test patient)
   - Click "View ECG Dashboard"
   - You should see live ECG data!

2. **Patient Portal Test**:
   - Go to `https://ecg-patient-portal.vercel.app`
   - View the personal dashboard for the patient
   - See real-time heart metrics

---

## What's Next?

### Add More Patients

```python
import boto3
import uuid
import time

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
users_table = dynamodb.Table('ecg-prod-users')

users_table.put_item(Item={
    'user_id': str(uuid.uuid4()),
    'organization_id': 'YOUR-ORG-ID',  # From setup-org.py output
    'email': 'newpatient@email.com',
    'first_name': 'Jane',
    'last_name': 'Patient',
    'date_of_birth': '1982-03-15',
    'role': 'patient',
    'created_at': int(time.time() * 1000),
    'account_status': 'active'
})
```

### Add More Devices

1. Get another Raspberry Pi + ECG module
2. Create new device in AWS IoT Core
3. Repeat Step 6 with new device_id

### Add Staff Members

```python
# Add a nurse
nurse_id = str(uuid.uuid4())
users_table.put_item(Item={
    'user_id': nurse_id,
    'organization_id': 'YOUR-ORG-ID',
    'email': 'nurse@yourclinic.com',
    'first_name': 'John',
    'last_name': 'Nurse',
    'role': 'nurse',
    'created_at': int(time.time() * 1000),
    'account_status': 'active'
})
```

---

## Costs

**Monthly AWS costs for a small clinic (20 patients, 5 devices)**: ~$25-50

Breakdown:
- DynamoDB: $5-10
- Lambda: $5-10
- IoT Core: $5-10
- S3 + CloudFront: $5-10

**Hardware** (one-time):
- $115 per device (Raspberry Pi + ECG module)

---

## Support

- 📚 **Full Documentation**: [ORGANIZATION_DEPLOYMENT_GUIDE.md](./ORGANIZATION_DEPLOYMENT_GUIDE.md)
- 🐛 **Issues**: [GitHub Issues](https://github.com/23blocks-OS/ECG_Monitor/issues)
- 📧 **Email**: [Your support email]

---

## Important Legal Notice

⚠️ This system is **NOT a medical device** and is **NOT FDA approved**.

It is intended for:
- ✅ Educational purposes
- ✅ Monitoring and wellness
- ✅ Research (with IRB approval)

It is **NOT** intended for:
- ❌ Clinical diagnosis
- ❌ Treatment decisions
- ❌ Emergency response

Always follow standard clinical protocols and use clinical judgment.

---

## License

**100% FREE** for:
- Medical institutions
- Non-profit healthcare organizations
- Government healthcare facilities
- Research institutions

See [LICENSE](./LICENSE) for full terms.

---

**Questions?** Open an issue or check the [full deployment guide](./ORGANIZATION_DEPLOYMENT_GUIDE.md)!

**Enjoying the system?** ⭐ Star the repo on GitHub!
