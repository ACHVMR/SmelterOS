# 🔥 SmelterOS

**The Intelligent Agent Foundry** - Orchestrate, Validate, and Execute AI Agent Workflows

SmelterOS is a platform for managing complex AI agent operations, powered by **AVVA NOON** (Agent Zero) as the orchestration brain.

## 🧠 What is SmelterOS?

SmelterOS provides a "Mission Control" interface for AI agents, giving you:
- **Deep Visibility**: Real-time agent reasoning and execution status
- **Cost Tracking**: Monitor token usage and API costs
- **Multi-Agent Orchestration**: Coordinate specialized agents
- **Safety Validation**: V.I.B.E checks outputs before delivery
- **Sandbox Execution**: Isolated environments for code execution

## 🏗️ Architecture

### Core Services

- **AVVA NOON (The Brain)** - Agent Zero orchestration engine
- **ACHEEVY (The Hand)** - Execution and artifact management
- **Oracle Gateway** - Model routing and tool integration
- **Zero_Ang** - Development bridge

> **Note**: AVVA NOON IS Agent Zero. It's not a wrapper - it's the official [agent0ai/agent-zero](https://hub.docker.com/r/agent0ai/agent-zero) image configured for SmelterOS.

See [ARCHITECTURE.md](./docs/smelter-os/ARCHITECTURE.md) for detailed documentation.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for frontend)
- Git

### 1. Start the Services

```bash
# Clone the repository
git clone <repo-url>
cd SmelterOS

# Start all services
docker-compose -f smelter/services/docker-compose.yaml up -d

# Or start individual services
docker-compose -f smelter/services/docker-compose.yaml up -d avva-noon
```

### 2. Access the Services

- **AVVA NOON**: http://localhost:8001
- **ACHEEVY**: http://localhost:8002  
- **Oracle Gateway**: http://localhost:8000
- **Zero_Ang**: http://localhost:8003

### 3. Start the Frontend

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:3000 to see the SmelterOS dashboard.

## 📁 Project Structure

```
SmelterOS/
├── apps/
│   ├── web/                    # Next.js frontend
│   └── smelter-console/        # Terminal interface
├── smelter/
│   ├── services/               # Docker services
│   └── upstream/               # Agent frameworks
├── chickenhawk/                # Additional agents
├── docs/
│   └── smelter-os/
│       ├── ARCHITECTURE.md     # Full architecture docs
│       └── PRODUCT.md          # Product vision
└── docker-compose.yaml
```

## 🎯 Key Features

### AVVA NOON (Agent Zero)
- Autonomous task decomposition
- Multi-agent coordination
- Memory and context management
- Tool integration framework
- Self-improving capabilities

### The Console (Frontend)
- Real-time agent monitoring
- Cost and usage tracking
- Artifact management
- Command interface
- Guild system for collaboration

### The Foundry (Backend)
- Agent orchestration
- Safety validation (V.I.B.E)
- Sandbox execution
- Cloud deployment

## 🔧 Configuration

See `.env.local` for environment variables:

```bash
# Firebase (Authentication)
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project

# Backend Services
NEXT_PUBLIC_AVVA_NOON_URL=http://localhost:8001
NEXT_PUBLIC_ACHEEVY_URL=http://localhost:8002
```

## 📚 Documentation

- [Architecture](./docs/smelter-os/ARCHITECTURE.md) - Service architecture and integration
- [Product Vision](./docs/smelter-os/PRODUCT.md) - Goals and roadmap
- [Agent Zero Docs](https://github.com/frdel/agent-zero) - Upstream documentation

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Type check
npm run type-check
```

## 🐳 Docker Commands

```bash
# View logs
docker logs -f avva_noon

# Restart a service
docker-compose -f smelter/services/docker-compose.yaml restart avva-noon

# Stop all services
docker-compose -f smelter/services/docker-compose.yaml down

# Pull latest Agent Zero image
docker pull agent0ai/agent-zero:latest
```

## 🤝 Contributing

SmelterOS integrates multiple open-source projects:
- [Agent Zero](https://github.com/frdel/agent-zero) - The orchestration brain
- [Next.js](https://nextjs.org) - Frontend framework
- [Firebase](https://firebase.google.com) - Authentication & data

## 📄 License

See LICENSE file for details.

## 🙏 Acknowledgments

- **Agent Zero** by frdel - The autonomous agent framework powering AVVA NOON
- The entire Agent Zero community
- All upstream projects in `smelter/upstream/`

---

**Built with Agent Zero** | **Orchestrated by SmelterOS** | **Powered by AI**
