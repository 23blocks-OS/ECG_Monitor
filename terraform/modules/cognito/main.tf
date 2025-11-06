# ============================================================================
# AWS Cognito User Pool for ECG Monitor Authentication
# ============================================================================

resource "random_id" "pool_domain" {
  byte_length = 4
}

# Cognito User Pool
resource "aws_cognito_user_pool" "ecg_monitor_users" {
  name = "${var.environment}-ecg-monitor-users"

  # Account recovery settings
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Admin create user configuration
  admin_create_user_config {
    allow_admin_create_user_only = false # Allow self-registration
  }

  # Auto-verified attributes
  auto_verified_attributes = ["email"]

  # Email configuration
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # MFA configuration
  mfa_configuration = var.enable_mfa ? "OPTIONAL" : "OFF"

  # Password policy
  password_policy {
    minimum_length                   = 12
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = true
    temporary_password_validity_days = 7
  }

  # Required standard attributes
  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = false

    string_attribute_constraints {
      min_length = 1
      max_length = 2048
    }
  }

  schema {
    name                = "name"
    attribute_data_type = "String"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 2048
    }
  }

  # Custom attributes for ECG Monitor
  schema {
    name                = "organization_id"
    attribute_data_type = "String"
    required            = false
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    name                = "role"
    attribute_data_type = "String"
    required            = false
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 50
    }
  }

  # User attribute update settings
  user_attribute_update_settings {
    attributes_require_verification_before_update = ["email"]
  }

  # Username attributes (allow email as username)
  username_attributes = ["email"]

  # Username configuration
  username_configuration {
    case_sensitive = false
  }

  # User pool add-ons (advanced security features)
  user_pool_add_ons {
    advanced_security_mode = var.advanced_security ? "ENFORCED" : "OFF"
  }

  # Verification message template
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "ECG Monitor - Verify your email"
    email_message        = "Your ECG Monitor verification code is {####}"
  }

  tags = merge(
    var.tags,
    {
      Name        = "${var.environment}-ecg-monitor-users"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Project     = "ECG Monitor"
    }
  )
}

# Cognito User Pool Client (Web/Mobile App)
resource "aws_cognito_user_pool_client" "web_client" {
  name         = "${var.environment}-ecg-monitor-web-client"
  user_pool_id = aws_cognito_user_pool.ecg_monitor_users.id

  # OAuth settings
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_scopes                 = ["email", "openid", "profile", "aws.cognito.signin.user.admin"]

  # Callback URLs (update with your dashboard URLs)
  callback_urls = concat(
    ["http://localhost:3000/callback"],
    var.callback_urls
  )

  # Logout URLs
  logout_urls = concat(
    ["http://localhost:3000/"],
    var.logout_urls
  )

  # Supported identity providers
  supported_identity_providers = ["COGNITO"]

  # Token validity
  access_token_validity  = var.access_token_validity
  id_token_validity      = var.id_token_validity
  refresh_token_validity = var.refresh_token_validity

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  # Auth flows
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_CUSTOM_AUTH"
  ]

  # Prevent secret generation (public client)
  generate_secret = false

  # Read and write attributes
  read_attributes = [
    "email",
    "email_verified",
    "name",
    "custom:organization_id",
    "custom:role",
  ]

  write_attributes = [
    "email",
    "name",
    "custom:organization_id",
    "custom:role",
  ]

  # Prevent user existence errors
  prevent_user_existence_errors = "ENABLED"
}

# Cognito User Pool Domain
resource "aws_cognito_user_pool_domain" "ecg_monitor_domain" {
  domain       = "${var.environment}-ecg-monitor-${random_id.pool_domain.hex}"
  user_pool_id = aws_cognito_user_pool.ecg_monitor_users.id
}

# Cognito Identity Pool (for AWS credentials if needed)
resource "aws_cognito_identity_pool" "ecg_monitor_identity" {
  count                            = var.create_identity_pool ? 1 : 0
  identity_pool_name               = "${var.environment}_ecg_monitor_identity"
  allow_unauthenticated_identities = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.web_client.id
    provider_name           = aws_cognito_user_pool.ecg_monitor_users.endpoint
    server_side_token_check = true
  }

  tags = merge(
    var.tags,
    {
      Name        = "${var.environment}-ecg-monitor-identity"
      Environment = var.environment
    }
  )
}

# CloudWatch Log Group for Cognito User Pool (for advanced security events)
resource "aws_cloudwatch_log_group" "cognito_logs" {
  count             = var.advanced_security ? 1 : 0
  name              = "/aws/cognito/${aws_cognito_user_pool.ecg_monitor_users.name}"
  retention_in_days = var.log_retention_days

  tags = merge(
    var.tags,
    {
      Name        = "${var.environment}-cognito-logs"
      Environment = var.environment
    }
  )
}
