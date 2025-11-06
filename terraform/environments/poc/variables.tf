variable "project_name" {
  description = "Project name"
  type        = string
  default     = "ecg-monitor"
}

variable "environment" {
  description = "Environment (poc, dev, prod)"
  type        = string
  default     = "poc"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "device_id" {
  description = "ECG device identifier"
  type        = string
  default     = "ecg-device-001"
}

variable "alert_email" {
  description = "Email address for alerts"
  type        = string
}

variable "anthropic_api_key" {
  description = "Anthropic Claude API key"
  type        = string
  sensitive   = true
}

variable "ecg_sampling_rate" {
  description = "ECG sampling rate in Hz"
  type        = number
  default     = 250
}

variable "batch_size_seconds" {
  description = "Data batch size in seconds"
  type        = number
  default     = 10
}

variable "s3_retention_days" {
  description = "S3 data retention in days"
  type        = number
  default     = 90
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 300
}

variable "enable_detailed_monitoring" {
  description = "Enable detailed CloudWatch monitoring"
  type        = bool
  default     = true
}
