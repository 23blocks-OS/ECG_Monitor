output "api_id" {
  description = "API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.ecg_api.id
}

output "api_url" {
  description = "API Gateway URL"
  value       = "${aws_api_gateway_stage.api.invoke_url}"
}

output "api_stage" {
  description = "API Gateway stage name"
  value       = aws_api_gateway_stage.api.stage_name
}
