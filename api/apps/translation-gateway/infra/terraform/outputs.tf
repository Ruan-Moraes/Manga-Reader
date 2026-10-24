output "gateway_url" {
  value = google_cloud_run_v2_service.gateway.uri
}

output "temporary_bucket" {
  value = google_storage_bucket.temporary_media.name
}

output "database_private_ip" {
  value     = google_sql_database_instance.gateway.private_ip_address
  sensitive = true
}

output "gateway_enabled" {
  value = var.gateway_enabled
}
