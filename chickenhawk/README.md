# Chickenhawk Fleet Architecture

> **SmelterOS Unified Container Fleet Topology**

## Overview

Chickenhawk is the unified container orchestration layer for SmelterOS. It provides a decoupled, Cloud Run-first architecture governed by the **Oracle Gateway** and optimized by **Confucius**.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    (apps/web - Next.js)                          │
│                           │                                      │
│                    /api/orchestrate                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ORACLE GATEWAY                                │
│                 (chickenhawk-oracle)                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ • Policy Enforcement (policy.json)                        │   │
│  │ • Request Authentication                                  │   │
│  │ • Intent-Based Routing                                    │   │
│  │ • Service-to-Service Communication                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┬───────────────┐
            ▼               ▼               ▼               ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│   II-AGENT    │ │    CODEX      │ │   CONFUCIUS   │ │BILLING-BRIDGE │
│               │ │               │ │               │ │               │
│ • Task Exec   │ │ • Code Gen    │ │ • Prompt Opt  │ │ • Stripe      │
│ • Tool Use    │ │ • Code Review │ │ • Feedback    │ │ • Resend      │
│ • Agentic     │ │ • Explain     │ │ • Metrics     │ │ • Webhooks    │
└───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘
```

## Services

### Oracle Gateway (`/chickenhawk/services/oracle-gateway`)
- **Port**: 8090 (local), 8080 (Cloud Run)
- **Endpoints**:
  - `GET /` - Health check
  - `POST /orchestrate` - Main request router
  - `GET /policy` - Current policy configuration

### II-Agent (`/chickenhawk/services/ii-agent`)
- **Port**: 8091 (local)
- **Endpoints**:
  - `GET /` - Health check
  - `POST /run` - Execute agentic task
  - `GET /tools` - List available tools

### Codex (`/chickenhawk/services/codex`)
- **Port**: 8092 (local)
- **Endpoints**:
  - `GET /` - Health check
  - `POST /generate` - Generate code from prompt
  - `POST /review` - Review code for issues
  - `POST /explain` - Explain code functionality

### Confucius (`/chickenhawk/services/confucius`)
- **Port**: 8093 (local)
- **Endpoints**:
  - `GET /` - Health check
  - `POST /ingest` - Ingest feedback for optimization

### Billing Bridge (`/chickenhawk/services/billing-bridge`)
- **Port**: 8094 (local)
- **Endpoints**:
  - `GET /` - Health check
  - `POST /checkout/create` - Create Stripe checkout session
  - `POST /portal/create` - Create customer portal session
  - `POST /webhook/stripe` - Handle Stripe webhooks
  - `POST /email/send` - Send transactional email via Resend
  - `GET /subscription/{user_id}` - Get subscription status

## Policy Configuration

Location: `chickenhawk/services/oracle-gateway/policy.json`

```json
{
  "guards": {
    "max_spend_per_session": 5.00,
    "allowed_domains": ["api.openai.com", "api.anthropic.com", "api.google.com", "api.stripe.com"],
    "forbidden_tools": ["system.delete_root", "network.scan_local"],
    "require_human_approval": ["payment.execute", "infra.destroy"]
  },
  "routing": {
    "default": "ii-agent",
    "general": "ii-agent",
    "research": "ii-researcher",
    "code": "codex",
    "billing": "billing-bridge"
  }
}
```

## Local Development

```bash
# Start the fleet
cd chickenhawk/services
docker compose up --build -d

# Verify services
curl http://localhost:8090/    # Oracle Gateway
curl http://localhost:8091/    # II-Agent
curl http://localhost:8092/    # Codex
curl http://localhost:8093/    # Confucius
curl http://localhost:8094/    # Billing Bridge

# Start frontend
cd apps/web
npm run dev
```

## Cloud Run Deployment

```bash
# Submit build from project root
gcloud builds submit --config chickenhawk/infra/gcp/cloudrun/cloudbuild.yaml .
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `URL_II_AGENT` | II-Agent service URL | Cloud Run |
| `URL_CODEX` | Codex service URL | Cloud Run |
| `URL_BILLING` | Billing Bridge URL | Cloud Run |
| `STRIPE_SECRET_KEY` | Stripe API secret key | Production |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Production |
| `RESEND_API_KEY` | Resend email API key | Production |

## Security Considerations

1. **Oracle Gateway** is the ONLY public-facing service
2. Internal services use `--no-allow-unauthenticated` on Cloud Run
3. Service-to-service auth uses Cloud Run's IAM invoker permissions
4. Policy rules are immutable in `policy.json`, dynamic overrides via Firestore

---

*Antigravity Builder • SmelterOS v2.1.0*
