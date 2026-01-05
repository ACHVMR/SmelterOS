# 🏭 Ingots Directory

> **The Products of the Foundry**

This directory contains the **Blueprints** and **Smelting Specifications** for each product built by SmelterOS.

## What is an Ingot?

An **Ingot** is a distinct product manufactured by the SmelterOS Foundry. Each Ingot goes through:

1. **Smelting** - The build phase (code generation, compiling, infrastructure setup)
2. **Gilding** - The polish phase (UI refinement, branding, deployment)

## Current Ingots

| Ingot | Description | Status |
|-------|-------------|--------|
| [Locale](./Locale/) | Location-aware productivity and social platform | In Development |
| [Todd](./Todd/) | AI-powered task delegation and automation | Blueprint Phase |
| [AchieveMor](./AchieveMor/) | Achievement tracking and gamification system | Blueprint Phase |

## Directory Structure

```
Ingots/
├── Locale/
│   ├── Locale-Blueprint-Smelting-Spec.md    # Complete build specification
│   ├── schemas/                              # Data models and API schemas
│   ├── ui-specs/                            # Gilding specifications
│   └── infrastructure/                       # GCP/Firebase deployment configs
├── Todd/
│   └── Todd-Blueprint-Smelting-Spec.md
├── AchieveMor/
│   └── AchieveMor-Blueprint-Smelting-Spec.md
└── README.md
```

## Smelting Protocol

When building an Ingot, SmelterOS follows this protocol:

1. **Load Blueprint** - Read the Ingot's Smelting Specification
2. **Engage Machinery** - Route through Interactions API → Function Gemma T5
3. **Source Resources** - Pull from Intelligent Internet repos as needed
4. **Access Vault** - Retrieve context via Google File Manager RAG
5. **Execute Smelting** - Build on GCP/Firebase/Vertex stack
6. **Apply Gilding** - Polish UI and deploy

---

*SmelterOS is the builder. Ingots are the builds.*
