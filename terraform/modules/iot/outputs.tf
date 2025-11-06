output "iot_endpoint" {
  description = "AWS IoT endpoint"
  value       = data.aws_iot_endpoint.current.endpoint_address
}

output "thing_name" {
  description = "IoT Thing name"
  value       = aws_iot_thing.ecg_device.name
}

output "thing_arn" {
  description = "IoT Thing ARN"
  value       = aws_iot_thing.ecg_device.arn
}

output "policy_name" {
  description = "IoT Policy name"
  value       = aws_iot_policy.device_policy.name
}

output "iot_rule_role_arn" {
  description = "IAM role ARN for IoT rules"
  value       = aws_iam_role.iot_rule_role.arn
}
