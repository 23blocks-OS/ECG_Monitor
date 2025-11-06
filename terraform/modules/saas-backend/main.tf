# SaaS Backend Infrastructure Module
# DynamoDB tables for customer data, orders, subscriptions, and devices

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "project_name" {
  description = "Project name prefix"
  type        = string
  default     = "ecg-monitor-saas"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}

# Customers Table
resource "aws_dynamodb_table" "customers" {
  name           = "${var.project_name}-customers-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "customerId"

  attribute {
    name = "customerId"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  attribute {
    name = "cognitoUserId"
    type = "S"
  }

  global_secondary_index {
    name            = "EmailIndex"
    hash_key        = "email"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "CognitoUserIndex"
    hash_key        = "cognitoUserId"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-customers"
  })
}

# Orders Table
resource "aws_dynamodb_table" "orders" {
  name           = "${var.project_name}-orders-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "orderId"

  attribute {
    name = "orderId"
    type = "S"
  }

  attribute {
    name = "customerId"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name            = "CustomerOrdersIndex"
    hash_key        = "customerId"
    range_key       = "orderId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "StatusIndex"
    hash_key        = "status"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-orders"
  })
}

# Subscriptions Table
resource "aws_dynamodb_table" "subscriptions" {
  name           = "${var.project_name}-subscriptions-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "subscriptionId"

  attribute {
    name = "subscriptionId"
    type = "S"
  }

  attribute {
    name = "customerId"
    type = "S"
  }

  attribute {
    name = "stripeSubscriptionId"
    type = "S"
  }

  global_secondary_index {
    name            = "CustomerSubscriptionIndex"
    hash_key        = "customerId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "StripeSubscriptionIndex"
    hash_key        = "stripeSubscriptionId"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-subscriptions"
  })
}

# Devices Table
resource "aws_dynamodb_table" "devices" {
  name           = "${var.project_name}-devices-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "deviceId"

  attribute {
    name = "deviceId"
    type = "S"
  }

  attribute {
    name = "customerId"
    type = "S"
  }

  attribute {
    name = "serialNumber"
    type = "S"
  }

  global_secondary_index {
    name            = "CustomerDevicesIndex"
    hash_key        = "customerId"
    range_key       = "deviceId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "SerialNumberIndex"
    hash_key        = "serialNumber"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-devices"
  })
}

# Vendor Orders Table
resource "aws_dynamodb_table" "vendor_orders" {
  name           = "${var.project_name}-vendor-orders-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "vendorOrderId"

  attribute {
    name = "vendorOrderId"
    type = "S"
  }

  attribute {
    name = "orderId"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name            = "OrderIndex"
    hash_key        = "orderId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "StatusIndex"
    hash_key        = "status"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-vendor-orders"
  })
}

# Outputs
output "customers_table_name" {
  description = "Name of the customers DynamoDB table"
  value       = aws_dynamodb_table.customers.name
}

output "customers_table_arn" {
  description = "ARN of the customers DynamoDB table"
  value       = aws_dynamodb_table.customers.arn
}

output "orders_table_name" {
  description = "Name of the orders DynamoDB table"
  value       = aws_dynamodb_table.orders.name
}

output "orders_table_arn" {
  description = "ARN of the orders DynamoDB table"
  value       = aws_dynamodb_table.orders.arn
}

output "subscriptions_table_name" {
  description = "Name of the subscriptions DynamoDB table"
  value       = aws_dynamodb_table.subscriptions.name
}

output "subscriptions_table_arn" {
  description = "ARN of the subscriptions DynamoDB table"
  value       = aws_dynamodb_table.subscriptions.arn
}

output "devices_table_name" {
  description = "Name of the devices DynamoDB table"
  value       = aws_dynamodb_table.devices.name
}

output "devices_table_arn" {
  description = "ARN of the devices DynamoDB table"
  value       = aws_dynamodb_table.devices.arn
}

output "vendor_orders_table_name" {
  description = "Name of the vendor orders DynamoDB table"
  value       = aws_dynamodb_table.vendor_orders.name
}

output "vendor_orders_table_arn" {
  description = "ARN of the vendor orders DynamoDB table"
  value       = aws_dynamodb_table.vendor_orders.arn
}
