# SmelterOS GCP Infrastructure Setup Guide

This guide covers the setup of GCP infrastructure for SmelterOS, including:
- OAuth Client ID for authentication
- Vertex AI and Model Garden for AI agents
- Cloud Run Jobs for Boomer_Ang execution

---

## Prerequisites

- GCP Project with billing enabled
- `gcloud` CLI installed and authenticated
- Owner or Editor role on the project

---

## 1. Set Environment Variables

```bash
# Set your project
export GCP_PROJECT_ID="your-project-id"
export GCP_REGION="us-central1"

gcloud config set project $GCP_PROJECT_ID
```

---

## 2. Enable Required APIs

```bash
# Enable all required APIs
gcloud services enable \
  aiplatform.googleapis.com \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  cloudresourcemanager.googleapis.com \
  iam.googleapis.com \
  compute.googleapis.com \
  containerregistry.googleapis.com \
  cloudfunctions.googleapis.com \
  firestore.googleapis.com \
  jobs.googleapis.com

# Verify APIs are enabled
gcloud services list --enabled | grep -E "(aiplatform|run|cloudbuild)"
```

---

## 3. Create OAuth Client ID

### 3.1 Configure OAuth Consent Screen

1. Go to [GCP Console > APIs & Services > OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
2. Select "External" (or Internal for Workspace)
3. Fill in:
   - App name: `SmelterOS`
   - User support email: Your email
   - Developer contact: Your email
4. Add scopes:
   - `openid`
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/cloud-platform`

### 3.2 Create OAuth Client ID

```bash
# Create via console or:
# Go to APIs & Services > Credentials > Create Credentials > OAuth Client ID
# Application type: Web application
# Authorized redirect URIs:
#   - http://localhost:3000/api/auth/callback/google
#   - https://your-cloud-run-url.run.app/api/auth/callback/google
```

Store Client ID and Secret in GitHub Secrets:
- `GCP_OAUTH_CLIENT_ID`
- `GCP_OAUTH_CLIENT_SECRET`

---

## 4. Create Service Account for CI/CD

```bash
# Create service account
gcloud iam service-accounts create smelter-cicd \
  --display-name="SmelterOS CI/CD" \
  --description="Service account for GitHub Actions CI/CD"

# Assign roles
SA_EMAIL="smelter-cicd@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/cloudbuild.builds.editor"

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser"

# Create key for GitHub Actions
gcloud iam service-accounts keys create ./gcp-sa-key.json \
  --iam-account=$SA_EMAIL

# Add to GitHub Secrets as GCP_SA_KEY (base64 encoded content)
cat gcp-sa-key.json | base64
```

---

## 5. Vertex AI Setup

### 5.1 Initialize Vertex AI

```bash
# Create default Vertex AI region
gcloud ai custom-jobs create-config \
  --display-name="smelter-ai-init" \
  --region=$GCP_REGION
```

### 5.2 Create Agent Engine Runtime

```bash
# Enable Agent Engine (Preview)
gcloud beta ai agent-engine enable --project=$GCP_PROJECT_ID --region=$GCP_REGION

# Create agent pool
gcloud beta ai agent-pools create smelter-boomerangs \
  --region=$GCP_REGION \
  --description="Pool for Boomer_Ang agents"
```

### 5.3 Model Garden Access

1. Go to [Vertex AI > Model Garden](https://console.cloud.google.com/vertex-ai/model-garden)
2. Enable models:
   - **Gemini 2.0 Flash** (Primary)
   - **Claude 3.5 Sonnet** (via Model Garden)
   - **Gemma** (Function calling)

---

## 6. Cloud Run Jobs for Boomer_Angs

### 6.1 Create Job Template

```bash
# Create Cloud Run Job for agent execution
gcloud run jobs create boomerang-executor \
  --region=$GCP_REGION \
  --image=gcr.io/$GCP_PROJECT_ID/boomerang-executor:latest \
  --set-env-vars="GCP_PROJECT_ID=$GCP_PROJECT_ID,GCP_REGION=$GCP_REGION" \
  --set-secrets="GEMINI_API_KEY=gemini-api-key:latest" \
  --memory=2Gi \
  --cpu=2 \
  --task-timeout=3600 \
  --max-retries=3 \
  --parallelism=10
```

### 6.2 Execute Job

```bash
# Run a job execution
gcloud run jobs execute boomerang-executor \
  --region=$GCP_REGION \
  --args="--agent-type=researcher,--prompt='Research AI trends'"
```

---

## 7. Secret Manager Setup

```bash
# Create secrets for the application
echo -n "your-jwt-secret" | gcloud secrets create jwt-secret --data-file=-
echo -n "your-gemini-api-key" | gcloud secrets create gemini-api-key --data-file=-
echo -n "your-openai-api-key" | gcloud secrets create openai-api-key --data-file=-
echo -n "your-anthropic-api-key" | gcloud secrets create anthropic-api-key --data-file=-

# Grant access to Cloud Run service account
gcloud secrets add-iam-policy-binding jwt-secret \
  --member="serviceAccount:${GCP_PROJECT_ID}@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 8. GitHub Secrets Required

Add these secrets to your GitHub repository:

| Secret | Description |
|--------|-------------|
| `GCP_PROJECT_ID` | Your GCP project ID |
| `GCP_SA_KEY` | Base64-encoded service account key JSON |
| `GCP_OAUTH_CLIENT_ID` | OAuth Client ID |
| `GCP_OAUTH_CLIENT_SECRET` | OAuth Client Secret |
| `SNYK_TOKEN` | (Optional) Snyk security scanning |
| `SLACK_WEBHOOK_URL` | (Optional) Slack notifications |

---

## 9. Verify Setup

```bash
# Verify Vertex AI
gcloud ai models list --region=$GCP_REGION

# Verify Cloud Run
gcloud run services list --region=$GCP_REGION

# Verify APIs
gcloud services list --enabled | grep aiplatform

# Test agent creation
python -c "
from google.cloud import aiplatform
aiplatform.init(project='$GCP_PROJECT_ID', location='$GCP_REGION')
print('Vertex AI initialized successfully!')
"
```

---

## 10. Next Steps

1. Run the CI/CD pipeline: Push to `main` branch
2. Verify Cloud Run deployment
3. Test AgentForge from the landing page
4. Monitor agent executions in Cloud Run Jobs

---

## Troubleshooting

### API Not Enabled
```bash
gcloud services enable aiplatform.googleapis.com
```

### Permission Denied
```bash
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:YOUR_SA@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.admin"
```

### Cloud Run Job Timeout
Increase timeout in job config:
```bash
gcloud run jobs update boomerang-executor --task-timeout=7200
```
