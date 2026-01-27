#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# SmelterOS Cloud Run Deployment Script
# Deploy all II services to Google Cloud Run
# ═══════════════════════════════════════════════════════════════════════

set -e

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-your-project-id}"
REGION="${GCP_REGION:-us-central1}"
ARTIFACT_REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/smelteros"

echo "═══════════════════════════════════════════════════════════════════════"
echo "  SmelterOS Cloud Run Deployment"
echo "  Project: ${PROJECT_ID}"
echo "  Region: ${REGION}"
echo "═══════════════════════════════════════════════════════════════════════"

# ═══════════════════════════════════════════════════════════════════════
# STEP 1: Enable APIs
# ═══════════════════════════════════════════════════════════════════════
echo ""
echo "Step 1: Enabling APIs..."
gcloud services enable run.googleapis.com --project=${PROJECT_ID}
gcloud services enable cloudbuild.googleapis.com --project=${PROJECT_ID}
gcloud services enable artifactregistry.googleapis.com --project=${PROJECT_ID}
gcloud services enable secretmanager.googleapis.com --project=${PROJECT_ID}

# ═══════════════════════════════════════════════════════════════════════
# STEP 2: Create Artifact Registry
# ═══════════════════════════════════════════════════════════════════════
echo ""
echo "Step 2: Creating Artifact Registry..."
gcloud artifacts repositories create smelteros \
  --repository-format=docker \
  --location=${REGION} \
  --project=${PROJECT_ID} \
  --description="SmelterOS container images" \
  2>/dev/null || echo "Repository already exists"

# ═══════════════════════════════════════════════════════════════════════
# STEP 3: Create Secrets
# ═══════════════════════════════════════════════════════════════════════
echo ""
echo "Step 3: Creating secrets..."

# Create secrets (you'll need to add values later)
create_secret() {
  local name=$1
  gcloud secrets create ${name} --project=${PROJECT_ID} 2>/dev/null || true
  echo "  - Secret '${name}' ready"
}

create_secret "openrouter-api-key"
create_secret "openai-api-key"
create_secret "google-api-key"
create_secret "anthropic-api-key"

echo ""
echo "⚠️  Add your API keys with:"
echo "   echo -n 'YOUR_KEY' | gcloud secrets versions add openrouter-api-key --data-file=-"

# ═══════════════════════════════════════════════════════════════════════
# STEP 4: Build & Push Images
# ═══════════════════════════════════════════════════════════════════════
echo ""
echo "Step 4: Building images (this may take 10-15 minutes)..."

build_and_push() {
  local name=$1
  local context=$2
  local dockerfile=$3
  
  echo "  Building ${name}..."
  
  docker build -t ${ARTIFACT_REGISTRY}/${name}:latest \
    ${dockerfile:+-f ${dockerfile}} \
    ${context}
    
  docker push ${ARTIFACT_REGISTRY}/${name}:latest
  echo "  ✓ ${name} pushed"
}

# Authenticate Docker
gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet

# Build images
build_and_push "avva-noon" "./avva-noon" "./avva-noon/Dockerfile"
build_and_push "ii-agent" "../ii-repos/ii-agent" "../ii-repos/ii-agent/docker/Dockerfile"
# build_and_push "ii-researcher" "../ii-repos/ii-researcher"  # If has Dockerfile
# build_and_push "commonground" "../ii-repos/CommonGround"    # If has Dockerfile

# ═══════════════════════════════════════════════════════════════════════
# STEP 5: Deploy to Cloud Run
# ═══════════════════════════════════════════════════════════════════════
echo ""
echo "Step 5: Deploying to Cloud Run..."

deploy_service() {
  local name=$1
  local port=$2
  local memory=$3
  local cpu=$4
  
  echo "  Deploying ${name}..."
  
  gcloud run deploy ${name} \
    --image=${ARTIFACT_REGISTRY}/${name}:latest \
    --region=${REGION} \
    --platform=managed \
    --allow-unauthenticated \
    --memory=${memory} \
    --cpu=${cpu} \
    --port=${port} \
    --set-secrets="OPENROUTER_API_KEY=openrouter-api-key:latest,GOOGLE_API_KEY=google-api-key:latest" \
    --project=${PROJECT_ID}
    
  local url=$(gcloud run services describe ${name} --region=${REGION} --format='value(status.url)')
  echo "  ✓ ${name} deployed: ${url}"
}

deploy_service "avva-noon" "8080" "2Gi" "2"
deploy_service "ii-agent" "8000" "4Gi" "4"

# Agent Zero (from Docker Hub)
echo "  Deploying agent-zero..."
gcloud run deploy agent-zero \
  --image=agent0ai/agent-zero:latest \
  --region=${REGION} \
  --platform=managed \
  --allow-unauthenticated \
  --memory=8Gi \
  --cpu=4 \
  --port=80 \
  --timeout=3600 \
  --concurrency=10 \
  --min-instances=1 \
  --set-env-vars="CHAT_MODEL_PROVIDER=openrouter,CHAT_MODEL=glw/glm-4-flash,AGENT_NAME=AVVA-NOON" \
  --set-secrets="OPENROUTER_API_KEY=openrouter-api-key:latest,OPENAI_API_KEY=openai-api-key:latest" \
  --project=${PROJECT_ID}

# ═══════════════════════════════════════════════════════════════════════
# STEP 6: Get Service URLs
# ═══════════════════════════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "  Deployment Complete!"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
echo "Service URLs:"
for service in avva-noon ii-agent agent-zero; do
  url=$(gcloud run services describe ${service} --region=${REGION} --format='value(status.url)' 2>/dev/null || echo "Not deployed")
  echo "  ${service}: ${url}"
done

echo ""
echo "Next steps:"
echo "  1. Add API keys to Secret Manager"
echo "  2. Update service URLs in each service's environment"
echo "  3. Test endpoints"
