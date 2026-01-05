# SmelterOS v2.0 Phase 0 Infrastructure Setup (PowerShell)
# Usage: .\Setup-P0Infrastructure.ps1 -ProjectId "gen-lang-client-0618301038"

param(
    [Parameter()]
    [string]$ProjectId = "gen-lang-client-0618301038"
)

$ErrorActionPreference = "Continue"

# Configuration
$PROJECT_ID = $ProjectId
$REGION = "us-central1"
$SERVICE_ACCOUNT = "smelter-os-runtime@$PROJECT_ID.iam.gserviceaccount.com"

Write-Host ""
Write-Host "SmelterOS v2.0 Phase 0 Infrastructure Setup" -ForegroundColor Cyan
Write-Host "Project: $PROJECT_ID"
Write-Host "Region: $REGION"
Write-Host ""

# 1. PubSub Topics
Write-Host "1. Creating PubSub Topics..." -ForegroundColor Yellow

gcloud pubsub topics create agent-orchestration --project=$PROJECT_ID --message-retention-duration=3d 2>$null
if ($LASTEXITCODE -eq 0) { Write-Host "   Created topic agent-orchestration" -ForegroundColor Green }
else { Write-Host "   Topic agent-orchestration already exists" -ForegroundColor Gray }

gcloud pubsub topics create dead-letter --project=$PROJECT_ID --message-retention-duration=14d 2>$null
if ($LASTEXITCODE -eq 0) { Write-Host "   Created topic dead-letter" -ForegroundColor Green }
else { Write-Host "   Topic dead-letter already exists" -ForegroundColor Gray }

Write-Host ""

# 2. PubSub Subscriptions
Write-Host "2. Creating PubSub Subscriptions..." -ForegroundColor Yellow

gcloud pubsub subscriptions create agent-orchestrator --project=$PROJECT_ID --topic=agent-orchestration --ack-deadline=60 --dead-letter-topic="projects/$PROJECT_ID/topics/dead-letter" --max-delivery-attempts=5 2>$null
if ($LASTEXITCODE -eq 0) { Write-Host "   Created subscription agent-orchestrator with dead letter policy" -ForegroundColor Green }
else { Write-Host "   Subscription agent-orchestrator already exists" -ForegroundColor Gray }

gcloud pubsub subscriptions create dead-letter-handler --project=$PROJECT_ID --topic=dead-letter --ack-deadline=600 2>$null
if ($LASTEXITCODE -eq 0) { Write-Host "   Created subscription dead-letter-handler" -ForegroundColor Green }
else { Write-Host "   Subscription dead-letter-handler already exists" -ForegroundColor Gray }

Write-Host ""

# 3. IAM Permissions
Write-Host "3. Configuring IAM Permissions..." -ForegroundColor Yellow

# Create service account if not exists
gcloud iam service-accounts describe $SERVICE_ACCOUNT --project=$PROJECT_ID 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "   Creating service account..." -ForegroundColor Gray
    gcloud iam service-accounts create smelter-os-runtime --project=$PROJECT_ID --display-name="SmelterOS Runtime"
}

$roles = @("roles/pubsub.publisher", "roles/pubsub.subscriber", "roles/datastore.user", "roles/aiplatform.user", "roles/storage.objectViewer")

foreach ($role in $roles) {
    gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SERVICE_ACCOUNT" --role=$role --quiet 2>$null
    Write-Host "   Granted $role" -ForegroundColor Green
}

Write-Host ""

# 4. Enable APIs
Write-Host "4. Enabling Required APIs..." -ForegroundColor Yellow

$apis = @("pubsub.googleapis.com", "firestore.googleapis.com", "aiplatform.googleapis.com", "storage.googleapis.com")
foreach ($api in $apis) {
    gcloud services enable $api --project=$PROJECT_ID 2>$null
    Write-Host "   Enabled $api" -ForegroundColor Green
}

Write-Host ""

# 5. Verification
Write-Host "5. Verification..." -ForegroundColor Yellow
Write-Host ""
Write-Host "PubSub Topics:" -ForegroundColor Cyan
gcloud pubsub topics list --project=$PROJECT_ID --format="value(name)" 2>$null | Select-String -Pattern "(agent-orchestration|dead-letter)"

Write-Host ""
Write-Host "PubSub Subscriptions:" -ForegroundColor Cyan
gcloud pubsub subscriptions list --project=$PROJECT_ID --format="value(name)" 2>$null | Select-String -Pattern "(agent-orchestrator|dead-letter-handler)"

Write-Host ""
Write-Host "SETUP COMPLETE" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Create Firestore indexes via Firebase Console or run:" -ForegroundColor Yellow
Write-Host "  gcloud firestore indexes composite create --project=$PROJECT_ID ..."
Write-Host ""
Write-Host "Environment Variables for Cloud Run:" -ForegroundColor Yellow
Write-Host "  GCP_PROJECT_ID=$PROJECT_ID"
Write-Host "  VERTEX_AI_REGION=$REGION"
Write-Host "  VERTEX_AI_EMBEDDING_MODEL=text-embedding-004"
Write-Host ""
