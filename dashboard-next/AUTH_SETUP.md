# Authentication Setup Guide

This guide walks you through setting up AWS Cognito authentication for the ECG Monitor dashboard.

---

## Overview

The dashboard uses **AWS Cognito** for user authentication with the following features:

- ✅ Email/password authentication with secure password requirements
- ✅ Email verification for new accounts
- ✅ Password reset flow
- ✅ JWT token-based session management
- ✅ Multi-factor authentication (MFA) support
- ✅ Custom user attributes (organization_id, role)
- ✅ Protected routes with role-based access control

---

## Prerequisites

Before setting up authentication, ensure you have:

1. **AWS Account** with appropriate permissions
2. **Terraform** installed (v1.0+)
3. **Node.js** installed (v18+)
4. **Completed Cognito Infrastructure Deployment** (see below)

---

## Step 1: Deploy Cognito Infrastructure

### 1.1 Configure Terraform Variables

Edit `terraform/environments/poc/terraform.tfvars`:

```hcl
# Add these Cognito configuration values
cognito_callback_urls = [
  "http://localhost:3000/callback",           # Local development
  "https://your-dashboard.vercel.app/callback" # Production
]

cognito_logout_urls = [
  "http://localhost:3000/",
  "https://your-dashboard.vercel.app/"
]

# Optional: Enable MFA for production
enable_mfa = false  # Set to true for production

# Optional: Enable advanced security features
advanced_security = true
```

### 1.2 Deploy with Terraform

```bash
cd terraform/environments/poc

# Initialize Terraform (if not already done)
terraform init

# Plan the deployment
terraform plan

# Apply the changes
terraform apply
```

### 1.3 Save Terraform Outputs

After deployment, save these outputs:

```bash
# Get Cognito configuration
terraform output cognito_user_pool_id
terraform output cognito_client_id
terraform output cognito_domain_url

# Get full JSON config for frontend
terraform output -json cognito_config_json
```

---

## Step 2: Configure Dashboard Environment

### 2.1 Create Environment File

```bash
cd dashboard-next

# Copy the example file
cp .env.local.example .env.local
```

### 2.2 Fill in Cognito Values

Edit `.env.local` with your Terraform outputs:

```bash
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX  # From terraform output
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxx       # From terraform output
NEXT_PUBLIC_COGNITO_DOMAIN=https://your-prefix.auth.us-east-1.amazoncognito.com

# Callback URLs (must match Terraform config)
NEXT_PUBLIC_REDIRECT_SIGN_IN=http://localhost:3000/callback
NEXT_PUBLIC_REDIRECT_SIGN_OUT=http://localhost:3000/
```

---

## Step 3: Install Dependencies

```bash
cd dashboard-next

# Install npm packages
npm install

# Install AWS Amplify libraries
npm install @aws-amplify/core @aws-amplify/auth
```

---

## Step 4: Test Authentication

### 4.1 Start Development Server

```bash
npm run dev
```

### 4.2 Test Sign Up Flow

1. Navigate to http://localhost:3000/signup
2. Create a new account with:
   - Full name
   - Email address
   - Strong password (12+ chars, uppercase, lowercase, number, special char)
3. Check your email for verification code
4. Enter the code to verify your account

### 4.3 Test Sign In Flow

1. Navigate to http://localhost:3000/login
2. Sign in with your email and password
3. You should be redirected to http://localhost:3000/dashboard

### 4.4 Test Protected Routes

1. Try accessing http://localhost:3000/dashboard without signing in
   - ✅ Should redirect to `/login`
2. Sign in and access dashboard
   - ✅ Should see your user information

---

## Architecture

### Component Structure

```
dashboard-next/
├── src/
│   ├── lib/
│   │   └── auth.ts              # Amplify auth helper functions
│   └── components/
│       └── Auth/
│           ├── AuthProvider.tsx  # Global auth context
│           ├── LoginForm.tsx     # Login component
│           ├── SignUpForm.tsx    # Registration component
│           ├── ProtectedRoute.tsx # Route protection HOC
│           └── index.ts          # Exports
├── app/
│   ├── layout.tsx               # Wraps app with AuthProvider
│   ├── login/
│   │   └── page.tsx             # Login page
│   ├── signup/
│   │   └── page.tsx             # Signup page
│   └── dashboard/
│       └── page.tsx             # Protected dashboard
└── .env.local                   # Cognito configuration
```

### Authentication Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  LoginForm/SignUp   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   authHelpers       │  (src/lib/auth.ts)
│   - signIn()        │
│   - signUp()        │
│   - getToken()      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  AWS Amplify Auth   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  AWS Cognito        │
│  User Pool          │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  JWT Tokens         │
│  - Access (1 hour)  │
│  - ID (1 hour)      │
│  - Refresh (30 days)│
└─────────────────────┘
```

---

## Usage Examples

### Using Auth in Components

```tsx
import { useAuth } from '@/components/Auth';

function MyComponent() {
  const { user, isAuthenticated, signOut } = useAuth();

  if (!isAuthenticated) {
    return <p>Please sign in</p>;
  }

  return (
    <div>
      <p>Welcome, {user?.name}!</p>
      <p>Email: {user?.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Protecting Routes

```tsx
import { ProtectedRoute } from '@/components/Auth';

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminDashboard />
    </ProtectedRoute>
  );
}
```

### Making Authenticated API Calls

```tsx
import { authHelpers } from '@/lib/auth';

async function fetchECGData() {
  // Get JWT access token
  const token = await authHelpers.getAccessToken();

  // Make API call with Authorization header
  const response = await fetch('https://your-api.com/ecg-data', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return response.json();
}
```

### Getting User Attributes

```tsx
import { authHelpers } from '@/lib/auth';

async function loadUserProfile() {
  const attributes = await authHelpers.getUserAttributes();

  console.log(attributes.email);           // user@example.com
  console.log(attributes.name);            // John Doe
  console.log(attributes.organizationId);  // org-123 (custom attribute)
  console.log(attributes.role);            // clinician (custom attribute)
}
```

---

## Custom User Attributes

The Cognito user pool includes custom attributes for multi-tenancy:

| Attribute | Type | Purpose |
|-----------|------|---------|
| `custom:organization_id` | String | Organization/clinic identifier |
| `custom:role` | String | User role (admin, clinician, viewer) |

### Setting Custom Attributes During Sign Up

```tsx
import { authHelpers } from '@/lib/auth';

const result = await authHelpers.signUp(
  'user@example.com',
  'SecurePassword123!',
  'John Doe',
  'org-healthcare-001',  // organizationId
  'clinician'            // role
);
```

---

## Security Features

### Password Policy

- ✅ Minimum 12 characters
- ✅ Requires uppercase letter
- ✅ Requires lowercase letter
- ✅ Requires number
- ✅ Requires special character

### Multi-Factor Authentication (MFA)

To enable MFA, set `enable_mfa = true` in Terraform variables and redeploy.

Users can set up TOTP MFA:

```tsx
import { authHelpers } from '@/lib/auth';

// Setup TOTP
const { qrCode } = await authHelpers.setupTOTP();
// Display qrCode to user for scanning

// Verify TOTP code
await authHelpers.verifyTOTP('123456');
```

### Advanced Security

When `advanced_security = true` (default), Cognito enables:
- Compromised credentials detection
- Adaptive authentication
- Risk-based security

---

## Troubleshooting

### Common Issues

#### 1. "User pool client does not exist"

**Cause:** Environment variables not set correctly.

**Solution:**
```bash
# Check .env.local has correct values
cat .env.local

# Verify Terraform outputs match
cd terraform/environments/poc
terraform output cognito_client_id
```

#### 2. "Redirect URI mismatch"

**Cause:** Callback URL not in Cognito allowed list.

**Solution:**
```hcl
# Add URL to terraform/environments/poc/terraform.tfvars
cognito_callback_urls = [
  "http://localhost:3000/callback",
  "https://your-production-url.com/callback"
]

# Redeploy
terraform apply
```

#### 3. "Password does not conform to policy"

**Cause:** Password doesn't meet requirements.

**Solution:** Use password with:
- At least 12 characters
- Uppercase, lowercase, number, special character
- Example: `MySecurePass123!`

#### 4. "Session expired"

**Cause:** JWT tokens expired (1 hour for access/ID tokens).

**Solution:** Tokens auto-refresh using refresh token (30 days). Ensure user signs in again after 30 days.

---

## Next Steps

### Integrate with API Gateway

See `docs/implementation-plans/01-production-authentication.md` for:
- API Gateway JWT authorizer setup
- Lambda function token validation
- User isolation (filtering by organization_id)

### User Management

Create admin users and manage roles:

```bash
# See scripts in terraform/modules/cognito/scripts/
./create-admin-user.py --email admin@example.com
./list-users.py --pool-id us-east-1_XXXXXXXXX
```

### Production Deployment

Before production:
1. ✅ Set `enable_mfa = true`
2. ✅ Set `advanced_security = true`
3. ✅ Use production callback URLs
4. ✅ Enable CloudWatch logging
5. ✅ Set up backup user pool

---

## Resources

- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [AWS Amplify Auth Docs](https://docs.amplify.aws/lib/auth/getting-started/q/platform/js/)
- [Implementation Plan](../docs/implementation-plans/01-production-authentication.md)
- [Terraform Module](../terraform/modules/cognito/README.md)

---

## Support

For issues or questions:
1. Check this guide's Troubleshooting section
2. Review implementation plan: `docs/implementation-plans/01-production-authentication.md`
3. Open an issue: https://github.com/23blocks-OS/ECG_Monitor/issues

---

**Last Updated:** November 2025
**Version:** 1.0.0
