variable "project_id" {
  description = "Google Cloud project that will own the isolated translation gateway."
  type        = string
}

variable "region" {
  description = "Gateway, database and temporary object region."
  type        = string
  default     = "southamerica-east1"
}

variable "container_image" {
  description = "Immutable gateway image reference, preferably pinned by digest."
  type        = string
}

variable "gateway_enabled" {
  description = "Kill switch. Keep false until legal and worker gates are complete."
  type        = bool
  default     = false
}

variable "worker_enabled" {
  description = "Deploy the private OCR worker only after a real provider adapter is available."
  type        = bool
  default     = false
}

variable "worker_resource_profile" {
  description = "baseline preserves the current worker. native-candidate-8g is an offline-only resource proposal, blocked from deployment."
  type        = string
  default     = "baseline"
  nullable    = false
  validation {
    condition     = contains(["baseline", "native-candidate-8g"], var.worker_resource_profile)
    error_message = "Use baseline or native-candidate-8g; the native candidate is not operationally admitted."
  }
}

variable "worker_container_image" {
  description = "Optional distinct worker image pinned by registry digest. Null preserves the existing shared-image baseline."
  type        = string
  default     = null
  validation {
    condition     = var.worker_container_image == null ? true : can(regex("^[^[:space:]@]+@sha256:[a-f0-9]{64}$", var.worker_container_image))
    error_message = "A worker image override must use an immutable registry reference ending in @sha256:<64 lowercase hex>."
  }
}

variable "gateway_key" {
  type    = string
  default = "toonlira-alpha"
}

variable "disclosure" {
  description = "Approved public disclosure values. Empty defaults intentionally keep the gateway fail-closed."
  type = object({
    version                  = string
    operator_name            = string
    operator_contact         = string
    privacy_policy_url       = string
    terms_url                = string
    provider_training_policy = string
  })
  default = {
    version                  = ""
    operator_name            = ""
    operator_contact         = ""
    privacy_policy_url       = ""
    terms_url                = ""
    provider_training_policy = ""
  }
}

variable "database_tier" {
  description = "Cloud SQL tier. Shared-core is intentional for the alpha and has no SLA."
  type        = string
  default     = "db-f1-micro"
}

variable "database_disk_size_gb" {
  description = "Initial Cloud SQL SSD capacity in GiB."
  type        = number
  default     = 10
}

variable "database_disk_autoresize_limit_gb" {
  description = "Hard ceiling for automatic Cloud SQL disk growth in GiB."
  type        = number
  default     = 20
}
