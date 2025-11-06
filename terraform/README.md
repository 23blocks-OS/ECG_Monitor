# Terraform AWS Infrastructure for ECG Monitor

This directory contains the Infrastructure as Code (IaC) for the ECG Monitor system using Terraform.

## Structure

```
terraform/
├── modules/              # Reusable Terraform modules
│   ├── iot/             # AWS IoT Core resources
│   ├── storage/         # S3, DynamoDB
│   ├── compute/         # Lambda, SQS
│   └── api/             # API Gateway
├── environments/        # Environment-specific configs
│   └── poc/            # POC environment
└── scripts/            # Helper scripts
```

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured
- AWS account with appropriate permissions

## Quick Start

```bash
cd terraform/environments/poc
terraform init
terraform plan
terraform apply
```

## Environment Variables

Create a `terraform.tfvars` file:

```hcl
project_name = "ecg-monitor"
environment  = "poc"
aws_region   = "us-east-1"

# Email for alerts
alert_email = "your-email@example.com"

# Anthropic API key (will be stored in Secrets Manager)
anthropic_api_key = "your-claude-api-key"
```

## Outputs

After `terraform apply`, you'll get:
- IoT endpoint URL
- S3 bucket names
- API Gateway URL
- Dashboard CloudFront URL

## Deployment

See [docs/aws-deployment.md](../../docs/aws-deployment.md) for detailed deployment instructions.
