# Cognito Authentication Module

This Terraform module creates an AWS Cognito User Pool for ECG Monitor authentication.

## Features

- ✅ User registration with email verification
- ✅ Password policy enforcement (12+ chars, mixed case, numbers, symbols)
- ✅ Optional MFA (TOTP)
- ✅ Advanced security (bot detection, rate limiting)
- ✅ Custom attributes (organization_id, role)
- ✅ OAuth 2.0 / OpenID Connect support
- ✅ JWT token authentication
- ✅ Hosted UI for login/signup

## Usage

```hcl
module "cognito" {
  source = "../../modules/cognito"

  environment        = "poc"
  enable_mfa         = false
  advanced_security  = true

  callback_urls = [
    "https://dashboard.example.com/callback",
    "https://app.example.com/callback"
  ]

  logout_urls = [
    "https://dashboard.example.com/",
    "https://app.example.com/"
  ]

  access_token_validity  = 1   # 1 hour
  id_token_validity      = 1   # 1 hour
  refresh_token_validity = 30  # 30 days

  tags = {
    Project = "ECG Monitor"
    Owner   = "DevOps"
  }
}
```

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| environment | Environment name | `string` | n/a | yes |
| enable_mfa | Enable MFA | `bool` | `false` | no |
| advanced_security | Enable advanced security | `bool` | `true` | no |
| callback_urls | OAuth callback URLs | `list(string)` | `[]` | no |
| logout_urls | OAuth logout URLs | `list(string)` | `[]` | no |
| access_token_validity | Access token validity (hours) | `number` | `1` | no |
| id_token_validity | ID token validity (hours) | `number` | `1` | no |
| refresh_token_validity | Refresh token validity (days) | `number` | `30` | no |

## Outputs

| Name | Description |
|------|-------------|
| user_pool_id | Cognito User Pool ID |
| user_pool_arn | Cognito User Pool ARN |
| user_pool_client_id | User Pool Client ID |
| user_pool_domain | Hosted UI domain |
| cognito_domain_url | Full hosted UI URL |
| cognito_config | Configuration object for Amplify |

## Frontend Configuration

Use the `cognito_config` output to configure AWS Amplify:

```javascript
import { Amplify } from '@aws-amplify/core';

const cognitoConfig = {
  region: 'us-east-1',
  userPoolId: 'us-east-1_ABC123',
  userPoolWebClientId: 'abc123def456',
  // ... (from terraform output)
};

Amplify.configure({
  Auth: cognitoConfig
});
```

## User Management

### Create Admin User

```bash
aws cognito-idp admin-create-user \
  --user-pool-id <user_pool_id> \
  --username admin@example.com \
  --user-attributes \
    Name=email,Value=admin@example.com \
    Name=email_verified,Value=true \
    Name=name,Value="Admin User" \
    Name=custom:organization_id,Value="org-123" \
    Name=custom:role,Value="admin" \
  --temporary-password "TempPassword123!" \
  --message-action SUPPRESS
```

### Bulk Import Users

See `scripts/cognito-bulk-import.py` for bulk user creation.

## Security Considerations

1. **MFA**: Enable for production (`enable_mfa = true`)
2. **Advanced Security**: Always enable in production
3. **Token Expiry**: Use short-lived access tokens (1 hour)
4. **HTTPS Only**: All callback/logout URLs must use HTTPS in production
5. **Password Policy**: Cannot be weakened (enforced minimum requirements)

## Cost

- **Monthly Active Users (MAU)**: $0.0055 per MAU
- **Advanced Security**: Included
- **MFA**: $0.05 per active MFA user/month
- **Example**: 100 users with MFA = $0.55 + $5 = ~$5.55/month

## Monitoring

CloudWatch metrics available:
- `UserAuthentication` - Sign-in attempts
- `UserAuthenticationFailure` - Failed sign-ins
- `UserRegistration` - New user registrations
- `AdvancedSecurityEvents` - Bot/suspicious activity

## References

- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [Cognito Terraform Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cognito_user_pool)
- [AWS Amplify Auth](https://docs.amplify.aws/lib/auth/getting-started/q/platform/js/)
