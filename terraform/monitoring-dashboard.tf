# Cloud Monitoring Dashboard Configuration
# SmelterOS Production Monitoring Dashboard
# Terraform configuration for GCP Cloud Monitoring

resource "google_monitoring_dashboard" "smelteros_production" {
  dashboard_json = jsonencode({
    displayName = "SmelterOS Production Dashboard"
    labels = {
      environment = "production"
    }
    
    mosaicLayout = {
      columns = 12
      tiles = [
        # Row 1: Overview metrics
        {
          xPos   = 0
          yPos   = 0
          width  = 4
          height = 4
          widget = {
            title = "Request Rate"
            xyChart = {
              dataSets = [{
                timeSeriesQuery = {
                  prometheusQuery = "rate(run_googleapis_com:request_count{service_name=\"smelteros-api\"}[5m])"
                }
                plotType = "LINE"
              }]
              timeshiftDuration = "0s"
              yAxis = {
                label = "requests/sec"
                scale = "LINEAR"
              }
            }
          }
        },
        {
          xPos   = 4
          yPos   = 0
          width  = 4
          height = 4
          widget = {
            title = "p95 Latency"
            xyChart = {
              dataSets = [{
                timeSeriesQuery = {
                  prometheusQuery = "histogram_quantile(0.95, rate(run_googleapis_com:request_latencies_bucket{service_name=\"smelteros-api\"}[5m]))"
                }
                plotType = "LINE"
              }]
              thresholds = [{
                value          = 50
                color          = "RED"
                direction      = "ABOVE"
                label          = "SLO Threshold"
                targetAxis     = "Y1"
              }]
              yAxis = {
                label = "ms"
                scale = "LINEAR"
              }
            }
          }
        },
        {
          xPos   = 8
          yPos   = 0
          width  = 4
          height = 4
          widget = {
            title = "Error Rate"
            xyChart = {
              dataSets = [{
                timeSeriesQuery = {
                  prometheusQuery = "sum(rate(run_googleapis_com:request_count{service_name=\"smelteros-api\",response_code_class!=\"2xx\"}[5m])) / sum(rate(run_googleapis_com:request_count{service_name=\"smelteros-api\"}[5m])) * 100"
                }
                plotType = "LINE"
              }]
              thresholds = [{
                value          = 0.1
                color          = "RED"
                direction      = "ABOVE"
                label          = "SLO Threshold"
                targetAxis     = "Y1"
              }]
              yAxis = {
                label = "%"
                scale = "LINEAR"
              }
            }
          }
        },

        # Row 2: Service metrics
        {
          xPos   = 0
          yPos   = 4
          width  = 6
          height = 4
          widget = {
            title = "Cloud Run Instance Count"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    prometheusQuery = "run_googleapis_com:container_instance_count{service_name=\"smelteros-api\"}"
                  }
                  plotType   = "LINE"
                  legendTemplate = "API"
                },
                {
                  timeSeriesQuery = {
                    prometheusQuery = "run_googleapis_com:container_instance_count{service_name=\"smelteros-workers\"}"
                  }
                  plotType   = "LINE"
                  legendTemplate = "Workers"
                }
              ]
              yAxis = {
                label = "instances"
                scale = "LINEAR"
              }
            }
          }
        },
        {
          xPos   = 6
          yPos   = 4
          width  = 6
          height = 4
          widget = {
            title = "Container CPU Utilization"
            xyChart = {
              dataSets = [{
                timeSeriesQuery = {
                  prometheusQuery = "avg(run_googleapis_com:container_cpu_utilization{service_name=~\"smelteros-.*\"})"
                }
                plotType = "LINE"
              }]
              thresholds = [{
                value          = 80
                color          = "YELLOW"
                direction      = "ABOVE"
                label          = "Warning"
                targetAxis     = "Y1"
              }]
              yAxis = {
                label = "%"
                scale = "LINEAR"
              }
            }
          }
        },

        # Row 3: Pub/Sub metrics
        {
          xPos   = 0
          yPos   = 8
          width  = 4
          height = 4
          widget = {
            title = "Pub/Sub Message Backlog"
            xyChart = {
              dataSets = [{
                timeSeriesQuery = {
                  prometheusQuery = "sum(pubsub_googleapis_com:subscription_num_undelivered_messages{subscription_id=~\"smelteros-.*\"})"
                }
                plotType = "STACKED_AREA"
              }]
              thresholds = [{
                value          = 1000
                color          = "RED"
                direction      = "ABOVE"
                label          = "Backlog Alert"
                targetAxis     = "Y1"
              }]
              yAxis = {
                label = "messages"
                scale = "LINEAR"
              }
            }
          }
        },
        {
          xPos   = 4
          yPos   = 8
          width  = 4
          height = 4
          widget = {
            title = "Pub/Sub Publish Rate"
            xyChart = {
              dataSets = [{
                timeSeriesQuery = {
                  prometheusQuery = "rate(pubsub_googleapis_com:topic_message_count{topic_id=~\"smelteros-.*\"}[5m])"
                }
                plotType = "LINE"
              }]
              yAxis = {
                label = "messages/sec"
                scale = "LINEAR"
              }
            }
          }
        },
        {
          xPos   = 8
          yPos   = 8
          width  = 4
          height = 4
          widget = {
            title = "Pub/Sub Ack Latency"
            xyChart = {
              dataSets = [{
                timeSeriesQuery = {
                  prometheusQuery = "histogram_quantile(0.95, rate(pubsub_googleapis_com:subscription_ack_latencies_bucket{subscription_id=~\"smelteros-.*\"}[5m]))"
                }
                plotType = "LINE"
              }]
              yAxis = {
                label = "ms"
                scale = "LINEAR"
              }
            }
          }
        },

        # Row 4: Firestore metrics
        {
          xPos   = 0
          yPos   = 12
          width  = 6
          height = 4
          widget = {
            title = "Firestore Read/Write Operations"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    prometheusQuery = "rate(firestore_googleapis_com:document_read_count[5m])"
                  }
                  plotType       = "LINE"
                  legendTemplate = "Reads"
                },
                {
                  timeSeriesQuery = {
                    prometheusQuery = "rate(firestore_googleapis_com:document_write_count[5m])"
                  }
                  plotType       = "LINE"
                  legendTemplate = "Writes"
                }
              ]
              yAxis = {
                label = "ops/sec"
                scale = "LINEAR"
              }
            }
          }
        },
        {
          xPos   = 6
          yPos   = 12
          width  = 6
          height = 4
          widget = {
            title = "GCS Operations"
            xyChart = {
              dataSets = [{
                timeSeriesQuery = {
                  prometheusQuery = "rate(storage_googleapis_com:api_request_count{bucket_name=~\"smelteros-.*\"}[5m])"
                }
                plotType = "LINE"
              }]
              yAxis = {
                label = "requests/sec"
                scale = "LINEAR"
              }
            }
          }
        },

        # Row 5: Agent metrics
        {
          xPos   = 0
          yPos   = 16
          width  = 4
          height = 4
          widget = {
            title = "Active Sessions"
            scorecard = {
              timeSeriesQuery = {
                prometheusQuery = "sum(smelteros_active_sessions)"
              }
              sparkChartView = {
                sparkChartType = "SPARK_LINE"
              }
            }
          }
        },
        {
          xPos   = 4
          yPos   = 16
          width  = 4
          height = 4
          widget = {
            title = "Tasks Processed (24h)"
            scorecard = {
              timeSeriesQuery = {
                prometheusQuery = "sum(increase(smelteros_tasks_completed_total[24h]))"
              }
              sparkChartView = {
                sparkChartType = "SPARK_LINE"
              }
            }
          }
        },
        {
          xPos   = 8
          yPos   = 16
          width  = 4
          height = 4
          widget = {
            title = "Agent Task Distribution"
            pieChart = {
              dataSets = [{
                timeSeriesQuery = {
                  prometheusQuery = "sum by(agent_role) (smelteros_tasks_completed_total)"
                }
              }]
              chartType = "DONUT"
            }
          }
        },

        # Row 6: Alerts summary
        {
          xPos   = 0
          yPos   = 20
          width  = 12
          height = 4
          widget = {
            title = "Recent Alerts"
            alertChart = {
              name = "projects/smelteros/alertPolicies/-"
            }
          }
        }
      ]
    }
  })
}

# Alert Policies
resource "google_monitoring_alert_policy" "p95_latency" {
  display_name = "SmelterOS p95 Latency > 50ms"
  project      = var.project_id
  combiner     = "OR"

  conditions {
    display_name = "Cloud Run p95 latency"
    condition_threshold {
      filter          = "resource.type = \"cloud_run_revision\" AND resource.labels.service_name = \"smelteros-api\" AND metric.type = \"run.googleapis.com/request_latencies\""
      duration        = "60s"
      comparison      = "COMPARISON_GT"
      threshold_value = 50
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_PERCENTILE_95"
        cross_series_reducer = "REDUCE_MEAN"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.slack.name]
  
  alert_strategy {
    auto_close = "1800s"
  }
}

resource "google_monitoring_alert_policy" "error_rate" {
  display_name = "SmelterOS Error Rate > 0.1%"
  project      = var.project_id
  combiner     = "OR"

  conditions {
    display_name = "Cloud Run error rate"
    condition_threshold {
      filter          = "resource.type = \"cloud_run_revision\" AND resource.labels.service_name = \"smelteros-api\" AND metric.type = \"run.googleapis.com/request_count\" AND metric.labels.response_code_class != \"2xx\""
      duration        = "120s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.001
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_SUM"
      }
    }
  }

  notification_channels = [
    google_monitoring_notification_channel.slack.name,
    google_monitoring_notification_channel.pagerduty.name
  ]
  
  alert_strategy {
    auto_close = "1800s"
  }
}

resource "google_monitoring_alert_policy" "pubsub_backlog" {
  display_name = "SmelterOS Pub/Sub Backlog > 1000"
  project      = var.project_id
  combiner     = "OR"

  conditions {
    display_name = "Pub/Sub message backlog"
    condition_threshold {
      filter          = "resource.type = \"pubsub_subscription\" AND resource.labels.subscription_id = monitoring.regex.full_match(\"smelteros-.*\")"
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 1000
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_MEAN"
        cross_series_reducer = "REDUCE_SUM"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.slack.name]
  
  alert_strategy {
    auto_close = "3600s"
  }
}

# Notification Channels
resource "google_monitoring_notification_channel" "slack" {
  display_name = "SmelterOS Slack"
  type         = "slack"
  project      = var.project_id

  labels = {
    channel_name = "#smelteros-alerts"
  }

  sensitive_labels {
    auth_token = var.slack_token
  }
}

resource "google_monitoring_notification_channel" "pagerduty" {
  display_name = "SmelterOS PagerDuty"
  type         = "pagerduty"
  project      = var.project_id

  labels = {
    service_key = var.pagerduty_service_key
  }
}

# Variables
variable "project_id" {
  description = "GCP Project ID"
  default     = "smelteros"
}

variable "slack_token" {
  description = "Slack API token for notifications"
  sensitive   = true
}

variable "pagerduty_service_key" {
  description = "PagerDuty service key for escalations"
  sensitive   = true
}
