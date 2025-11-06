# ============================================================================
# Outputs from Cognito Module
# ============================================================================

output "user_pool_id" {
  description = "The ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.ecg_monitor_users.id
}

output "user_pool_arn" {
  description = "The ARN of the Cognito User Pool"
  value       = aws_cognito_user_pool.ecg_monitor_users.arn
}

output "user_pool_endpoint" {
  description = "The endpoint of the Cognito User Pool"
  value       = aws_cognito_user_pool.ecg_monitor_users.endpoint
}

output "user_pool_client_id" {
  description = "The ID of the Cognito User Pool Client"
  value       = aws_cognito_user_pool_client.web_client.id
}

output "user_pool_client_secret" {
  description = "The secret of the Cognito User Pool Client (if applicable)"
  value       = aws_cognito_user_pool_client.web_client.client_secret
  sensitive   = true
}

output "user_pool_domain" {
  description = "The domain of the Cognito User Pool"
  value       = aws_cognito_user_pool_domain.ecg_monitor_domain.domain
}

output "cognito_domain_url" {
  description = "Full URL of the Cognito hosted UI domain"
  value       = "https://${aws_cognito_user_pool_domain.ecg_monitor_domain.domain}.auth.${data.aws_region.current.name}.amazoncognito.com"
}

output "identity_pool_id" {
  description = "The ID of the Cognito Identity Pool"
  value       = var.create_identity_pool ? aws_cognito_identity_pool.ecg_monitor_identity[0].id : null
}

# Outputs for frontend configuration
output "cognito_config" {
  description = "Configuration object for frontend Amplify"
  value = {
    region          = data.aws_region.current.name
    userPoolId      = aws_cognito_user_pool.ecg_monitor_users.id
    userPoolWebClientId = aws_cognito_user_pool_client.web_client.id
    domain          = aws_cognito_user_pool_domain.ecg_monitor_domain.domain
    oauth = {
      domain      = "${aws_cognito_user_pool_domain.ecg_monitor_domain.domain}.auth.${data.aws_region.current.name}.amazoncognito.com"
      scope       = ["email", "openid", "profile"]
      redirectSignIn  = join(",", concat(["http://localhost:3000/callback"], var.callback_urls))
      redirectSignOut = join(",", concat(["http://localhost:3000/"], var.logout_urls))
      responseType = "code"
    }
  }
}

data "aws_region" "current" {}
