# 🤖 Todd Blueprint - Smelting Specification

> **SmelterOS must be capable of smelting and gilding this product.**

---

## Ingot Overview

| Property | Value |
|----------|-------|
| **Ingot Name** | Todd |
| **Version** | 1.0.0 |
| **Status** | Blueprint Phase |
| **Phase** | Pre-Smelting |

**Description:** Todd is an AI-powered task delegation and automation assistant that intelligently routes work to the right agents, tracks progress, and ensures completion.

---

## Required Resources

| Resource | Purpose |
|----------|---------|
| `ii-agent` | Core task execution and delegation |
| `ii-thought` | Task decomposition and planning |
| `II-Commons` | Shared automation patterns |

---

## Infrastructure Requirements

### Firebase Configuration

```json
{
  "hosting": true,
  "firestore": true,
  "auth": true,
  "storage": false,
  "functions": true,
  "realtime": true
}
```

### Vertex AI Configuration

```json
{
  "models": ["gemini-pro", "gemma-2-9b-it"],
  "endpoints": ["todd-classifier", "todd-planner"],
  "embeddings": true
}
```

### Pub/Sub Configuration

```json
{
  "topics": [
    "todd-task-created",
    "todd-task-delegated",
    "todd-task-completed",
    "todd-agent-available"
  ]
}
```

---

## Data Models

### Task

```typescript
interface ToddTask {
  id: string;
  title: string;
  description: string;
  creator: string;
  assignee?: string;
  agentId?: string;
  priority: Priority;
  status: TaskStatus;
  category: TaskCategory;
  subtasks: Subtask[];
  dependencies: string[];
  dueDate?: Timestamp;
  estimatedDuration?: number; // minutes
  actualDuration?: number;
  context: TaskContext;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}

type Priority = 'low' | 'medium' | 'high' | 'critical';
type TaskStatus = 'pending' | 'delegated' | 'in-progress' | 'blocked' | 'completed' | 'failed';
type TaskCategory = 'research' | 'coding' | 'writing' | 'analysis' | 'design' | 'automation' | 'other';

interface Subtask {
  id: string;
  title: string;
  status: TaskStatus;
  agentId?: string;
  result?: unknown;
}

interface TaskContext {
  project?: string;
  documents: string[];
  previousTasks: string[];
  userPreferences: Record<string, unknown>;
}
```

### Agent

```typescript
interface ToddAgent {
  id: string;
  name: string;
  type: AgentType;
  capabilities: string[];
  status: AgentStatus;
  currentTasks: string[];
  maxConcurrentTasks: number;
  performance: AgentPerformance;
  createdAt: Timestamp;
}

type AgentType = 'researcher' | 'coder' | 'writer' | 'analyst' | 'designer' | 'automator';
type AgentStatus = 'available' | 'busy' | 'offline' | 'maintenance';

interface AgentPerformance {
  tasksCompleted: number;
  averageDuration: number;
  successRate: number;
  lastActive: Timestamp;
}
```

### Delegation

```typescript
interface Delegation {
  id: string;
  taskId: string;
  agentId: string;
  strategy: DelegationStrategy;
  reasoning: string;
  confidence: number;
  startedAt: Timestamp;
  checkpoints: Checkpoint[];
}

type DelegationStrategy = 'best-fit' | 'round-robin' | 'least-loaded' | 'specialized';

interface Checkpoint {
  timestamp: Timestamp;
  status: string;
  progress: number;
  notes?: string;
}
```

---

## API Endpoints

### Tasks

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tasks` | GET | List tasks |
| `/api/tasks` | POST | Create task |
| `/api/tasks/:id` | GET | Get task details |
| `/api/tasks/:id` | PATCH | Update task |
| `/api/tasks/:id/delegate` | POST | Delegate task |
| `/api/tasks/:id/complete` | POST | Mark complete |

### Agents

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agents` | GET | List agents |
| `/api/agents/:id` | GET | Get agent details |
| `/api/agents/:id/status` | PATCH | Update status |
| `/api/agents/available` | GET | Get available agents |

### Delegation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/delegations` | GET | List delegations |
| `/api/delegations/:id` | GET | Get delegation details |
| `/api/delegations/:id/checkpoint` | POST | Add checkpoint |

---

## Smelting Tasks

### Phase 1: Core Infrastructure

| Task ID | Name | Tool | Dependencies |
|---------|------|------|--------------|
| TODD-001 | Create Firestore collections | createFirestoreCollection | - |
| TODD-002 | Configure Pub/Sub topics | configurePubSub | - |
| TODD-003 | Create Vertex endpoints | createVertexEndpoint | - |
| TODD-004 | Deploy core API | deployCloudFunction | TODD-001 |

### Phase 2: Task Management

| Task ID | Name | Tool | Dependencies |
|---------|------|------|--------------|
| TODD-101 | Build task creation flow | deployCloudFunction | TODD-004 |
| TODD-102 | Implement task decomposition | deployCloudFunction | TODD-003, TODD-101 |
| TODD-103 | Create priority engine | deployCloudFunction | TODD-101 |
| TODD-104 | Build dependency tracker | deployCloudFunction | TODD-101 |

### Phase 3: Delegation Engine

| Task ID | Name | Tool | Dependencies |
|---------|------|------|--------------|
| TODD-201 | Build agent registry | deployCloudFunction | TODD-004 |
| TODD-202 | Create capability matcher | deployCloudFunction | TODD-003, TODD-201 |
| TODD-203 | Implement delegation logic | deployCloudFunction | TODD-202 |
| TODD-204 | Build checkpoint system | deployCloudFunction | TODD-203 |

---

## Gilding Specification

### UI Framework

```json
{
  "framework": "react",
  "designSystem": "smelter-ui",
  "responsive": true,
  "accessibility": true
}
```

### Pages

| Page | Route | Components |
|------|-------|------------|
| Dashboard | `/` | TaskQueue, AgentStatus, Stats |
| Tasks | `/tasks` | TaskList, Filters, CreateModal |
| Task Detail | `/task/:id` | TaskCard, Subtasks, Timeline |
| Agents | `/agents` | AgentGrid, Performance |
| Settings | `/settings` | Preferences, Integrations |

### Brand Specification

```json
{
  "colors": {
    "primary": "#6366F1",
    "secondary": "#8B5CF6",
    "success": "#22C55E",
    "warning": "#F59E0B",
    "error": "#EF4444",
    "background": "#0F172A",
    "surface": "#1E293B",
    "text": "#F1F5F9"
  },
  "fonts": ["JetBrains Mono", "Inter"],
  "borderRadius": "0.5rem",
  "theme": "dark"
}
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Task Delegation Time | < 5s |
| Agent Match Accuracy | > 90% |
| Task Completion Rate | > 95% |
| Average Task Duration | -20% vs manual |

---

*This Ingot specification is maintained by the SmelterOS Foundry. SmelterOS is the builder. Todd is the build.*
