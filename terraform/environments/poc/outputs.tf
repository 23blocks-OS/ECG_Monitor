output "iot_endpoint" {
  description = "AWS IoT Core endpoint"
  value       = module.iot.iot_endpoint
}

output "iot_thing_name" {
  description = "IoT Thing name"
  value       = module.iot.thing_name
}

output "raw_data_bucket" {
  description = "S3 bucket for raw ECG data"
  value       = module.storage.raw_data_bucket
}

output "processed_data_bucket" {
  description = "S3 bucket for processed data"
  value       = module.storage.processed_data_bucket
}

output "web_bucket" {
  description = "S3 bucket for web dashboard"
  value       = module.storage.web_bucket
}

output "cloudfront_url" {
  description = "CloudFront distribution URL for dashboard"
  value       = module.storage.cloudfront_url
}

output "api_gateway_url" {
  description = "API Gateway endpoint URL"
  value       = module.api.api_url
}

output "sessions_table" {
  description = "DynamoDB sessions table name"
  value       = module.storage.sessions_table
}

output "alerts_table" {
  description = "DynamoDB alerts table name"
  value       = module.storage.alerts_table
}

output "analysis_table" {
  description = "DynamoDB analysis table name"
  value       = module.storage.analysis_table
}

output "processing_queue_url" {
  description = "SQS processing queue URL"
  value       = module.compute.processing_queue_url
}

output "claude_api_secret_arn" {
  description = "Secrets Manager ARN for Claude API key"
  value       = aws_secretsmanager_secret.claude_api.arn
  sensitive   = true
}

# Cognito Authentication Outputs
output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_user_pool_arn" {
  description = "Cognito User Pool ARN"
  value       = module.cognito.user_pool_arn
}

output "cognito_client_id" {
  description = "Cognito User Pool Client ID (for frontend)"
  value       = module.cognito.user_pool_client_id
}

output "cognito_domain" {
  description = "Cognito Hosted UI domain"
  value       = module.cognito.user_pool_domain
}

output "cognito_domain_url" {
  description = "Full Cognito Hosted UI URL"
  value       = module.cognito.cognito_domain_url
}

output "cognito_config_json" {
  description = "Cognito configuration for frontend (JSON format)"
  value       = jsonencode(module.cognito.cognito_config)
}
