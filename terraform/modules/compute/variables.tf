variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment"
  type        = string
}

variable "lambda_timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 300
}

variable "claude_api_secret_arn" {
  description = "ARN of Secrets Manager secret for Claude API key"
  type        = string
}

variable "alert_email" {
  description = "Email for alerts"
  type        = string
}

variable "raw_data_bucket" {
  description = "Raw data S3 bucket name"
  type        = string
}

variable "processed_data_bucket" {
  description = "Processed data S3 bucket name"
  type        = string
}

variable "sessions_table_name" {
  description = "Sessions DynamoDB table name"
  type        = string
}

variable "alerts_table_name" {
  description = "Alerts DynamoDB table name"
  type        = string
}

variable "alerts_table_arn" {
  description = "Alerts table ARN"
  type        = string
}

variable "alerts_table_stream_arn" {
  description = "Alerts table stream ARN"
  type        = string
}

variable "analysis_table_name" {
  description = "Analysis DynamoDB table name"
  type        = string
}
