output "processing_queue_url" {
  description = "Processing queue URL"
  value       = aws_sqs_queue.processing.url
}

output "processing_queue_arn" {
  description = "Processing queue ARN"
  value       = aws_sqs_queue.processing.arn
}

output "analysis_queue_url" {
  description = "Analysis queue URL"
  value       = aws_sqs_queue.analysis.url
}

output "preprocessor_lambda_arn" {
  description = "Preprocessor Lambda ARN"
  value       = aws_lambda_function.preprocessor.arn
}

output "ai_analyzer_lambda_arn" {
  description = "AI Analyzer Lambda ARN"
  value       = aws_lambda_function.ai_analyzer.arn
}

output "alert_worker_lambda_arn" {
  description = "Alert Worker Lambda ARN"
  value       = aws_lambda_function.alert_worker.arn
}

output "api_handler_lambda_arn" {
  description = "API Handler Lambda ARN"
  value       = aws_lambda_function.api_handler.arn
}

output "api_handler_lambda_invoke_arn" {
  description = "API Handler Lambda Invoke ARN"
  value       = aws_lambda_function.api_handler.invoke_arn
}

output "api_handler_lambda_name" {
  description = "API Handler Lambda name"
  value       = aws_lambda_function.api_handler.function_name
}
