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

variable "gateway_key" {
  type    = string
  default = "toonlira-alpha"
}

variable "worker_url" {
  description = "Private worker endpoint introduced by MOB-FEAT-018. Empty keeps dispatch disabled."
  type        = string
  default     = ""
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
  type    = string
  default = "db-custom-1-3840"
}
