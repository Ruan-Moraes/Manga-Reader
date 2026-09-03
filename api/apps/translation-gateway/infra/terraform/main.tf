locals {
  name             = "translation-gateway"
  database_name    = "translation_gateway"
  database_user    = "translation_gateway"
  dispatch_enabled = var.gateway_enabled && var.worker_url != ""
  required_apis = toset([
    "artifactregistry.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "compute.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
    "servicenetworking.googleapis.com",
    "sqladmin.googleapis.com",
    "storage.googleapis.com",
    "cloudtasks.googleapis.com",
    "cloudscheduler.googleapis.com",
    "monitoring.googleapis.com"
  ])
  common_env = {
    GATEWAY_ENABLED                  = tostring(var.gateway_enabled)
    GATEWAY_KEY                      = var.gateway_key
    GATEWAY_DISCLOSURE_VERSION       = var.disclosure.version
    GATEWAY_OPERATOR_NAME            = var.disclosure.operator_name
    GATEWAY_OPERATOR_CONTACT         = var.disclosure.operator_contact
    GATEWAY_PRIVACY_POLICY_URL       = var.disclosure.privacy_policy_url
    GATEWAY_TERMS_URL                = var.disclosure.terms_url
    GATEWAY_PROVIDER_TRAINING_POLICY = var.disclosure.provider_training_policy
    GATEWAY_STORAGE_MODE             = "gcs"
    GATEWAY_STORAGE_BUCKET           = google_storage_bucket.temporary_media.name
    GATEWAY_DISPATCH_MODE            = local.dispatch_enabled ? "cloud-tasks" : "disabled"
    GATEWAY_GCP_PROJECT_ID           = var.project_id
    GATEWAY_TASKS_LOCATION           = var.region
    GATEWAY_TASKS_QUEUE              = "translation-jobs"
    GATEWAY_WORKER_URL               = var.worker_url
    GATEWAY_TASKS_SERVICE_ACCOUNT    = google_service_account.tasks.email
    SPRING_DATASOURCE_URL            = "jdbc:postgresql://${google_sql_database_instance.gateway.private_ip_address}:5432/${local.database_name}"
    SPRING_DATASOURCE_USERNAME       = local.database_user
  }
}

check "enabled_configuration" {
  assert {
    condition = !var.gateway_enabled || (
      var.worker_url != "" &&
      var.disclosure.version != "" &&
      var.disclosure.operator_name != "" &&
      var.disclosure.operator_contact != "" &&
      var.disclosure.privacy_policy_url != "" &&
      var.disclosure.terms_url != "" &&
      var.disclosure.provider_training_policy != ""
    )
    error_message = "gateway_enabled requires a worker and the complete approved legal disclosure."
  }
}

resource "google_project_service" "required" {
  for_each           = local.required_apis
  service            = each.value
  disable_on_destroy = false
}

resource "google_artifact_registry_repository" "gateway" {
  location      = var.region
  repository_id = local.name
  format        = "DOCKER"
  depends_on    = [google_project_service.required]
}

resource "google_compute_network" "gateway" {
  name                    = "${local.name}-network"
  auto_create_subnetworks = false
  depends_on              = [google_project_service.required]
}

resource "google_compute_subnetwork" "gateway" {
  name          = "${local.name}-subnet"
  network       = google_compute_network.gateway.id
  region        = var.region
  ip_cidr_range = "10.72.0.0/24"
}

resource "google_compute_global_address" "private_services" {
  name          = "${local.name}-private-services"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.gateway.id
}

resource "google_service_networking_connection" "private_services" {
  network                 = google_compute_network.gateway.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_services.name]
}

resource "random_password" "database" {
  length  = 32
  special = true
}

resource "google_secret_manager_secret" "database_password" {
  secret_id = "${local.name}-database-password"
  replication {
    auto {}
  }
  depends_on = [google_project_service.required]
}

resource "google_secret_manager_secret_version" "database_password" {
  secret      = google_secret_manager_secret.database_password.id
  secret_data = random_password.database.result
}

resource "google_sql_database_instance" "gateway" {
  name                = local.name
  region              = var.region
  database_version    = "POSTGRES_17"
  deletion_protection = true
  settings {
    tier              = var.database_tier
    availability_type = "ZONAL"
    disk_autoresize   = true
    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
    }
    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.gateway.id
    }
  }
  depends_on = [google_service_networking_connection.private_services]
}

resource "google_sql_database" "gateway" {
  name     = local.database_name
  instance = google_sql_database_instance.gateway.name
}

resource "google_sql_user" "gateway" {
  name     = local.database_user
  instance = google_sql_database_instance.gateway.name
  password = random_password.database.result
}

resource "google_storage_bucket" "temporary_media" {
  name                        = "${var.project_id}-${local.name}-temporary"
  location                    = var.region
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = false
  lifecycle_rule {
    condition {
      age = 1
    }
    action {
      type = "Delete"
    }
  }
}

resource "google_cloud_tasks_queue" "translation_jobs" {
  name     = "translation-jobs"
  location = var.region
  rate_limits {
    max_concurrent_dispatches = 1
  }
  retry_config {
    max_attempts = 1
  }
  depends_on = [google_project_service.required]
}

resource "google_service_account" "gateway" {
  account_id   = "translation-gateway"
  display_name = "Translation Gateway"
}

resource "google_service_account" "tasks" {
  account_id   = "translation-task-invoker"
  display_name = "Translation task worker invoker"
}

resource "google_service_account" "maintenance" {
  account_id   = "translation-maintenance"
  display_name = "Translation maintenance jobs"
}

resource "google_storage_bucket_iam_member" "gateway_objects" {
  bucket = google_storage_bucket.temporary_media.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.gateway.email}"
}

resource "google_project_iam_member" "gateway_tasks" {
  project = var.project_id
  role    = "roles/cloudtasks.enqueuer"
  member  = "serviceAccount:${google_service_account.gateway.email}"
}

resource "google_service_account_iam_member" "gateway_can_attach_tasks_identity" {
  service_account_id = google_service_account.tasks.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.gateway.email}"
}

resource "google_secret_manager_secret_iam_member" "gateway_database_password" {
  secret_id = google_secret_manager_secret.database_password.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.gateway.email}"
}

resource "google_cloud_run_v2_service" "gateway" {
  name     = local.name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"
  template {
    service_account = google_service_account.gateway.email
    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }
    vpc_access {
      network_interfaces {
        network    = google_compute_network.gateway.name
        subnetwork = google_compute_subnetwork.gateway.name
      }
      egress = "PRIVATE_RANGES_ONLY"
    }
    containers {
      image = var.container_image
      ports {
        container_port = 8084
      }
      resources {
        limits = {
          cpu    = "1"
          memory = "1Gi"
        }
      }
      dynamic "env" {
        for_each = local.common_env
        content {
          name  = env.key
          value = env.value
        }
      }
      env {
        name = "SPRING_DATASOURCE_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.database_password.secret_id
            version = "latest"
          }
        }
      }
    }
  }
  depends_on = [google_sql_user.gateway]
}

resource "google_cloud_run_v2_service_iam_member" "public_gateway" {
  name     = google_cloud_run_v2_service.gateway.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_job" "maintenance" {
  for_each = toset(["dispatch", "cleanup"])
  name     = "${local.name}-${each.key}"
  location = var.region
  template {
    template {
      service_account = google_service_account.gateway.email
      max_retries     = 0
      timeout         = "600s"
      vpc_access {
        network_interfaces {
          network    = google_compute_network.gateway.name
          subnetwork = google_compute_subnetwork.gateway.name
        }
        egress = "PRIVATE_RANGES_ONLY"
      }
      containers {
        image   = var.container_image
        command = ["java"]
        args    = ["-jar", "app.jar", "--spring.main.web-application-type=none", "--spring.profiles.active=${each.key}-job"]
        dynamic "env" {
          for_each = local.common_env
          content {
            name  = env.key
            value = env.value
          }
        }
        env {
          name = "SPRING_DATASOURCE_PASSWORD"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.database_password.secret_id
              version = "latest"
            }
          }
        }
      }
    }
  }
}

resource "google_cloud_run_v2_job_iam_member" "scheduler_job_invoker" {
  for_each = google_cloud_run_v2_job.maintenance
  project  = var.project_id
  name     = each.value.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.maintenance.email}"
}

resource "google_cloud_scheduler_job" "maintenance" {
  for_each = {
    dispatch = "* * * * *"
    cleanup  = "*/5 * * * *"
  }
  name      = "${local.name}-${each.key}"
  region    = var.region
  schedule  = each.value
  time_zone = "Etc/UTC"
  http_target {
    http_method = "POST"
    uri         = "https://${var.region}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${var.project_id}/jobs/${google_cloud_run_v2_job.maintenance[each.key].name}:run"
    oauth_token {
      service_account_email = google_service_account.maintenance.email
    }
  }
  depends_on = [google_cloud_run_v2_job_iam_member.scheduler_job_invoker]
}

resource "google_monitoring_alert_policy" "gateway_5xx" {
  display_name = "Translation gateway 5xx"
  combiner     = "OR"
  conditions {
    display_name = "Cloud Run 5xx responses"
    condition_threshold {
      filter          = "resource.type = \"cloud_run_revision\" AND resource.labels.service_name = \"${local.name}\" AND metric.type = \"run.googleapis.com/request_count\" AND metric.labels.response_code_class = \"5xx\""
      comparison      = "COMPARISON_GT"
      threshold_value = 0
      duration        = "300s"
      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }
  notification_channels = []
}
