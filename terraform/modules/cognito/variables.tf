# ============================================================================
# Variables for Cognito Module
# ============================================================================

variable "environment" {
  description = "Environment name (poc, staging, prod)"
  type        = string
}

variable "enable_mfa" {
  description = "Enable MFA for user pool"
  type        = bool
  default     = false
}

variable "advanced_security" {
  description = "Enable advanced security features (bot detection, rate limiting)"
  type        = bool
  default     = true
}

variable "callback_urls" {
  description = "List of allowed callback URLs for OAuth"
  type        = list(string)
  default     = []
}

variable "logout_urls" {
  description = "List of allowed logout URLs"
  type        = list(string)
  default     = []
}

variable "access_token_validity" {
  description = "Access token validity period in hours"
  type        = number
  default     = 1
}

variable "id_token_validity" {
  description = "ID token validity period in hours"
  type        = number
  default     = 1
}

variable "refresh_token_validity" {
  description = "Refresh token validity period in days"
  type        = number
  default     = 30
}

variable "create_identity_pool" {
  description = "Create Cognito Identity Pool for AWS credentials"
  type        = bool
  default     = false
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}
