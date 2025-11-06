variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment"
  type        = string
}

variable "api_handler_lambda_arn" {
  description = "API Handler Lambda ARN"
  type        = string
}

variable "api_handler_lambda_invoke_arn" {
  description = "API Handler Lambda Invoke ARN"
  type        = string
}

variable "api_handler_lambda_name" {
  description = "API Handler Lambda function name"
  type        = string
}

# Cognito Authentication
variable "enable_cognito_auth" {
  description = "Enable Cognito JWT authentication for API endpoints"
  type        = bool
  default     = false
}

variable "cognito_user_pool_arn" {
  description = "Cognito User Pool ARN for JWT authorizer"
  type        = string
  default     = ""
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
  default     = ""
}

variable "cognito_client_id" {
  description = "Cognito App Client ID"
  type        = string
  default     = ""
}
