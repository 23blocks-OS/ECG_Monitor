# SQS Queue for processing
resource "aws_sqs_queue" "processing" {
  name                       = "${var.project_name}-${var.environment}-processing-queue"
  visibility_timeout_seconds = var.lambda_timeout
  message_retention_seconds  = 1209600 # 14 days
  receive_wait_time_seconds  = 20      # Long polling

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 3
  })
}

# Dead Letter Queue
resource "aws_sqs_queue" "dlq" {
  name                      = "${var.project_name}-${var.environment}-dlq"
  message_retention_seconds = 1209600 # 14 days
}

# SQS Queue for AI analysis
resource "aws_sqs_queue" "analysis" {
  name                       = "${var.project_name}-${var.environment}-analysis-queue"
  visibility_timeout_seconds = var.lambda_timeout
  message_retention_seconds  = 1209600
  receive_wait_time_seconds  = 20
}

# IAM role for Lambda functions
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-${var.environment}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

# Basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Policy for Lambda to access resources
resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-${var.environment}-lambda-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = [
          "arn:aws:s3:::${var.raw_data_bucket}/*",
          "arn:aws:s3:::${var.processed_data_bucket}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          var.alerts_table_arn,
          "${var.alerts_table_arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:SendMessage"
        ]
        Resource = [
          aws_sqs_queue.processing.arn,
          aws_sqs_queue.analysis.arn,
          aws_sqs_queue.dlq.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = var.claude_api_secret_arn
      },
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      }
    ]
  })
}

# Policy for alert worker to read DynamoDB streams
resource "aws_iam_role_policy" "lambda_streams" {
  name = "${var.project_name}-${var.environment}-lambda-streams-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:DescribeStream",
          "dynamodb:ListStreams"
        ]
        Resource = var.alerts_table_stream_arn
      }
    ]
  })
}

# Lambda function: Preprocessor
resource "aws_lambda_function" "preprocessor" {
  filename      = "${path.module}/../../../lambda/preprocessor/deployment.zip"
  function_name = "${var.project_name}-${var.environment}-preprocessor"
  role          = aws_iam_role.lambda_role.arn
  handler       = "handler.lambda_handler"
  runtime       = "python3.11"
  timeout       = 60
  memory_size   = 256

  environment {
    variables = {
      SESSIONS_TABLE     = var.sessions_table_name
      ANALYSIS_QUEUE_URL = aws_sqs_queue.analysis.url
      PROCESSED_BUCKET   = var.processed_data_bucket
    }
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

# SQS trigger for preprocessor
resource "aws_lambda_event_source_mapping" "preprocessor_sqs" {
  event_source_arn = aws_sqs_queue.processing.arn
  function_name    = aws_lambda_function.preprocessor.arn
  batch_size       = 10
}

# Lambda function: AI Analyzer
resource "aws_lambda_function" "ai_analyzer" {
  filename      = "${path.module}/../../../lambda/ai-analyzer/deployment.zip"
  function_name = "${var.project_name}-${var.environment}-ai-analyzer"
  role          = aws_iam_role.lambda_role.arn
  handler       = "handler.lambda_handler"
  runtime       = "python3.11"
  timeout       = var.lambda_timeout
  memory_size   = 1024

  environment {
    variables = {
      CLAUDE_API_SECRET_ARN = var.claude_api_secret_arn
      ANALYSIS_TABLE        = var.analysis_table_name
      ALERTS_TABLE          = var.alerts_table_name
      PROCESSED_BUCKET      = var.processed_data_bucket
    }
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

# SQS trigger for AI analyzer
resource "aws_lambda_event_source_mapping" "ai_analyzer_sqs" {
  event_source_arn = aws_sqs_queue.analysis.arn
  function_name    = aws_lambda_function.ai_analyzer.arn
  batch_size       = 1
}

# Lambda function: Alert Worker
resource "aws_lambda_function" "alert_worker" {
  filename      = "${path.module}/../../../lambda/alert-worker/deployment.zip"
  function_name = "${var.project_name}-${var.environment}-alert-worker"
  role          = aws_iam_role.lambda_role.arn
  handler       = "handler.lambda_handler"
  runtime       = "python3.11"
  timeout       = 60
  memory_size   = 256

  environment {
    variables = {
      ALERT_EMAIL   = var.alert_email
      ALERTS_TABLE  = var.alerts_table_name
      FROM_EMAIL    = var.alert_email # Using same email, verify it in SES
    }
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

# DynamoDB Stream trigger for alert worker
resource "aws_lambda_event_source_mapping" "alert_worker_stream" {
  event_source_arn  = var.alerts_table_stream_arn
  function_name     = aws_lambda_function.alert_worker.arn
  starting_position = "LATEST"
  batch_size        = 10
}

# Lambda function: API Handler
resource "aws_lambda_function" "api_handler" {
  filename      = "${path.module}/../../../lambda/api-handler/deployment.zip"
  function_name = "${var.project_name}-${var.environment}-api-handler"
  role          = aws_iam_role.lambda_role.arn
  handler       = "handler.lambda_handler"
  runtime       = "python3.11"
  timeout       = 30
  memory_size   = 512

  environment {
    variables = {
      SESSIONS_TABLE  = var.sessions_table_name
      ALERTS_TABLE    = var.alerts_table_name
      ANALYSIS_TABLE  = var.analysis_table_name
      RAW_DATA_BUCKET = var.raw_data_bucket
    }
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "preprocessor" {
  name              = "/aws/lambda/${aws_lambda_function.preprocessor.function_name}"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "ai_analyzer" {
  name              = "/aws/lambda/${aws_lambda_function.ai_analyzer.function_name}"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "alert_worker" {
  name              = "/aws/lambda/${aws_lambda_function.alert_worker.function_name}"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "api_handler" {
  name              = "/aws/lambda/${aws_lambda_function.api_handler.function_name}"
  retention_in_days = 7
}
