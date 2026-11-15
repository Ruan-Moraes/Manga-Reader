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

variable "layout_mode" {
  description = "Worker balloon/text detector: disabled, shadow (records layout only) or grouping (balloons drive OCR grouping and bound render masks). Needs the model baked in the image and raises worker memory to 2Gi."
  type        = string
  default     = "grouping"
  nullable    = false
  validation {
    condition     = contains(["disabled", "shadow", "grouping"], var.layout_mode)
    error_message = "layout_mode must be disabled, shadow or grouping."
  }
}

variable "layout_direction" {
  description = "Reading direction recorded in the layout artifact (panel order): rtl for Japanese manga, ltr for left-to-right editions."
  type        = string
  default     = "rtl"
  nullable    = false
  validation {
    condition     = contains(["ltr", "rtl"], var.layout_direction)
    error_message = "layout_direction must be ltr or rtl."
  }
}

variable "translation_refine_mode" {
  description = "Optional language layer: gemini lets the worker send each page's OCR text and machine translation (text only, never the image) to Gemini on Vertex AI for review. Enabling it changes the legal disclosure (languageModelLocation): publish a new disclosure.version first."
  type        = string
  default     = "disabled"
  nullable    = false
  validation {
    condition     = contains(["disabled", "gemini"], var.translation_refine_mode)
    error_message = "translation_refine_mode must be disabled or gemini."
  }
}

variable "translation_refine_model" {
  description = "Vertex AI Gemini model used by the language layer."
  type        = string
  default     = "gemini-2.5-flash"
  nullable    = false
  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9.-]{1,62}[a-z0-9]$", var.translation_refine_model))
    error_message = "translation_refine_model must be a Vertex AI model id such as gemini-2.5-flash."
  }
}

variable "translation_refine_location" {
  description = "Vertex AI location of the language layer, disclosed to the app as languageModelLocation (us = US multi-region endpoint)."
  type        = string
  default     = "us"
  nullable    = false
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{0,28}[a-z0-9]$", var.translation_refine_location))
    error_message = "translation_refine_location must be a Vertex AI location such as us or us-central1."
  }
}
