# SmelterOS Architecture

## Overview
SmelterOS is an Intelligent Agent Foundry that orchestrates AI agent workflows using a multi-service architecture.

## Core Services

### 1. AVVA NOON (The Brain) 🧠
**Technology**: Agent Zero (agent0ai/agent-zero:latest)

AVVA NOON is the orchestration intelligence of SmelterOS. It is powered by Agent Zero, an autonomous AI agent framework that provides:

- **Autonomous Reasoning**: Breaks down complex tasks into executable plans
- **Multi-Agent Coordination**: Manages swarms of specialized agents
- **Memory Management**: Maintains context across conversations
- **Tool Integration**: Interfaces with external tools and APIs
- **Task Decomposition**: Converts high-level prompts into detailed execution steps

**Port**: 8001
**Container**: `avva_noon`
**Image**: `agent0ai/agent-zero:latest`

### 2. ACHEEVY (The Hand) ⚡
**Technology**: Custom Codex Implementation

ACHEEVY is the execution engine that carries out the plans created by AVVA NOON.

- Executes code in isolated sandboxes
- Manages file operations and artifacts
- Interfaces with cloud services
- Handles deployment workflows

**Port**: 8002
**Container**: `acheevy`

### 3. Zero_Ang (Local Bridge) 🌉
**Technology**: Agent Zero (agent0ai/agent-zero:latest)

A secondary Agent Zero instance configured for local development and testing.

**Port**: 8003
**Container**: `zero_ang`
**Image**: `agent0ai/agent-zero:latest`

### 4. Oracle Gateway (Boomerangs) 🔄
**Technology**: Multi-service Gateway

Provides access to:
- LiteLLM (Model routing)
- PPTist (Presentation generation)
- Gemini CLI
- Ghost Storage Adapter

**Port**: 8000

## Network Architecture

```
┌─────────────────────────────────────────┐
│         SmelterOS Network               │
│                                         │
│  ┌──────────────┐    ┌──────────────┐  │
│  │  AVVA NOON   │◄──►│   ACHEEVY    │  │
│  │ (Agent Zero) │    │  (Executor)  │  │
│  │   :8001      │    │    :8002     │  │
│  └──────────────┘    └──────────────┘  │
│         ▲                    ▲          │
│         │                    │          │
│         ▼                    ▼          │
│  ┌──────────────────────────────────┐  │
│  │     Oracle Gateway (:8000)       │  │
│  │   ┌──────────┬─────────┬──────┐ │  │
│  │   │ LiteLLM  │ PPTist  │Gemini│ │  │
│  │   └──────────┴─────────┴──────┘ │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────┐                       │
│  │  Zero_Ang    │  (Development)        │
│  │ (Agent Zero) │                       │
│  │   :8003      │                       │
│  └──────────────┘                       │
└─────────────────────────────────────────┘
```

## Agent Zero Integration

**AVVA NOON = Agent Zero**

AVVA NOON is not a separate implementation - it IS Agent Zero, configured for the SmelterOS ecosystem. The naming convention:
- **AVVA NOON**: The SmelterOS branding/identity
- **Agent Zero**: The underlying technology/framework
- **Zero_Ang**: Development/testing instance

### Why Agent Zero?

Agent Zero provides the foundational autonomous agent capabilities that power AVVA NOON:

1. **Zero-shot Learning**: Adapts to new tasks without retraining
2. **Self-improvement**: Learns from interactions
3. **Tool Mastery**: Integrates with any API or tool
4. **Memory Persistence**: Maintains long-term context
5. **Multi-modal**: Handles text, code, images, and more

## Environment Configuration

All services connect via the `smelter-net` Docker network, enabling:
- Service discovery
- Internal communication
- Isolated networking
- Load balancing (future)

## Data Volumes

AVVA NOON has access to:
- `ii-thought`: Reasoning frameworks
- `CoT-Lab-Demo`: Chain-of-thought examples
- `Symbioism-Nextra`: Collaborative AI patterns

## Getting Started

```bash
# Start all services
docker-compose -f smelter/services/docker-compose.yaml up -d

# Start only AVVA NOON
docker-compose -f smelter/services/docker-compose.yaml up -d avva-noon

# View logs
docker logs -f avva_noon

# Check status
docker-compose -f smelter/services/docker-compose.yaml ps
```

## Service URLs

- **AVVA NOON (Agent Zero)**: http://localhost:8001
- **ACHEEVY**: http://localhost:8002
- **Zero_Ang**: http://localhost:8003
- **Oracle Gateway**: http://localhost:8000

---

**Built with Agent Zero** | **Orchestrated by SmelterOS**
