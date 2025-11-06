# Store Claude API key in Secrets Manager
resource "aws_secretsmanager_secret" "claude_api" {
  name                    = "${var.project_name}-${var.environment}-claude-api-key"
  description             = "Anthropic Claude API key for ECG analysis"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "claude_api" {
  secret_id     = aws_secretsmanager_secret.claude_api.id
  secret_string = jsonencode({
    api_key = var.anthropic_api_key
  })
}

# IoT Core Module
module "iot" {
  source = "../../modules/iot"

  project_name = var.project_name
  environment  = var.environment
  device_id    = var.device_id
}

# Storage Module (S3, DynamoDB)
module "storage" {
  source = "../../modules/storage"

  project_name      = var.project_name
  environment       = var.environment
  retention_days    = var.s3_retention_days
  enable_versioning = true
}

# Compute Module (Lambda, SQS)
module "compute" {
  source = "../../modules/compute"

  project_name          = var.project_name
  environment           = var.environment
  lambda_timeout        = var.lambda_timeout
  claude_api_secret_arn = aws_secretsmanager_secret.claude_api.arn
  alert_email           = var.alert_email

  # Pass storage resources
  raw_data_bucket       = module.storage.raw_data_bucket
  processed_data_bucket = module.storage.processed_data_bucket
  sessions_table_name   = module.storage.sessions_table
  alerts_table_name     = module.storage.alerts_table
  analysis_table_name   = module.storage.analysis_table
  alerts_table_arn      = module.storage.alerts_table_arn
  alerts_table_stream_arn = module.storage.alerts_table_stream_arn

  depends_on = [module.storage]
}

# API Module
module "api" {
  source = "../../modules/api"

  project_name = var.project_name
  environment  = var.environment

  api_handler_lambda_arn         = module.compute.api_handler_lambda_arn
  api_handler_lambda_invoke_arn  = module.compute.api_handler_lambda_invoke_arn
  api_handler_lambda_name        = module.compute.api_handler_lambda_name

  depends_on = [module.compute]
}

# Connect IoT to processing pipeline
resource "aws_iot_topic_rule" "ecg_data" {
  name        = "${replace(var.project_name, "-", "_")}_${var.environment}_ecg_data"
  description = "Route ECG data to processing pipeline"
  enabled     = true
  sql         = "SELECT *, timestamp() as ingestion_timestamp, topic(2) as device_id FROM 'ecg/+/data'"
  sql_version = "2016-03-23"

  s3 {
    bucket_name = module.storage.raw_data_bucket
    key         = "$${timestamp()}/$${newuuid()}.json.gz"
    role_arn    = module.iot.iot_rule_role_arn
  }

  sqs {
    queue_url = module.compute.processing_queue_url
    role_arn  = module.iot.iot_rule_role_arn
    use_base64 = false
  }

  dynamodb {
    table_name = module.storage.sessions_table
    role_arn   = module.iot.iot_rule_role_arn
    hash_key_field  = "session_id"
    hash_key_value  = "$${newuuid()}"
    hash_key_type   = "STRING"
    payload_field   = "payload"
  }
}
