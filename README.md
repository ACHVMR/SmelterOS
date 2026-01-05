# SmelterOS 🔥

<p align="center">
  <strong>The Foundry — Builder of Ingots</strong><br>
  SmelterOS is the builder. Locale is the build.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-GCP-4285F4?logo=google-cloud" alt="GCP">
  <img src="https://img.shields.io/badge/Database-Firebase-FFCA28?logo=firebase" alt="Firebase">
  <img src="https://img.shields.io/badge/AI-Vertex%20AI-34A853?logo=google" alt="Vertex AI">
  <img src="https://img.shields.io/badge/Tools-Function%20Gemma%20T5-EA4335" alt="Function Gemma T5">
</p>

---

## 🌟 The Foundry Identity

SmelterOS is **The Foundry** — an AI-powered manufacturing system that **smelts** raw blueprints into production-ready **Ingots** (products).

### Core Philosophy

> **"SmelterOS is the builder. Locale is the build."**

- **Ingots** are the products SmelterOS manufactures (Locale, Todd, AchieveMor)
- **Resources** are the Intelligent Internet repositories that power smelting
- **Smelting** is the process of executing a blueprint into running code
- **Gilding** is the refinement phase that adds polish and monitoring

### Infrastructure Priority (HARD RULE)

```
GCP > Firebase > Vertex AI
```

This is NOT cloud agnostic. SmelterOS is built on Google Cloud Platform.

| Layer | Service | Purpose |
|-------|---------|---------|
| **Compute** | Cloud Run | Serverless container execution |
| **Database** | Firestore | Document storage for Vault |
| **Messaging** | Pub/Sub | Async task orchestration |
| **Storage** | Cloud Storage | Artifact persistence |
| **AI/ML** | Vertex AI | Model inference, embeddings |
| **Auth** | Firebase Auth | User authentication |
| **Hosting** | Firebase Hosting | Web app delivery |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    THE FOUNDRY (SmelterOS)                  │
│               Project: smelteros (722121007626)             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    INTERACTIONS API                         │
│            (Main Conduit for ALL Communication)             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Session   │  │  Dispatch   │  │   Vault     │        │
│  │  Manager    │←→│   Router    │←→│   (RAG)     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  FUNCTION GEMMA T5                          │
│              (The Hammer — Tool Execution)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Firestore   │  │  Vertex AI   │  │  Cloud Run   │     │
│  │    Tools     │  │    Tools     │  │    Tools     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                 GOOGLE FILE MANAGER (RAG)                   │
│              (The Vault — Context Retrieval)                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Blueprints │  │  Artifacts  │  │  Resources  │        │
│  │   (Specs)   │  │  (Products) │  │  (II Repos) │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧩 Core Machinery

### Interactions API
The **main conduit** for ALL model and infrastructure communication.

```typescript
import { getInteractionsAPI } from './src/core/interactions-api.js';

const api = getInteractionsAPI();
const session = await api.createSession('Locale');
const result = await api.dispatch(session, {
  target: 'firestore',
  action: 'createCollection',
  payload: { name: 'users' }
});
```

### Function Gemma T5
The **tooling engine** — SmelterOS's hammer for structured tool calling.

```typescript
import { getFunctionGemmaT5 } from './src/core/function-gemma-t5.js';

const gemma = getFunctionGemmaT5();
const result = await gemma.execute('firestore.createCollection', {
  name: 'events',
  schema: { /* ... */ }
});
```

### Google File Manager (RAG)
The **Vault** — context retrieval for Smelting operations.

```typescript
import { getFileManagerRAG } from './src/infrastructure/rag/file-manager.js';

const rag = getFileManagerRAG();
await rag.indexDocument(document);
const context = await rag.retrieveForSmelting('user authentication', 'Locale');
```

---

## 📦 Ingots (Products)

Ingots are the products that SmelterOS smelts and gilds.

| Ingot | Description | Status |
|-------|-------------|--------|
| **Locale** | Location-aware social platform | 🔥 Primary Build |
| **Todd** | AI task delegation assistant | 📋 Blueprint Ready |
| **AchieveMor** | Gamification and achievement system | 🎮 Blueprint Ready |

Each Ingot has a **Blueprint Smelting Specification** in `Ingots/<name>/<name>-Blueprint-Smelting-Spec.md`.

---

## 🌐 Resources (Intelligent Internet)

Resources are the specialized AI repositories that power Smelting.

| Resource | Purpose | Capabilities |
|----------|---------|--------------|
| **ii-agent** | Autonomous task execution | Workflows, automation, API integration |
| **ii-researcher** | Deep research and analysis | Market research, competitor analysis |
| **ii-thought** | Complex reasoning | Strategic planning, problem decomposition |
| **II-Commons** | Shared utilities | Boilerplate, patterns, validation |
| **CoT-Lab-Demo** | Chain-of-thought reasoning | Reasoning chains, decision explanation |

---

## 🔥 The Smelting Process

### Phase 1: Smelting (Building)

1. **Load Blueprint** — Parse the Ingot specification
2. **Retrieve Context** — RAG from the Vault
3. **Dispatch Tools** — Function Gemma T5 execution
4. **Record Artifacts** — Store in GCS and Firestore

### Phase 2: Gilding (Polishing)

1. **Deploy** — Cloud Run container deployment
2. **Monitor** — Cloud Monitoring dashboards
3. **Validate** — Integration testing
4. **Launch** — Firebase Hosting activation

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- Google Cloud SDK (`gcloud`)
- Firebase CLI (`firebase-tools`)
- TypeScript 5.3+

### Installation

```bash
# Clone the repository
git clone https://github.com/ACHVMR/SmelterOS.git
cd SmelterOS

# Configure GCP
gcloud auth login
gcloud config set project smelteros

# Build the project
npm run build
```

### Smelt an Ingot

```bash
# Load the Locale blueprint
npm run smelt -- --ingot=Locale

# Gild the smelted Ingot
npm run gild -- --ingot=Locale --env=production
```

---

## 📁 Project Structure

```
SmelterOS/
├── Ingots/                              # Products built by SmelterOS
│   ├── Locale/                          # Primary product
│   │   └── Locale-Blueprint-Smelting-Spec.md
│   ├── Todd/                            # Task delegation assistant
│   │   └── Todd-Blueprint-Smelting-Spec.md
│   └── AchieveMor/                      # Gamification system
│       └── AchieveMor-Blueprint-Smelting-Spec.md
├── Resources/                           # Intelligent Internet repositories
│   ├── ii-agent/                        # Autonomous agent
│   ├── ii-researcher/                   # Research agent
│   ├── ii-thought/                      # Reasoning agent
│   ├── II-Commons/                      # Shared utilities
│   └── CoT-Lab-Demo/                    # Chain-of-thought demos
├── docs/
│   ├── FOUNDRY_PROTOCOL.md              # Core identity document
│   └── SMELTING_GUIDE.md                # Execution manual
├── src/
│   ├── core/
│   │   ├── interactions-api.ts          # Main API conduit
│   │   ├── function-gemma-t5.ts         # Tooling engine
│   │   └── resource-router.ts           # Resource dispatch
│   └── infrastructure/
│       ├── rag/
│       │   └── file-manager.ts          # RAG backbone
│       ├── pubsub/                      # Pub/Sub workers
│       ├── database/                    # Firestore client
│       └── storage/                     # GCS client
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔧 Configuration

### Environment Variables

```bash
# GCP Configuration (Required)
GCP_PROJECT_ID=smelteros
GCP_REGION=us-central1
GCP_CREDENTIALS_PATH=/path/to/credentials.json

# Firebase Configuration
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=smelteros.firebaseapp.com
FIREBASE_PROJECT_ID=smelteros

# Vertex AI Configuration
VERTEX_AI_LOCATION=us-central1
```

---

## 📊 Monitoring

All Smelting operations are monitored via Google Cloud:

- **Cloud Monitoring** — Metrics and dashboards
- **Cloud Logging** — Structured logs
- **Error Reporting** — Exception tracking
- **Cloud Trace** — Distributed tracing

---

## 📄 Documentation

| Document | Purpose |
|----------|---------|
| [FOUNDRY_PROTOCOL.md](docs/FOUNDRY_PROTOCOL.md) | Core identity and protocol |
| [SMELTING_GUIDE.md](docs/SMELTING_GUIDE.md) | Step-by-step execution manual |
| [Locale Blueprint](Ingots/Locale/Locale-Blueprint-Smelting-Spec.md) | Locale product specification |
| [Todd Blueprint](Ingots/Todd/Todd-Blueprint-Smelting-Spec.md) | Todd product specification |
| [AchieveMor Blueprint](Ingots/AchieveMor/AchieveMor-Blueprint-Smelting-Spec.md) | AchieveMor specification |

---

## 🛡️ License

SmelterOS is proprietary software. All rights reserved.

---

<p align="center">
  <strong>SmelterOS — The Foundry</strong><br>
  <em>Smelt. Gild. Ship.</em>
</p>
