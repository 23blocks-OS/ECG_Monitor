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
