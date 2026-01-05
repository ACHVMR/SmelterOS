#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# SmelterOS Canary Deployment Script
# Implements progressive traffic shifting for safe production deployments
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-smelteros}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="${SERVICE_NAME:-smelteros-api}"
CANARY_PERCENTAGE="${CANARY_PERCENTAGE:-5}"
MONITORING_DURATION="${MONITORING_DURATION:-300}"  # 5 minutes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Print banner
print_banner() {
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "           SmelterOS Canary Deployment"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "  Project:     $PROJECT_ID"
    echo "  Region:      $REGION"
    echo "  Service:     $SERVICE_NAME"
    echo "  Canary %:    $CANARY_PERCENTAGE%"
    echo ""
}

# Get current revision info
get_current_revision() {
    gcloud run services describe "$SERVICE_NAME" \
        --project="$PROJECT_ID" \
        --region="$REGION" \
        --format="value(status.traffic[0].revisionName)"
}

# Get latest revision info
get_latest_revision() {
    gcloud run services describe "$SERVICE_NAME" \
        --project="$PROJECT_ID" \
        --region="$REGION" \
        --format="value(status.latestReadyRevisionName)"
}

# Deploy new revision without traffic
deploy_canary_revision() {
    local image_tag="$1"
    
    log_info "Deploying canary revision (no traffic)..."
    
    gcloud run deploy "$SERVICE_NAME" \
        --project="$PROJECT_ID" \
        --region="$REGION" \
        --image="gcr.io/$PROJECT_ID/$SERVICE_NAME:$image_tag" \
        --no-traffic \
        --tag="canary" \
        --quiet
    
    log_success "Canary revision deployed"
}

# Set traffic split
set_traffic_split() {
    local stable_revision="$1"
    local canary_revision="$2"
    local canary_percent="$3"
    local stable_percent=$((100 - canary_percent))
    
    log_info "Setting traffic split: $stable_percent% stable, $canary_percent% canary"
    
    gcloud run services update-traffic "$SERVICE_NAME" \
        --project="$PROJECT_ID" \
        --region="$REGION" \
        --to-revisions="$stable_revision=$stable_percent,$canary_revision=$canary_percent" \
        --quiet
    
    log_success "Traffic split configured"
}

# Promote canary to 100%
promote_canary() {
    local canary_revision="$1"
    
    log_info "Promoting canary to 100% traffic..."
    
    gcloud run services update-traffic "$SERVICE_NAME" \
        --project="$PROJECT_ID" \
        --region="$REGION" \
        --to-revisions="$canary_revision=100" \
        --quiet
    
    log_success "Canary promoted to production"
}

# Rollback to stable
rollback_to_stable() {
    local stable_revision="$1"
    
    log_warning "Rolling back to stable revision: $stable_revision"
    
    gcloud run services update-traffic "$SERVICE_NAME" \
        --project="$PROJECT_ID" \
        --region="$REGION" \
        --to-revisions="$stable_revision=100" \
        --quiet
    
    log_success "Rollback complete"
}

# Check canary health
check_canary_health() {
    local canary_url="$1"
    local max_errors=3
    local error_count=0
    
    log_info "Checking canary health at $canary_url..."
    
    for i in {1..5}; do
        response=$(curl -s -o /dev/null -w "%{http_code}" "$canary_url/health" || echo "000")
        
        if [ "$response" != "200" ]; then
            error_count=$((error_count + 1))
            log_warning "Health check $i failed (HTTP $response)"
        else
            log_success "Health check $i passed"
        fi
        
        sleep 2
    done
    
    if [ $error_count -ge $max_errors ]; then
        return 1
    fi
    
    return 0
}

# Monitor canary metrics
monitor_canary() {
    local duration="$1"
    local start_time=$(date +%s)
    local end_time=$((start_time + duration))
    
    log_info "Monitoring canary for ${duration}s..."
    
    while [ $(date +%s) -lt $end_time ]; do
        # Query error rate from Cloud Monitoring
        error_rate=$(gcloud monitoring metrics list \
            --project="$PROJECT_ID" \
            --filter="metric.type=\"run.googleapis.com/request_count\" AND resource.labels.service_name=\"$SERVICE_NAME\"" \
            --format="value(points.value.int64Value)" 2>/dev/null | head -1 || echo "0")
        
        remaining=$((end_time - $(date +%s)))
        echo -ne "\r  Time remaining: ${remaining}s | Error rate: ${error_rate:-0}"
        
        # Check if error rate is too high
        if [ "${error_rate:-0}" -gt 10 ]; then
            echo ""
            return 1
        fi
        
        sleep 10
    done
    
    echo ""
    return 0
}

# Progressive rollout
progressive_rollout() {
    local stable_revision="$1"
    local canary_revision="$2"
    local percentages=(5 10 25 50 75 100)
    
    for percent in "${percentages[@]}"; do
        log_info "Increasing canary traffic to $percent%..."
        
        if [ "$percent" -eq 100 ]; then
            promote_canary "$canary_revision"
        else
            set_traffic_split "$stable_revision" "$canary_revision" "$percent"
        fi
        
        # Monitor at each stage
        if ! monitor_canary 60; then
            log_error "Canary failed at $percent% traffic"
            rollback_to_stable "$stable_revision"
            return 1
        fi
        
        log_success "Canary stable at $percent%"
    done
    
    return 0
}

# Main deployment flow
main() {
    local image_tag="${1:-latest}"
    
    print_banner
    
    # Get current state
    local stable_revision=$(get_current_revision)
    log_info "Current stable revision: $stable_revision"
    
    # Deploy canary
    deploy_canary_revision "$image_tag"
    
    local canary_revision=$(get_latest_revision)
    log_info "Canary revision: $canary_revision"
    
    # Get canary URL
    local canary_url=$(gcloud run services describe "$SERVICE_NAME" \
        --project="$PROJECT_ID" \
        --region="$REGION" \
        --format="value(status.url)")
    
    # Initial health check
    if ! check_canary_health "$canary_url"; then
        log_error "Canary failed initial health checks"
        rollback_to_stable "$stable_revision"
        exit 1
    fi
    
    # Set initial traffic split
    set_traffic_split "$stable_revision" "$canary_revision" "$CANARY_PERCENTAGE"
    
    # Monitor initial deployment
    log_info "Monitoring initial canary deployment..."
    if ! monitor_canary "$MONITORING_DURATION"; then
        log_error "Canary failed during initial monitoring"
        rollback_to_stable "$stable_revision"
        exit 1
    fi
    
    # Ask for progressive rollout
    read -p "Canary is stable. Proceed with progressive rollout? (y/n): " proceed
    
    if [ "$proceed" = "y" ] || [ "$proceed" = "Y" ]; then
        if progressive_rollout "$stable_revision" "$canary_revision"; then
            log_success "Deployment complete! Canary is now production."
        else
            exit 1
        fi
    else
        log_warning "Progressive rollout cancelled. Canary remains at $CANARY_PERCENTAGE%"
        log_info "To promote: ./canary-deploy.sh promote"
        log_info "To rollback: ./canary-deploy.sh rollback"
    fi
}

# Command handling
case "${1:-deploy}" in
    deploy)
        main "${2:-latest}"
        ;;
    promote)
        canary_revision=$(get_latest_revision)
        promote_canary "$canary_revision"
        ;;
    rollback)
        stable_revision=$(get_current_revision)
        rollback_to_stable "$stable_revision"
        ;;
    status)
        gcloud run services describe "$SERVICE_NAME" \
            --project="$PROJECT_ID" \
            --region="$REGION" \
            --format="table(status.traffic.revisionName,status.traffic.percent,status.traffic.tag)"
        ;;
    *)
        echo "Usage: $0 {deploy|promote|rollback|status} [image-tag]"
        exit 1
        ;;
esac
