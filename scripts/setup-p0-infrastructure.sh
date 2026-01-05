#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# SmelterOS v2.0 Phase 0 Infrastructure Setup
# Run this script to provision GCP resources for production deployment
# ═══════════════════════════════════════════════════════════════════════════

set -e

# Configuration
PROJECT_ID="smelteros"
REGION="us-central1"
SERVICE_ACCOUNT="smelter-os-runtime@${PROJECT_ID}.iam.gserviceaccount.com"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           SmelterOS v2.0 Phase 0 Infrastructure Setup         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# 1. PubSub Topics
# ═══════════════════════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Creating PubSub Topics..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Agent Orchestration Topic
gcloud pubsub topics create agent-orchestration \
  --project=${PROJECT_ID} \
  --message-retention-duration=3d \
  --labels=worker=orchestration,tier=critical \
  2>/dev/null || echo "   Topic 'agent-orchestration' already exists"

# Dead Letter Topic
gcloud pubsub topics create dead-letter \
  --project=${PROJECT_ID} \
  --message-retention-duration=14d \
  --labels=worker=dead-letter,tier=critical \
  2>/dev/null || echo "   Topic 'dead-letter' already exists"

echo "   ✓ Topics created"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# 2. PubSub Subscriptions with Dead Letter Policy
# ═══════════════════════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Creating PubSub Subscriptions..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Agent Orchestration Subscription with dead letter policy
gcloud pubsub subscriptions create agent-orchestrator \
  --project=${PROJECT_ID} \
  --topic=agent-orchestration \
  --ack-deadline=60 \
  --min-retry-delay=5s \
  --max-retry-delay=300s \
  --dead-letter-topic=projects/${PROJECT_ID}/topics/dead-letter \
  --max-delivery-attempts=5 \
  --expiration-period=never \
  2>/dev/null || echo "   Subscription 'agent-orchestrator' already exists"

# Dead Letter Subscription
gcloud pubsub subscriptions create dead-letter-handler \
  --project=${PROJECT_ID} \
  --topic=dead-letter \
  --ack-deadline=600 \
  --min-retry-delay=60s \
  --max-retry-delay=3600s \
  --expiration-period=never \
  2>/dev/null || echo "   Subscription 'dead-letter-handler' already exists"

echo "   ✓ Subscriptions created with dead letter policy"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# 3. Firestore Composite Indexes
# ═══════════════════════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Creating Firestore Composite Indexes..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# orchestration-results collection
gcloud firestore indexes composite create \
  --project=${PROJECT_ID} \
  --collection-group=orchestration-results \
  --field-config field-path=taskId,order=ASCENDING \
  --field-config field-path=status,order=ASCENDING \
  --field-config field-path=timestamp,order=DESCENDING \
  2>/dev/null || echo "   Index for 'orchestration-results' already exists or pending"

# delegation-results collection
gcloud firestore indexes composite create \
  --project=${PROJECT_ID} \
  --collection-group=delegation-results \
  --field-config field-path=parentTaskId,order=ASCENDING \
  --field-config field-path=status,order=ASCENDING \
  --field-config field-path=delegatedAt,order=DESCENDING \
  2>/dev/null || echo "   Index for 'delegation-results' already exists or pending"

# delegation-states collection
gcloud firestore indexes composite create \
  --project=${PROJECT_ID} \
  --collection-group=delegation-states \
  --field-config field-path=id,order=ASCENDING \
  --field-config field-path=updatedAt,order=DESCENDING \
  2>/dev/null || echo "   Index for 'delegation-states' already exists or pending"

# audit-logs collection
gcloud firestore indexes composite create \
  --project=${PROJECT_ID} \
  --collection-group=audit-logs \
  --field-config field-path=type,order=ASCENDING \
  --field-config field-path=severity,order=ASCENDING \
  --field-config field-path=timestamp,order=DESCENDING \
  2>/dev/null || echo "   Index for 'audit-logs' already exists or pending"

# dead-letter-records collection
gcloud firestore indexes composite create \
  --project=${PROJECT_ID} \
  --collection-group=dead-letter-records \
  --field-config field-path=status,order=ASCENDING \
  --field-config field-path=originalTopic,order=ASCENDING \
  --field-config field-path=lastFailedAt,order=DESCENDING \
  2>/dev/null || echo "   Index for 'dead-letter-records' already exists or pending"

# escalations collection
gcloud firestore indexes composite create \
  --project=${PROJECT_ID} \
  --collection-group=escalations \
  --field-config field-path=status,order=ASCENDING \
  --field-config field-path=createdAt,order=DESCENDING \
  2>/dev/null || echo "   Index for 'escalations' already exists or pending"

# vault-documents collection (for RAG)
gcloud firestore indexes composite create \
  --project=${PROJECT_ID} \
  --collection-group=vault-documents \
  --field-config field-path=type,order=ASCENDING \
  --field-config field-path=indexedAt,order=DESCENDING \
  2>/dev/null || echo "   Index for 'vault-documents' already exists or pending"

echo "   ✓ Firestore indexes created (may take a few minutes to build)"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# 4. IAM Permissions
# ═══════════════════════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Configuring IAM Permissions..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if service account exists
if gcloud iam service-accounts describe ${SERVICE_ACCOUNT} --project=${PROJECT_ID} >/dev/null 2>&1; then
  echo "   Service account exists: ${SERVICE_ACCOUNT}"
else
  echo "   Creating service account..."
  gcloud iam service-accounts create smelter-os-runtime \
    --project=${PROJECT_ID} \
    --display-name="SmelterOS Runtime Service Account" \
    --description="Service account for SmelterOS worker processes"
fi

# Grant Pub/Sub Publisher role
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/pubsub.publisher" \
  --quiet

# Grant Pub/Sub Subscriber role
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/pubsub.subscriber" \
  --quiet

# Grant Firestore User role
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/datastore.user" \
  --quiet

# Grant Vertex AI User role (for embeddings)
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/aiplatform.user" \
  --quiet

# Grant GCS Object Viewer (for RAG document retrieval)
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/storage.objectViewer" \
  --quiet

# Grant dead letter publish permission to subscription
gcloud pubsub subscriptions add-iam-policy-binding agent-orchestrator \
  --project=${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/pubsub.publisher" \
  --quiet 2>/dev/null || echo "   IAM binding may already exist"

echo "   ✓ IAM permissions configured"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# 5. Enable Required APIs
# ═══════════════════════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Enabling Required GCP APIs..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

gcloud services enable pubsub.googleapis.com --project=${PROJECT_ID} 2>/dev/null || true
gcloud services enable firestore.googleapis.com --project=${PROJECT_ID} 2>/dev/null || true
gcloud services enable aiplatform.googleapis.com --project=${PROJECT_ID} 2>/dev/null || true
gcloud services enable storage.googleapis.com --project=${PROJECT_ID} 2>/dev/null || true

echo "   ✓ APIs enabled"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# 6. Verification
# ═══════════════════════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. Verification..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "PubSub Topics:"
gcloud pubsub topics list --project=${PROJECT_ID} --format="table(name)" | grep -E "(agent-orchestration|dead-letter)" || echo "   No matching topics found"

echo ""
echo "PubSub Subscriptions:"
gcloud pubsub subscriptions list --project=${PROJECT_ID} --format="table(name)" | grep -E "(agent-orchestrator|dead-letter-handler)" || echo "   No matching subscriptions found"

echo ""
echo "Firestore Indexes (building):"
gcloud firestore indexes composite list --project=${PROJECT_ID} --format="table(name,state)" 2>/dev/null | head -10 || echo "   Run 'gcloud firestore indexes composite list' to check status"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    ✅ SETUP COMPLETE                           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Next Steps:"
echo "  1. Wait for Firestore indexes to build (check Firebase Console)"
echo "  2. Set environment variables in Cloud Run deployment"
echo "  3. Deploy the application"
echo ""
echo "Environment Variables Required:"
echo "  GCP_PROJECT_ID=${PROJECT_ID}"
echo "  FIRESTORE_DATABASE=(default)"
echo "  PUBSUB_TOPICS_AGENT_ORCHESTRATION=agent-orchestration"
echo "  PUBSUB_TOPICS_DEAD_LETTER=dead-letter"
echo "  VERTEX_AI_REGION=${REGION}"
echo "  VERTEX_AI_EMBEDDING_MODEL=text-embedding-004"
echo ""
