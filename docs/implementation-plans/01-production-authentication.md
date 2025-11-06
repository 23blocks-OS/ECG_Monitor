# Production Authentication Implementation Plan

## Current State
**Status:** Development mode only - any credentials work
**Risk:** Cannot safely deploy multi-user production system
**Priority:** 🔴 **CRITICAL - Blocks all production deployments**

---

## Recommended Solution: AWS Cognito

**Why Cognito:**
- Native AWS integration (already using AWS infrastructure)
- HIPAA-eligible service with BAA available
- Handles user pools, MFA, password policies, federation
- JWT tokens work seamlessly with API Gateway
- Pricing: ~$0.0055/user/month (very affordable)
- No need to build/maintain auth infrastructure

**Alternative Options:**
- Auth0 (easier but adds external dependency)
- Custom OAuth2 + Lambda (more work, harder to secure)
- Firebase Auth (vendor diversification but less AWS-integrated)

---

## Implementation Plan

### Phase 1: AWS Cognito Setup (Week 1)

#### Step 1.1: Create Cognito Infrastructure (Day 1-2)

**Add to Terraform** (`terraform/modules/cognito/main.tf`):

```hcl
# Cognito User Pool
resource "aws_cognito_user_pool" "ecg_monitor_users" {
  name = "${var.environment}-ecg-monitor-users"

  # Password policy
  password_policy {
    minimum_length    = 12
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = true
    temporary_password_validity_days = 7
  }

  # MFA configuration
  mfa_configuration = "OPTIONAL"

  # Required attributes
  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = false
  }

  schema {
    name                = "name"
    attribute_data_type = "String"
    required            = true
    mutable             = true
  }

  # Custom attributes
  schema {
    name                     = "organization_id"
    attribute_data_type      = "String"
    required                 = false
    mutable                  = true
    string_attribute_constraints {
      max_length = 256
    }
  }

  schema {
    name                = "role"
    attribute_data_type = "String"
    required            = false
    mutable             = true
    string_attribute_constraints {
      max_length = 50
    }
  }

  # Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Email configuration
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # Advanced security (bot detection, rate limiting)
  user_pool_add_ons {
    advanced_security_mode = "ENFORCED"
  }

  tags = {
    Environment = var.environment
    Project     = "ECG Monitor"
  }
}

# User Pool Client (for web dashboards)
resource "aws_cognito_user_pool_client" "dashboard_client" {
  name         = "${var.environment}-dashboard-client"
  user_pool_id = aws_cognito_user_pool.ecg_monitor_users.id

  # Token validity
  access_token_validity  = 1  # 1 hour
  id_token_validity      = 1  # 1 hour
  refresh_token_validity = 30 # 30 days

  # OAuth flows
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]

  # Prevent secret (for public web apps)
  generate_secret = false

  # Allowed OAuth scopes
  allowed_oauth_flows = ["code", "implicit"]
  allowed_oauth_scopes = ["email", "openid", "profile"]
  allowed_oauth_flows_user_pool_client = true

  # Callback URLs (update with your dashboard URLs)
  callback_urls = [
    "http://localhost:3000/callback",
    "https://${var.dashboard_domain}/callback"
  ]

  logout_urls = [
    "http://localhost:3000/",
    "https://${var.dashboard_domain}/"
  ]
}

# User Pool Domain (for hosted UI)
resource "aws_cognito_user_pool_domain" "ecg_monitor_domain" {
  domain       = "${var.environment}-ecg-monitor-${random_id.pool_domain.hex}"
  user_pool_id = aws_cognito_user_pool.ecg_monitor_users.id
}

resource "random_id" "pool_domain" {
  byte_length = 4
}

# Outputs
output "user_pool_id" {
  value = aws_cognito_user_pool.ecg_monitor_users.id
}

output "user_pool_client_id" {
  value = aws_cognito_user_pool_client.dashboard_client.id
}

output "cognito_domain" {
  value = aws_cognito_user_pool_domain.ecg_monitor_domain.domain
}
```

#### Step 1.2: Update API Gateway for JWT Validation (Day 2)

**Add Cognito Authorizer** (`terraform/modules/api-gateway/main.tf`):

```hcl
# Cognito Authorizer for API Gateway
resource "aws_apigatewayv2_authorizer" "cognito_authorizer" {
  api_id           = aws_apigatewayv2_api.ecg_api.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "cognito-authorizer"

  jwt_configuration {
    audience = [var.cognito_user_pool_client_id]
    issuer   = "https://cognito-idp.${var.aws_region}.amazonaws.com/${var.cognito_user_pool_id}"
  }
}

# Update routes to require authorization
resource "aws_apigatewayv2_route" "api_routes" {
  for_each = {
    "GET /api/live"     = "get-live"
    "GET /api/history"  = "get-history"
    "GET /api/alerts"   = "get-alerts"
    "GET /api/analysis" = "get-analysis"
  }

  api_id             = aws_apigatewayv2_api.ecg_api.id
  route_key          = each.key
  target             = "integrations/${aws_apigatewayv2_integration.lambda_integration[each.value].id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito_authorizer.id
}
```

### Phase 2: Frontend Integration (Week 1-2)

#### Step 2.1: Install Amplify Libraries

```bash
cd dashboard-next
npm install @aws-amplify/auth @aws-amplify/core

cd ../dashboard-org
npm install @aws-amplify/auth @aws-amplify/core
```

#### Step 2.2: Configure Amplify (`dashboard-next/src/lib/auth.ts`)

```typescript
import { Amplify } from '@aws-amplify/core';
import { Auth } from '@aws-amplify/auth';

// Configure Amplify
Amplify.configure({
  Auth: {
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
    userPoolWebClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
    mandatorySignIn: true,
    authenticationFlowType: 'USER_SRP_AUTH',
  }
});

// Auth helper functions
export const authHelpers = {
  // Sign up new user
  async signUp(email: string, password: string, name: string, organizationId?: string, role?: string) {
    try {
      const { user } = await Auth.signUp({
        username: email,
        password,
        attributes: {
          email,
          name,
          'custom:organization_id': organizationId || '',
          'custom:role': role || 'patient',
        },
      });
      return { success: true, user };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error };
    }
  },

  // Confirm sign up with verification code
  async confirmSignUp(email: string, code: string) {
    try {
      await Auth.confirmSignUp(email, code);
      return { success: true };
    } catch (error) {
      console.error('Confirmation error:', error);
      return { success: false, error };
    }
  },

  // Sign in
  async signIn(email: string, password: string) {
    try {
      const user = await Auth.signIn(email, password);
      return { success: true, user };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error };
    }
  },

  // Sign out
  async signOut() {
    try {
      await Auth.signOut();
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error };
    }
  },

  // Get current authenticated user
  async getCurrentUser() {
    try {
      const user = await Auth.currentAuthenticatedUser();
      return { success: true, user };
    } catch (error) {
      return { success: false, error };
    }
  },

  // Get JWT token for API calls
  async getAccessToken() {
    try {
      const session = await Auth.currentSession();
      return session.getAccessToken().getJwtToken();
    } catch (error) {
      console.error('Token error:', error);
      return null;
    }
  },

  // Get user attributes (including custom attributes)
  async getUserAttributes() {
    try {
      const user = await Auth.currentAuthenticatedUser();
      const attributes = await Auth.userAttributes(user);

      const attributeMap: Record<string, string> = {};
      attributes.forEach(attr => {
        attributeMap[attr.Name] = attr.Value;
      });

      return {
        email: attributeMap.email,
        name: attributeMap.name,
        organizationId: attributeMap['custom:organization_id'],
        role: attributeMap['custom:role'],
      };
    } catch (error) {
      console.error('Get attributes error:', error);
      return null;
    }
  },

  // Change password
  async changePassword(oldPassword: string, newPassword: string) {
    try {
      const user = await Auth.currentAuthenticatedUser();
      await Auth.changePassword(user, oldPassword, newPassword);
      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error };
    }
  },

  // Forgot password (initiate reset)
  async forgotPassword(email: string) {
    try {
      await Auth.forgotPassword(email);
      return { success: true };
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, error };
    }
  },

  // Forgot password submit (with code)
  async forgotPasswordSubmit(email: string, code: string, newPassword: string) {
    try {
      await Auth.forgotPasswordSubmit(email, code, newPassword);
      return { success: true };
    } catch (error) {
      console.error('Forgot password submit error:', error);
      return { success: false, error };
    }
  },

  // Enable MFA
  async enableMFA() {
    try {
      const user = await Auth.currentAuthenticatedUser();
      await Auth.setPreferredMFA(user, 'TOTP');
      return { success: true };
    } catch (error) {
      console.error('Enable MFA error:', error);
      return { success: false, error };
    }
  },
};

export default Auth;
```

#### Step 2.3: Create Auth Components (`dashboard-next/src/components/Auth/`)

**LoginForm.tsx:**
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authHelpers } from '@/lib/auth';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await authHelpers.signIn(email, password);

    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error?.message || 'Sign in failed');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>

      <div className="text-center text-sm">
        <a href="/forgot-password" className="text-blue-600 hover:underline">
          Forgot password?
        </a>
      </div>
    </form>
  );
}
```

**AuthProvider.tsx:**
```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { authHelpers } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface User {
  email: string;
  name: string;
  organizationId: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const result = await authHelpers.getCurrentUser();
    if (result.success) {
      const attributes = await authHelpers.getUserAttributes();
      setUser(attributes);
    }
    setLoading(false);
  }

  async function signOut() {
    await authHelpers.signOut();
    setUser(null);
    router.push('/login');
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

#### Step 2.4: Add JWT to API Calls (`dashboard-next/src/lib/api.ts`)

```typescript
import { authHelpers } from './auth';

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  // Get JWT token
  const token = await authHelpers.getAccessToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  // Add Authorization header
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired, redirect to login
      window.location.href = '/login';
    }
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}
```

### Phase 3: Backend JWT Validation (Week 2)

#### Step 3.1: Update Lambda Functions to Validate JWT

**Lambda Layer for JWT Validation** (`lambda/layers/auth/jwt_validator.py`):

```python
import json
import jwt
import requests
from jwt.algorithms import RSAAlgorithm
from functools import lru_cache

# Cognito configuration (from environment variables)
import os
USER_POOL_ID = os.environ['COGNITO_USER_POOL_ID']
AWS_REGION = os.environ['AWS_REGION']
CLIENT_ID = os.environ['COGNITO_CLIENT_ID']

COGNITO_KEYS_URL = f'https://cognito-idp.{AWS_REGION}.amazonaws.com/{USER_POOL_ID}/.well-known/jwks.json'

@lru_cache(maxsize=1)
def get_cognito_public_keys():
    """Fetch Cognito public keys (cached)"""
    response = requests.get(COGNITO_KEYS_URL)
    return response.json()

def validate_jwt_token(token: str) -> dict:
    """
    Validate JWT token from Cognito
    Returns user claims if valid, raises exception if invalid
    """
    try:
        # Get public keys
        keys = get_cognito_public_keys()

        # Get the kid from token header
        headers = jwt.get_unverified_header(token)
        kid = headers['kid']

        # Find the correct public key
        key = None
        for k in keys['keys']:
            if k['kid'] == kid:
                key = RSAAlgorithm.from_jwk(json.dumps(k))
                break

        if not key:
            raise Exception('Public key not found')

        # Verify token
        claims = jwt.decode(
            token,
            key,
            algorithms=['RS256'],
            audience=CLIENT_ID,
            issuer=f'https://cognito-idp.{AWS_REGION}.amazonaws.com/{USER_POOL_ID}'
        )

        return claims

    except jwt.ExpiredSignatureError:
        raise Exception('Token expired')
    except jwt.InvalidTokenError as e:
        raise Exception(f'Invalid token: {str(e)}')

def get_user_from_event(event: dict) -> dict:
    """
    Extract and validate user from API Gateway event
    Returns user claims
    """
    # Check if authorizer claims are already in event (API Gateway Authorizer)
    if 'requestContext' in event and 'authorizer' in event['requestContext']:
        authorizer = event['requestContext']['authorizer']
        if 'jwt' in authorizer and 'claims' in authorizer['jwt']:
            return authorizer['jwt']['claims']

    # Fallback: manually validate from Authorization header
    headers = event.get('headers', {})
    auth_header = headers.get('Authorization') or headers.get('authorization')

    if not auth_header or not auth_header.startswith('Bearer '):
        raise Exception('No authorization token provided')

    token = auth_header.replace('Bearer ', '')
    claims = validate_jwt_token(token)

    return claims

def require_role(required_roles: list):
    """Decorator to require specific roles"""
    def decorator(func):
        def wrapper(event, context):
            claims = get_user_from_event(event)
            user_role = claims.get('custom:role', 'patient')

            if user_role not in required_roles:
                return {
                    'statusCode': 403,
                    'body': json.dumps({'error': 'Insufficient permissions'})
                }

            return func(event, context, claims)
        return wrapper
    return decorator
```

**Update API Handler Lambda** (`lambda/api-handler/handler.py`):

```python
import json
import os
from jwt_validator import get_user_from_event, require_role

def lambda_handler(event, context):
    """API Gateway handler with authentication"""
    try:
        # Extract and validate user
        user_claims = get_user_from_event(event)

        # Get user information
        user_id = user_claims['sub']  # Cognito user ID
        email = user_claims['email']
        organization_id = user_claims.get('custom:organization_id', '')
        role = user_claims.get('custom:role', 'patient')

        # Route request
        path = event['path']
        method = event['httpMethod']

        if path == '/api/live' and method == 'GET':
            return handle_get_live(user_id, organization_id, role, event)
        elif path == '/api/history' and method == 'GET':
            return handle_get_history(user_id, organization_id, role, event)
        elif path == '/api/alerts' and method == 'GET':
            return handle_get_alerts(user_id, organization_id, role, event)
        else:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Not found'})
            }

    except Exception as e:
        print(f"Authentication error: {str(e)}")
        return {
            'statusCode': 401,
            'body': json.dumps({'error': 'Unauthorized'})
        }

def handle_get_live(user_id, organization_id, role, event):
    """Get live ECG data with user isolation"""
    # Providers can see all patients in their organization
    # Patients can only see their own data

    if role in ['admin', 'doctor', 'nurse']:
        # Provider view: can specify patient_id in query
        query_params = event.get('queryStringParameters', {})
        target_user_id = query_params.get('user_id', user_id)

        # Verify target user is in same organization
        # (implement organization check here)

    else:
        # Patient view: only their own data
        target_user_id = user_id

    # Fetch data for target_user_id
    # ... rest of implementation

    return {
        'statusCode': 200,
        'body': json.dumps({
            'user_id': target_user_id,
            'data': []  # Actual ECG data
        })
    }

# Example: Endpoint that requires admin role
@require_role(['admin'])
def handle_admin_action(event, context, claims):
    """Admin-only endpoint"""
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Admin action completed'})
    }
```

### Phase 4: User Management (Week 2)

#### Step 4.1: Admin User Creation Script

**Create script** (`scripts/create-admin-user.py`):

```python
import boto3
import sys

cognito = boto3.client('cognito-idp')

def create_admin_user(user_pool_id, email, name, organization_id, temporary_password):
    """Create admin user in Cognito"""
    try:
        response = cognito.admin_create_user(
            UserPoolId=user_pool_id,
            Username=email,
            UserAttributes=[
                {'Name': 'email', 'Value': email},
                {'Name': 'email_verified', 'Value': 'true'},
                {'Name': 'name', 'Value': name},
                {'Name': 'custom:organization_id', 'Value': organization_id},
                {'Name': 'custom:role', 'Value': 'admin'},
            ],
            TemporaryPassword=temporary_password,
            MessageAction='SUPPRESS'  # Don't send email (or use 'RESEND' to send)
        )

        print(f"✅ Admin user created: {email}")
        print(f"Temporary password: {temporary_password}")
        print("User will be required to change password on first login")

        return response

    except Exception as e:
        print(f"❌ Error creating user: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) != 6:
        print("Usage: python create-admin-user.py <user_pool_id> <email> <name> <org_id> <temp_password>")
        sys.exit(1)

    create_admin_user(*sys.argv[1:])
```

### Phase 5: Testing & Validation (Week 2-3)

#### Step 5.1: Test Checklist

```markdown
## Authentication Testing Checklist

### User Registration
- [ ] New user can sign up with email/password
- [ ] Verification email sent
- [ ] Verification code works
- [ ] Duplicate email rejected
- [ ] Weak password rejected
- [ ] Custom attributes (organization_id, role) saved correctly

### Sign In / Sign Out
- [ ] Correct credentials work
- [ ] Incorrect password rejected
- [ ] Unverified user cannot sign in
- [ ] Sign out clears session
- [ ] Sign out redirects to login page

### JWT Tokens
- [ ] Access token included in API requests
- [ ] API Gateway validates JWT correctly
- [ ] Lambda receives user claims
- [ ] Expired token rejected (test after 1 hour)
- [ ] Invalid token rejected
- [ ] Token refresh works (after 1 hour with refresh token)

### Authorization / Role-Based Access
- [ ] Patient can only see own data
- [ ] Doctor can see all patients in organization
- [ ] Admin can manage users
- [ ] Cross-organization access blocked
- [ ] Role validation works in Lambda

### Password Management
- [ ] Password change works
- [ ] Forgot password flow works
- [ ] Reset email received
- [ ] Reset code works
- [ ] Temporary password forces change on first login

### MFA (Optional)
- [ ] User can enable TOTP MFA
- [ ] MFA required after enabled
- [ ] MFA code validation works

### Security
- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized
- [ ] Rate limiting works (brute force protection)
- [ ] Account lockout after failed attempts
- [ ] Session timeout works
```

---

## Timeline & Effort

| Phase | Duration | Effort |
|-------|----------|--------|
| Phase 1: Cognito Setup | 2 days | 8-12 hours |
| Phase 2: Frontend Integration | 3-5 days | 16-24 hours |
| Phase 3: Backend JWT Validation | 2-3 days | 12-16 hours |
| Phase 4: User Management | 1-2 days | 4-8 hours |
| Phase 5: Testing & Validation | 3-5 days | 12-20 hours |
| **Total** | **2-3 weeks** | **52-80 hours** |

---

## Post-Implementation Checklist

- [ ] All tests passing
- [ ] Documentation updated (how to create users, manage roles)
- [ ] Environment variables documented
- [ ] Migration plan for any existing dev users
- [ ] Monitoring/alerting for failed auth attempts
- [ ] Password policy documented for users
- [ ] User onboarding flow documented

---

## Cost Impact

**AWS Cognito Pricing:**
- Monthly Active Users (MAU): $0.0055 per MAU
- Example: 100 active users = $0.55/month
- MFA: $0.05 per active MFA user per month
- Advanced security features: Included

**Total Additional Cost:** $1-5/month for small deployments (negligible)

---

## Migration from Dev Mode

If you have existing test users in DynamoDB:

```python
# scripts/migrate-users-to-cognito.py
import boto3

dynamodb = boto3.resource('dynamodb')
cognito = boto3.client('cognito-idp')

def migrate_users(table_name, user_pool_id):
    """Migrate existing users from DynamoDB to Cognito"""
    table = dynamodb.Table(table_name)

    # Scan existing users
    response = table.scan()
    users = response['Items']

    for user in users:
        # Create in Cognito
        try:
            cognito.admin_create_user(
                UserPoolId=user_pool_id,
                Username=user['email'],
                UserAttributes=[
                    {'Name': 'email', 'Value': user['email']},
                    {'Name': 'name', 'Value': user.get('name', '')},
                    {'Name': 'custom:organization_id', 'Value': user.get('organization_id', '')},
                    {'Name': 'custom:role', 'Value': user.get('role', 'patient')},
                ],
                TemporaryPassword='TempPassword123!',  # User must change
                MessageAction='SUPPRESS'
            )
            print(f"✅ Migrated: {user['email']}")
        except Exception as e:
            print(f"❌ Failed to migrate {user['email']}: {str(e)}")
```

---

## Security Best Practices

1. **Enable MFA** for admin users (required)
2. **Strong password policy** (already configured above)
3. **Account lockout** after 5 failed attempts (Cognito default)
4. **Token expiration** - 1 hour access tokens, 30 day refresh
5. **HTTPS only** - No plain HTTP allowed
6. **Audit logging** - CloudWatch logs for all auth events
7. **Rate limiting** - API Gateway throttling + Cognito advanced security

---

## Next Steps After Implementation

1. **Add Social Login** (Google, Facebook) - Easy with Cognito
2. **Add SAML/SSO** for enterprise customers
3. **Implement role hierarchy** (e.g., super-admin, org-admin, etc.)
4. **Add user invitation system** (invite users to organization)
5. **Add user management UI** (admin dashboard to create/disable users)

---

**Status:** Ready to implement
**Priority:** 🔴 CRITICAL
**Blockers:** None (all dependencies available)
**Estimated Completion:** 2-3 weeks with focused effort
