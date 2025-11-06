# Terraform - Makefile
# Infrastructure as Code deployment

.PHONY: help init plan apply destroy validate format clean

# Configuration
ENV ?= dev
TF_VAR_FILE ?= terraform.tfvars
BACKEND_CONFIG ?=

# Default target
help:
	@echo "Terraform - Infrastructure Deployment"
	@echo "======================================"
	@echo ""
	@echo "Setup:"
	@echo "  make init       - Initialize Terraform"
	@echo "  make validate   - Validate Terraform files"
	@echo "  make format     - Format Terraform files"
	@echo ""
	@echo "Planning:"
	@echo "  make plan       - Show execution plan"
	@echo "  make plan-out   - Save plan to file"
	@echo ""
	@echo "Deployment:"
	@echo "  make apply      - Apply infrastructure changes"
	@echo "  make apply-auto - Apply without confirmation"
	@echo "  make destroy    - Destroy all infrastructure"
	@echo ""
	@echo "Inspection:"
	@echo "  make show       - Show current state"
	@echo "  make output     - Show output values"
	@echo "  make list       - List resources"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean      - Remove Terraform files"
	@echo "  make refresh    - Refresh state"
	@echo "  make upgrade    - Upgrade providers"
	@echo ""
	@echo "Environment:"
	@echo "  ENV=$(ENV)"
	@echo "  Use ENV=prod for production deployment"
	@echo ""

# Initialize Terraform
init:
	@echo "Initializing Terraform..."
	@if [ -n "$(BACKEND_CONFIG)" ]; then \
		terraform init -backend-config=$(BACKEND_CONFIG); \
	else \
		terraform init; \
	fi
	@echo "✓ Terraform initialized"

# Validate configuration
validate:
	@echo "Validating Terraform configuration..."
	@terraform validate
	@echo "✓ Configuration valid"

# Format Terraform files
format:
	@echo "Formatting Terraform files..."
	@terraform fmt -recursive
	@echo "✓ Files formatted"

# Check formatting
check-format:
	@echo "Checking Terraform format..."
	@terraform fmt -check -recursive
	@echo "✓ Format check complete"

# Show execution plan
plan:
	@echo "Creating Terraform execution plan..."
	@if [ -f "$(TF_VAR_FILE)" ]; then \
		terraform plan -var-file=$(TF_VAR_FILE); \
	else \
		terraform plan; \
	fi

# Save plan to file
plan-out:
	@echo "Creating and saving Terraform plan..."
	@if [ -f "$(TF_VAR_FILE)" ]; then \
		terraform plan -var-file=$(TF_VAR_FILE) -out=tfplan; \
	else \
		terraform plan -out=tfplan; \
	fi
	@echo "✓ Plan saved to tfplan"

# Apply changes
apply:
	@echo "Applying Terraform changes..."
	@if [ -f "tfplan" ]; then \
		terraform apply tfplan; \
		rm -f tfplan; \
	elif [ -f "$(TF_VAR_FILE)" ]; then \
		terraform apply -var-file=$(TF_VAR_FILE); \
	else \
		terraform apply; \
	fi
	@echo "✓ Infrastructure applied"

# Apply without confirmation
apply-auto:
	@echo "Applying Terraform changes (auto-approve)..."
	@if [ -f "$(TF_VAR_FILE)" ]; then \
		terraform apply -var-file=$(TF_VAR_FILE) -auto-approve; \
	else \
		terraform apply -auto-approve; \
	fi
	@echo "✓ Infrastructure applied"

# Destroy infrastructure
destroy:
	@echo "⚠️  WARNING: This will destroy all infrastructure!"
	@echo "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
	@sleep 5
	@if [ -f "$(TF_VAR_FILE)" ]; then \
		terraform destroy -var-file=$(TF_VAR_FILE); \
	else \
		terraform destroy; \
	fi
	@echo "✓ Infrastructure destroyed"

# Destroy without confirmation (dangerous!)
destroy-auto:
	@echo "⚠️  Destroying infrastructure (auto-approve)..."
	@if [ -f "$(TF_VAR_FILE)" ]; then \
		terraform destroy -var-file=$(TF_VAR_FILE) -auto-approve; \
	else \
		terraform destroy -auto-approve; \
	fi
	@echo "✓ Infrastructure destroyed"

# Show current state
show:
	@echo "Showing Terraform state..."
	@terraform show

# Show output values
output:
	@echo "Terraform outputs:"
	@terraform output

# List resources
list:
	@echo "Listing Terraform resources..."
	@terraform state list

# Refresh state
refresh:
	@echo "Refreshing Terraform state..."
	@terraform refresh
	@echo "✓ State refreshed"

# Clean Terraform files
clean:
	@echo "Cleaning Terraform files..."
	@rm -rf .terraform
	@rm -f .terraform.lock.hcl
	@rm -f tfplan
	@rm -f terraform.tfstate.backup
	@echo "✓ Clean complete"
	@echo "Note: terraform.tfstate was not deleted (contains infrastructure state)"

# Upgrade providers
upgrade:
	@echo "Upgrading Terraform providers..."
	@terraform init -upgrade
	@echo "✓ Providers upgraded"

# Create workspace
create-workspace:
	@if [ -z "$(WS)" ]; then \
		echo "Error: WS (workspace name) not set"; \
		echo "Usage: make create-workspace WS=dev"; \
		exit 1; \
	fi
	@echo "Creating workspace: $(WS)"
	@terraform workspace new $(WS)
	@echo "✓ Workspace created"

# Switch workspace
switch-workspace:
	@if [ -z "$(WS)" ]; then \
		echo "Error: WS (workspace name) not set"; \
		echo "Usage: make switch-workspace WS=prod"; \
		exit 1; \
	fi
	@echo "Switching to workspace: $(WS)"
	@terraform workspace select $(WS)
	@echo "✓ Workspace switched"

# List workspaces
list-workspaces:
	@echo "Available workspaces:"
	@terraform workspace list

# Show current workspace
current-workspace:
	@echo "Current workspace:"
	@terraform workspace show

# Import existing resource
import:
	@if [ -z "$(RESOURCE)" ] || [ -z "$(ID)" ]; then \
		echo "Error: RESOURCE and ID required"; \
		echo "Usage: make import RESOURCE=aws_s3_bucket.example ID=my-bucket"; \
		exit 1; \
	fi
	@echo "Importing resource: $(RESOURCE) with ID: $(ID)"
	@terraform import $(RESOURCE) $(ID)
	@echo "✓ Resource imported"

# Taint resource (mark for recreation)
taint:
	@if [ -z "$(RESOURCE)" ]; then \
		echo "Error: RESOURCE not set"; \
		echo "Usage: make taint RESOURCE=aws_instance.example"; \
		exit 1; \
	fi
	@echo "Tainting resource: $(RESOURCE)"
	@terraform taint $(RESOURCE)
	@echo "✓ Resource tainted"

# Untaint resource
untaint:
	@if [ -z "$(RESOURCE)" ]; then \
		echo "Error: RESOURCE not set"; \
		echo "Usage: make untaint RESOURCE=aws_instance.example"; \
		exit 1; \
	fi
	@echo "Untainting resource: $(RESOURCE)"
	@terraform untaint $(RESOURCE)
	@echo "✓ Resource untainted"

# Graph visualization
graph:
	@echo "Generating Terraform graph..."
	@terraform graph | dot -Tpng > graph.png
	@echo "✓ Graph saved to graph.png"

# Security scan with tfsec
security:
	@echo "Running security scan..."
	@if command -v tfsec > /dev/null; then \
		tfsec .; \
	else \
		echo "tfsec not found. Install from: https://github.com/aquasecurity/tfsec"; \
	fi

# Cost estimation with infracost
cost:
	@echo "Estimating infrastructure costs..."
	@if command -v infracost > /dev/null; then \
		infracost breakdown --path .; \
	else \
		echo "infracost not found. Install from: https://www.infracost.io/docs/"; \
	fi

# Full deployment workflow
deploy: validate format plan-out apply
	@echo "✓ Full deployment complete"

# Full setup workflow
setup: init validate
	@echo "✓ Setup complete"

# CI/CD workflow
ci: init validate format check-format plan
	@echo "✓ CI checks complete"
