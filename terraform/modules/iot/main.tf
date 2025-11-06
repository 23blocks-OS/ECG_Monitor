# IoT Thing for ECG device
resource "aws_iot_thing" "ecg_device" {
  name = "${var.project_name}-${var.device_id}"
}

# IoT Thing Type
resource "aws_iot_thing_type" "ecg_monitor" {
  name = "${var.project_name}-type"

  properties {
    description           = "ECG monitoring device"
    searchable_attributes = ["deviceType", "firmwareVersion"]
  }
}

# IoT Policy for device
resource "aws_iot_policy" "device_policy" {
  name = "${var.project_name}-${var.environment}-device-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "iot:Connect"
        ]
        Resource = "arn:aws:iot:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:client/${var.device_id}"
      },
      {
        Effect = "Allow"
        Action = [
          "iot:Publish"
        ]
        Resource = "arn:aws:iot:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:topic/ecg/${var.device_id}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "iot:Subscribe",
          "iot:Receive"
        ]
        Resource = [
          "arn:aws:iot:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:topicfilter/ecg/${var.device_id}/control",
          "arn:aws:iot:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:topic/ecg/${var.device_id}/control"
        ]
      }
    ]
  })
}

# IAM role for IoT rules
resource "aws_iam_role" "iot_rule_role" {
  name = "${var.project_name}-${var.environment}-iot-rule-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "iot.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

# Policy for IoT rule to write to S3, SQS, DynamoDB
resource "aws_iam_role_policy" "iot_rule_policy" {
  name = "${var.project_name}-${var.environment}-iot-rule-policy"
  role = aws_iam_role.iot_rule_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ]
        Resource = "*"
      }
    ]
  })
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_iot_endpoint" "current" {
  endpoint_type = "iot:Data-ATS"
}
