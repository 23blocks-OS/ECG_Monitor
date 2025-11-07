# DynamoDB Tables for Garmin/Strava Activity Data Integration
# Supports matching exercise data with ECG recordings

# Table for storing uploaded activity files metadata
resource "aws_dynamodb_table" "activity_uploads" {
  name           = "${var.project_name}-${var.environment}-activity-uploads"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "upload_id"

  attribute {
    name = "upload_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "upload_timestamp"
    type = "N"
  }

  attribute {
    name = "source"
    type = "S"  # "garmin" or "strava"
  }

  global_secondary_index {
    name            = "UserUploadsIndex"
    hash_key        = "user_id"
    range_key       = "upload_timestamp"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "SourceUploadsIndex"
    hash_key        = "source"
    range_key       = "upload_timestamp"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = false
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-activity-uploads"
  }
}

# Table for storing parsed activity data from files
resource "aws_dynamodb_table" "activities" {
  name           = "${var.project_name}-${var.environment}-activities"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "activity_id"

  attribute {
    name = "activity_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "start_timestamp"
    type = "N"
  }

  attribute {
    name = "upload_id"
    type = "S"
  }

  attribute {
    name = "source"
    type = "S"  # "garmin" or "strava"
  }

  global_secondary_index {
    name            = "UserActivitiesIndex"
    hash_key        = "user_id"
    range_key       = "start_timestamp"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "UploadActivitiesIndex"
    hash_key        = "upload_id"
    range_key       = "start_timestamp"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "SourceActivitiesIndex"
    hash_key        = "source"
    range_key       = "start_timestamp"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = false
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-activities"
  }
}

# Table for linking activities with ECG sessions
resource "aws_dynamodb_table" "activity_ecg_matches" {
  name           = "${var.project_name}-${var.environment}-activity-ecg-matches"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "match_id"

  attribute {
    name = "match_id"
    type = "S"
  }

  attribute {
    name = "activity_id"
    type = "S"
  }

  attribute {
    name = "session_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "match_timestamp"
    type = "N"
  }

  global_secondary_index {
    name            = "ActivityMatchesIndex"
    hash_key        = "activity_id"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "SessionMatchesIndex"
    hash_key        = "session_id"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "UserMatchesIndex"
    hash_key        = "user_id"
    range_key       = "match_timestamp"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = false
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-activity-ecg-matches"
  }
}

# S3 Bucket for storing uploaded activity files
resource "aws_s3_bucket" "activity_files" {
  bucket = "${var.project_name}-${var.environment}-activity-files"
}

resource "aws_s3_bucket_versioning" "activity_files" {
  bucket = aws_s3_bucket.activity_files.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "activity_files" {
  bucket = aws_s3_bucket.activity_files.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "activity_files" {
  bucket = aws_s3_bucket.activity_files.id

  rule {
    id     = "expire-old-files"
    status = "Enabled"

    # Keep files for 1 year, then delete
    expiration {
      days = 365
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# CORS configuration for direct browser uploads
resource "aws_s3_bucket_cors_configuration" "activity_files" {
  bucket = aws_s3_bucket.activity_files.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "POST", "GET"]
    allowed_origins = ["*"]  # In production, restrict to your domain
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Outputs for the new tables
output "activity_uploads_table_name" {
  description = "Name of the activity uploads DynamoDB table"
  value       = aws_dynamodb_table.activity_uploads.name
}

output "activity_uploads_table_arn" {
  description = "ARN of the activity uploads DynamoDB table"
  value       = aws_dynamodb_table.activity_uploads.arn
}

output "activities_table_name" {
  description = "Name of the activities DynamoDB table"
  value       = aws_dynamodb_table.activities.name
}

output "activities_table_arn" {
  description = "ARN of the activities DynamoDB table"
  value       = aws_dynamodb_table.activities.arn
}

output "activity_ecg_matches_table_name" {
  description = "Name of the activity-ECG matches DynamoDB table"
  value       = aws_dynamodb_table.activity_ecg_matches.name
}

output "activity_ecg_matches_table_arn" {
  description = "ARN of the activity-ECG matches DynamoDB table"
  value       = aws_dynamodb_table.activity_ecg_matches.arn
}

output "activity_files_bucket_name" {
  description = "Name of the S3 bucket for activity files"
  value       = aws_s3_bucket.activity_files.bucket
}

output "activity_files_bucket_arn" {
  description = "ARN of the S3 bucket for activity files"
  value       = aws_s3_bucket.activity_files.arn
}
