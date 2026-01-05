#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# SmelterOS Emergency Rollback Script
# Immediately rolls back to the last stable revision
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-smelteros}"
REGION="${GCP_REGION:-us-central1}"
API_SERVICE="${API_SERVICE:-smelteros-api}"
WORKER_SERVICE="${WORKER_SERVICE:-smelteros-workers}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Get the second-to-last revision (previous stable)
get_previous_revision() {
    local service="$1"
    gcloud run revisions list \
        --project="$PROJECT_ID" \
        --region="$REGION" \
        --service="$service" \
        --sort-by="~metadata.creationTimestamp" \
        --format="value(metadata.name)" \
        --limit=2 | tail -1
}

# Get current serving revision
get_current_revision() {
    local service="$1"
    gcloud run services describe "$service" \
        --project="$PROJECT_ID" \
        --region="$REGION" \
        --format="value(status.traffic[0].revisionName)"
}

# Rollback a service
rollback_service() {
    local service="$1"
    local target_revision="$2"
    
    log_warning "Rolling back $service to $target_revision..."
    
    gcloud run services update-traffic "$service" \
        --project="$PROJECT_ID" \
        --region="$REGION" \
        --to-revisions="$target_revision=100" \
        --quiet
    
    log_success "$service rolled back to $target_revision"
}

# Main rollback
emergency_rollback() {
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "              🚨 EMERGENCY ROLLBACK 🚨"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    
    local rollback_target="${1:-previous}"
    
    # Rollback API service
    echo "📦 API Service ($API_SERVICE):"
    local api_current=$(get_current_revision "$API_SERVICE")
    echo "   Current: $api_current"
    
    if [ "$rollback_target" = "previous" ]; then
        local api_target=$(get_previous_revision "$API_SERVICE")
    else
        local api_target="$rollback_target"
    fi
    echo "   Target:  $api_target"
    
    rollback_service "$API_SERVICE" "$api_target"
    
    # Rollback Worker service
    echo ""
    echo "📦 Worker Service ($WORKER_SERVICE):"
    local worker_current=$(get_current_revision "$WORKER_SERVICE")
    echo "   Current: $worker_current"
    
    if [ "$rollback_target" = "previous" ]; then
        local worker_target=$(get_previous_revision "$WORKER_SERVICE")
    else
        local worker_target="$rollback_target"
    fi
    echo "   Target:  $worker_target"
    
    rollback_service "$WORKER_SERVICE" "$worker_target"
    
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    log_success "Emergency rollback complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Monitor error rates in Cloud Console"
    echo "  2. Check application logs for issues"
    echo "  3. Investigate root cause before redeploying"
    echo ""
}

# Show current status
show_status() {
    echo ""
    echo "Current Deployment Status:"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    
    echo "📦 $API_SERVICE:"
    gcloud run services describe "$API_SERVICE" \
        --project="$PROJECT_ID" \
        --region="$REGION" \
        --format="table(status.traffic.revisionName,status.traffic.percent,status.traffic.tag)"
    
    echo ""
    echo "📦 $WORKER_SERVICE:"
    gcloud run services describe "$WORKER_SERVICE" \
        --project="$PROJECT_ID" \
        --region="$REGION" \
        --format="table(status.traffic.revisionName,status.traffic.percent,status.traffic.tag)"
    
    echo ""
}

# List available revisions
list_revisions() {
    local service="${1:-$API_SERVICE}"
    
    echo ""
    echo "Available revisions for $service:"
    echo "═══════════════════════════════════════════════════════════════"
    
    gcloud run revisions list \
        --project="$PROJECT_ID" \
        --region="$REGION" \
        --service="$service" \
        --sort-by="~metadata.creationTimestamp" \
        --format="table(metadata.name,metadata.creationTimestamp,status.conditions.status)" \
        --limit=10
}

# Command handling
case "${1:-rollback}" in
    rollback)
        emergency_rollback "${2:-previous}"
        ;;
    status)
        show_status
        ;;
    revisions)
        list_revisions "${2:-$API_SERVICE}"
        ;;
    help)
        echo "Usage: $0 {rollback|status|revisions} [revision-name|service-name]"
        echo ""
        echo "Commands:"
        echo "  rollback [revision]  - Rollback to previous or specified revision"
        echo "  status               - Show current deployment status"
        echo "  revisions [service]  - List available revisions"
        ;;
    *)
        echo "Usage: $0 {rollback|status|revisions|help}"
        exit 1
        ;;
esac
