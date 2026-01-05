# 🏭 The SmelterOS Foundry Protocol

> **Version 1.0 | The Canonical Reference for the Smelting Process**

---

## Core Identity

**SmelterOS is not a passive platform. It is the Foundry.**

| Term | Definition |
|------|------------|
| **SmelterOS** | The Operating System and manufacturing engine. The tool, not the product. |
| **Ingots** | The distinct products built by SmelterOS (Locale, Todd, AchieveMor, etc.) |
| **Smelting** | The build phase: code generation, compiling, infrastructure setup |
| **Gilding** | The polish phase: UI refinement, branding, deployment |

---

## The Machinery

The Smelting process relies on specific machinery to connect to the power of Google Cloud.

### Primary Connection: Interactions API

The **Interactions API** is the main conduit for ALL communication between the OS and models/infrastructure.

```typescript
// Every request flows through Interactions API
InteractionsAPI.dispatch({
  intent: 'smelt',
  ingot: 'Locale',
  phase: 'build',
  resources: ['ii-researcher', 'ii-agent'],
});
```

**Location:** `src/core/interactions-api.ts`

### Tooling Engine: Function Gemma T5

**Function Gemma T5** is the specific "hammer" used to shape data and execute functions. It is the REQUIRED model for structured tool calling.

```typescript
// All tool calls are structured through Function Gemma T5
FunctionGemmaT5.execute({
  tool: 'createFirestoreCollection',
  parameters: { collection: 'users', schema: UserSchema },
});
```

**Location:** `src/core/function-gemma-t5.ts`

### Priority Stack

| Priority | Service | Purpose |
|----------|---------|---------|
| 1 | **GCP** (Google Cloud Platform) | Power source and foundation |
| 2 | **Firebase** | Real-time data, auth, hosting |
| 3 | **Vertex AI** | Model serving, embeddings, predictions |

> ⚠️ **CRITICAL**: Any reference to "cloud agnostic" setups is INCORRECT. SmelterOS has a HARD priority on GCP/Firebase/Vertex.

---

## The Vault: Google File Manager RAG

The Google File Manager is NOT just a storage UI. It is the **RAG (Retrieval-Augmented Generation) backbone** of the operation.

### Explicit Wiring

```
┌─────────────────────────────────────────────────────────────────┐
│                    Google File Manager                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  File Upload → Vertex AI Embeddings → Vector Index         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Interactions API Route: /api/vault/retrieve               │ │
│  │  Purpose: Retrieve context ("Metal") for Smelting          │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### RAG Flow

1. File uploaded to Google File Manager
2. File indexed via Vertex AI embeddings
3. Interactions API has direct route to File Manager
4. During Smelting, context ("Metal") is retrieved via RAG
5. Context injected into the Smelting process

**Location:** `src/infrastructure/rag/file-manager.ts`

---

## The Intelligent Internet Resources

The II repositories are specialized "resource depots" that the Smelter dispatches.

| Repository | Capability | When Deployed |
|------------|------------|---------------|
| `ii-agent` | Autonomous execution | Multi-step workflows |
| `ii-researcher` | Deep research | Information gathering |
| `ii-thought` | Complex reasoning | Strategic planning |
| `II-Commons` | Shared patterns | Common infrastructure |
| `CoT-Lab-Demo` | Chain-of-thought | Explainability |

### Routing

Resources are NOT "integrated loosely." They are routed into SmelterOS core so the Interactions API can dispatch tasks INSTANTLY.

```typescript
// Resource dispatch via Interactions API
InteractionsAPI.dispatchResource({
  resource: 'ii-researcher',
  task: 'analyze-market',
  ingot: 'Locale',
  callback: 'smelt-continue',
});
```

---

## Directory Structure

```
SmelterOS/                          # The Root/Foundry
├── src/
│   ├── core/
│   │   ├── interactions-api.ts     # Main conduit
│   │   ├── function-gemma-t5.ts    # Tooling engine
│   │   └── smelter.ts              # Orchestrator
│   └── infrastructure/
│       ├── gcp/                    # GCP configuration
│       ├── firebase/               # Firebase integration
│       ├── vertex/                 # Vertex AI services
│       └── rag/
│           └── file-manager.ts     # RAG backbone
│
├── Ingots/                         # The Products
│   ├── Locale/
│   │   └── Locale-Blueprint-Smelting-Spec.md
│   ├── Todd/
│   │   └── Todd-Blueprint-Smelting-Spec.md
│   └── AchieveMor/
│       └── AchieveMor-Blueprint-Smelting-Spec.md
│
├── Resources/                      # The Intelligent Internet
│   ├── ii-agent/
│   ├── ii-researcher/
│   ├── ii-thought/
│   ├── II-Commons/
│   └── CoT-Lab-Demo/
│
└── docs/
    ├── FOUNDRY_PROTOCOL.md         # This document
    └── SMELTING_GUIDE.md           # Execution guide
```

---

## Smelting Protocol Execution

When an agent generates code or docs, follow this protocol:

### Step 1: Identify the Ingot
What are we building? Locale? Todd? AchieveMor?

### Step 2: Engage Machinery
- Route through **Interactions API** to define the task
- Use **Function Gemma T5** to structure execution

### Step 3: Route Resources
- Determine which II repos are needed
- Dispatch via Resource Router

### Step 4: Access the Vault
- Route context through Google File Manager RAG
- Retrieve relevant "Metal" for Smelting

### Step 5: Execute Smelting
- Build on GCP/Firebase/Vertex stack
- Generate code, compile, configure

### Step 6: Apply Gilding
- Polish UI
- Apply branding
- Deploy

### Step 7: Output
A "Smelted" product ready for production.

---

## Agent Directive

> **Fix the docs now.**
> - SmelterOS is the builder.
> - Locale is the build.
> - Use GCP/Vertex/Firebase as the foundation.
> - Wire Interactions API and Function Gemma T5 as the hands.
> - Wire the Google File Manager as the brain's library (RAG).
> - Proceed.

---

*The Foundry never stops. The Ingots keep coming.*
