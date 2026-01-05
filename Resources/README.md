# 🔧 Resources Directory

> **The Intelligent Internet - Specialized Resource Depots**

This directory contains the routing and integration configurations for the Intelligent Internet repositories that SmelterOS dispatches during the Smelting process.

## What are Resources?

**Resources** are specialized AI capabilities from the Intelligent Internet (II) repositories. The Smelter calls upon these depots when an Ingot requires specific functionality:

| Resource | Capability | Deployment Trigger |
|----------|------------|-------------------|
| **ii-agent** | Autonomous task execution | Complex multi-step workflows |
| **ii-researcher** | Deep research & analysis | Information gathering, market research |
| **ii-thought** | Complex reasoning & planning | Strategic decisions, problem decomposition |
| **II-Commons** | Shared utilities & patterns | Common infrastructure needs |
| **CoT-Lab-Demo** | Chain-of-thought demonstrations | Reasoning chains, explainability |

## Directory Structure

```
Resources/
├── ii-agent/
│   ├── routing.json           # Dispatch configuration
│   └── capabilities.md        # Available functions
├── ii-researcher/
│   ├── routing.json
│   └── capabilities.md
├── ii-thought/
│   ├── routing.json
│   └── capabilities.md
├── II-Commons/
│   ├── routing.json
│   └── shared-patterns.md
├── CoT-Lab-Demo/
│   ├── routing.json
│   └── demo-chains.md
└── README.md
```

## Routing Architecture

Resources are **not** loosely integrated. They are wired directly into the SmelterOS core:

```
┌─────────────────────────────────────────────────────────────┐
│                       SmelterOS Core                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │               Interactions API                        │   │
│  │    (Main conduit for all model/infrastructure)        │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│         ┌─────────────────┴─────────────────┐               │
│         ▼                                   ▼               │
│  ┌─────────────┐                    ┌─────────────┐        │
│  │ Function    │                    │ Resource    │        │
│  │ Gemma T5    │◄───────────────────│ Router      │        │
│  │ (Tooling)   │                    │             │        │
│  └─────────────┘                    └─────────────┘        │
│                                            │                │
│      ┌────────────────────────────────────┴──────┐         │
│      ▼            ▼           ▼         ▼        ▼         │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────┐ ┌──────┐     │
│ │ii-agent │ │ii-research│ │ii-thought│ │Commons│ │CoT-Lab│     │
│ └─────────┘ └─────────┘ └─────────┘ └──────┘ └──────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Dispatch Protocol

When the Smelter needs a Resource:

1. **Interactions API** receives the task
2. **Resource Router** determines which depot(s) needed
3. **Function Gemma T5** structures the execution call
4. **Resource** executes and returns results
5. **Results** flow back through Interactions API

---

*The Intelligent Internet provides the raw materials. SmelterOS forges them into Ingots.*
