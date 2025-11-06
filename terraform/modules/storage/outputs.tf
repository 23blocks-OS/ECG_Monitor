output "raw_data_bucket" {
  description = "Raw data S3 bucket name"
  value       = aws_s3_bucket.raw_data.id
}

output "raw_data_bucket_arn" {
  description = "Raw data S3 bucket ARN"
  value       = aws_s3_bucket.raw_data.arn
}

output "processed_data_bucket" {
  description = "Processed data S3 bucket name"
  value       = aws_s3_bucket.processed_data.id
}

output "processed_data_bucket_arn" {
  description = "Processed data S3 bucket ARN"
  value       = aws_s3_bucket.processed_data.arn
}

output "web_bucket" {
  description = "Web dashboard S3 bucket name"
  value       = aws_s3_bucket.web.id
}

output "web_bucket_arn" {
  description = "Web dashboard S3 bucket ARN"
  value       = aws_s3_bucket.web.arn
}

output "cloudfront_url" {
  description = "CloudFront distribution URL"
  value       = "https://${aws_cloudfront_distribution.web.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.web.id
}

output "sessions_table" {
  description = "Sessions DynamoDB table name"
  value       = aws_dynamodb_table.sessions.name
}

output "sessions_table_arn" {
  description = "Sessions table ARN"
  value       = aws_dynamodb_table.sessions.arn
}

output "alerts_table" {
  description = "Alerts DynamoDB table name"
  value       = aws_dynamodb_table.alerts.name
}

output "alerts_table_arn" {
  description = "Alerts table ARN"
  value       = aws_dynamodb_table.alerts.arn
}

output "alerts_table_stream_arn" {
  description = "Alerts table stream ARN"
  value       = aws_dynamodb_table.alerts.stream_arn
}

output "analysis_table" {
  description = "Analysis DynamoDB table name"
  value       = aws_dynamodb_table.analysis.name
}

output "analysis_table_arn" {
  description = "Analysis table ARN"
  value       = aws_dynamodb_table.analysis.arn
}
