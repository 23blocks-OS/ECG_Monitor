# API Gateway REST API
resource "aws_api_gateway_rest_api" "ecg_api" {
  name        = "${var.project_name}-${var.environment}-api"
  description = "ECG Monitor REST API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# Cognito JWT Authorizer (optional)
resource "aws_api_gateway_authorizer" "cognito" {
  count = var.enable_cognito_auth ? 1 : 0

  name          = "${var.project_name}-${var.environment}-cognito-authorizer"
  rest_api_id   = aws_api_gateway_rest_api.ecg_api.id
  type          = "COGNITO_USER_POOLS"
  provider_arns = [var.cognito_user_pool_arn]

  # Audience validation (optional)
  # identity_source = "method.request.header.Authorization"
}

# CORS configuration
resource "aws_api_gateway_gateway_response" "cors_4xx" {
  rest_api_id   = aws_api_gateway_rest_api.ecg_api.id
  response_type = "DEFAULT_4XX"

  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
  }
}

resource "aws_api_gateway_gateway_response" "cors_5xx" {
  rest_api_id   = aws_api_gateway_rest_api.ecg_api.id
  response_type = "DEFAULT_5XX"

  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
  }
}

# /api resource
resource "aws_api_gateway_resource" "api" {
  rest_api_id = aws_api_gateway_rest_api.ecg_api.id
  parent_id   = aws_api_gateway_rest_api.ecg_api.root_resource_id
  path_part   = "api"
}

# /api/live resource
resource "aws_api_gateway_resource" "live" {
  rest_api_id = aws_api_gateway_rest_api.ecg_api.id
  parent_id   = aws_api_gateway_resource.api.id
  path_part   = "live"
}

# GET /api/live
resource "aws_api_gateway_method" "live_get" {
  rest_api_id   = aws_api_gateway_rest_api.ecg_api.id
  resource_id   = aws_api_gateway_resource.live.id
  http_method   = "GET"
  authorization = var.enable_cognito_auth ? "COGNITO_USER_POOLS" : "NONE"
  authorizer_id = var.enable_cognito_auth ? aws_api_gateway_authorizer.cognito[0].id : null
}

resource "aws_api_gateway_integration" "live_get" {
  rest_api_id = aws_api_gateway_rest_api.ecg_api.id
  resource_id = aws_api_gateway_resource.live.id
  http_method = aws_api_gateway_method.live_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.api_handler_lambda_invoke_arn
}

# OPTIONS for CORS
resource "aws_api_gateway_method" "live_options" {
  rest_api_id   = aws_api_gateway_rest_api.ecg_api.id
  resource_id   = aws_api_gateway_resource.live.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "live_options" {
  rest_api_id = aws_api_gateway_rest_api.ecg_api.id
  resource_id = aws_api_gateway_resource.live.id
  http_method = aws_api_gateway_method.live_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "live_options" {
  rest_api_id = aws_api_gateway_rest_api.ecg_api.id
  resource_id = aws_api_gateway_resource.live.id
  http_method = aws_api_gateway_method.live_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "live_options" {
  rest_api_id = aws_api_gateway_rest_api.ecg_api.id
  resource_id = aws_api_gateway_resource.live.id
  http_method = aws_api_gateway_method.live_options.http_method
  status_code = aws_api_gateway_method_response.live_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# /api/alerts resource
resource "aws_api_gateway_resource" "alerts" {
  rest_api_id = aws_api_gateway_rest_api.ecg_api.id
  parent_id   = aws_api_gateway_resource.api.id
  path_part   = "alerts"
}

# GET /api/alerts
resource "aws_api_gateway_method" "alerts_get" {
  rest_api_id   = aws_api_gateway_rest_api.ecg_api.id
  resource_id   = aws_api_gateway_resource.alerts.id
  http_method   = "GET"
  authorization = var.enable_cognito_auth ? "COGNITO_USER_POOLS" : "NONE"
  authorizer_id = var.enable_cognito_auth ? aws_api_gateway_authorizer.cognito[0].id : null
}

resource "aws_api_gateway_integration" "alerts_get" {
  rest_api_id = aws_api_gateway_rest_api.ecg_api.id
  resource_id = aws_api_gateway_resource.alerts.id
  http_method = aws_api_gateway_method.alerts_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.api_handler_lambda_invoke_arn
}

# /api/history resource
resource "aws_api_gateway_resource" "history" {
  rest_api_id = aws_api_gateway_rest_api.ecg_api.id
  parent_id   = aws_api_gateway_resource.api.id
  path_part   = "history"
}

# GET /api/history
resource "aws_api_gateway_method" "history_get" {
  rest_api_id   = aws_api_gateway_rest_api.ecg_api.id
  resource_id   = aws_api_gateway_resource.history.id
  http_method   = "GET"
  authorization = var.enable_cognito_auth ? "COGNITO_USER_POOLS" : "NONE"
  authorizer_id = var.enable_cognito_auth ? aws_api_gateway_authorizer.cognito[0].id : null
}

resource "aws_api_gateway_integration" "history_get" {
  rest_api_id = aws_api_gateway_rest_api.ecg_api.id
  resource_id = aws_api_gateway_resource.history.id
  http_method = aws_api_gateway_method.history_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.api_handler_lambda_invoke_arn
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.api_handler_lambda_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.ecg_api.execution_arn}/*/*"
}

# API deployment
resource "aws_api_gateway_deployment" "api" {
  rest_api_id = aws_api_gateway_rest_api.ecg_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.api.id,
      aws_api_gateway_resource.live.id,
      aws_api_gateway_resource.alerts.id,
      aws_api_gateway_resource.history.id,
      aws_api_gateway_method.live_get.id,
      aws_api_gateway_method.alerts_get.id,
      aws_api_gateway_method.history_get.id,
      aws_api_gateway_integration.live_get.id,
      aws_api_gateway_integration.alerts_get.id,
      aws_api_gateway_integration.history_get.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.live_get,
    aws_api_gateway_integration.alerts_get,
    aws_api_gateway_integration.history_get,
  ]
}

# API stage
resource "aws_api_gateway_stage" "api" {
  deployment_id = aws_api_gateway_deployment.api.id
  rest_api_id   = aws_api_gateway_rest_api.ecg_api.id
  stage_name    = "v1"

  xray_tracing_enabled = false
}

# Usage plan for throttling
resource "aws_api_gateway_usage_plan" "api" {
  name = "${var.project_name}-${var.environment}-usage-plan"

  api_stages {
    api_id = aws_api_gateway_rest_api.ecg_api.id
    stage  = aws_api_gateway_stage.api.stage_name
  }

  throttle_settings {
    burst_limit = 200
    rate_limit  = 100
  }
}
