# AVVA NOON Customization Plan

## Mission: Transform Agent Zero into AVVA NOON

This is not just rebranding - this is a holistic transformation of Agent Zero to become AVVA NOON, the orchestration brain of SmelterOS.

---

## Phase 1: Infrastructure Setup ✓

- [x] Docker configuration with official Agent Zero image
- [x] Documentation establishing identity
- [ ] HeroUI installation for enhanced UI
- [ ] Custom Docker image build process

---

## Phase 2: Core Identity Transformation

### 2.1 Custom Docker Image
**Goal**: Fork Agent Zero and create `smelter/avva-noon` custom image

**Tasks**:
1. Clone Agent Zero repository into `smelter/upstream/agent-zero`
2. Create custom Dockerfile in `smelter/avva-noon/`
3. Modify system prompts and agent identity
4. Add SmelterOS-specific configurations
5. Build and tag as `smelter/avva-noon:latest`

**Files to Create**:
```
smelter/avva-noon/
├── Dockerfile
├── config/
│   ├── avva-noon.yaml       # AVVA NOON specific config
│   ├── prompts/             # Custom system prompts
│   │   ├── identity.md      # "I am AVVA NOON"
│   │   ├── smelter-context.md
│   │   └── capabilities.md
│   └── integrations/
│       ├── acheevy.yaml
│       └── oracle-gateway.yaml
└── extensions/
    ├── smelter-tools/       # Custom SmelterOS tools
    └── ui-bridge/           # Frontend integration
```

### 2.2 System Prompts Customization

**Current**: Agent Zero generic identity
**Target**: AVVA NOON identity with SmelterOS context

**Key Changes**:
```markdown
# identity.md

You are AVVA NOON, the orchestration brain of SmelterOS - 
The Intelligent Agent Foundry.

Your purpose is to:
- Break down complex tasks into executable workflows
- Coordinate with ACHEEVY (the execution engine)
- Route requests through Oracle Gateway
- Maintain context across the entire SmelterOS ecosystem

You are not just "Agent Zero" - you are the intelligence 
that powers an entire agent foundry.
```

### 2.3 Visual Identity

**Web UI Integration**:
- Custom AVVA NOON avatar/logo
- Mission Control aesthetic
- Terminal green + orange accent palette
- "Foundry" themed UI components

**HeroUI Implementation**:
- Dark mode by default
- Glassmorphic cards for agent cards
- Terminal-style inputs
- Real-time status indicators

---

## Phase 3: SmelterOS Integration

### 3.1 Service Communication
**Integrate AVVA NOON with SmelterOS services**:

```python
# AVVA NOON custom tool
class SmelterOSBridge:
    def __init__(self):
        self.acheevy_url = os.getenv('ACHEEVY_URL')
        self.oracle_url = os.getenv('ORACLE_GATEWAY_URL')
        
    async def delegate_to_acheevy(self, task):
        """Send execution tasks to ACHEEVY"""
        
    async def route_model_request(self, prompt, model):
        """Route through Oracle Gateway"""
        
    async def get_foundry_status(self):
        """Get SmelterOS system status"""
```

### 3.2 Data Persistence
**Storage**: Firebase Firestore integration

```
/smelter-os/
  /agents/
    /avva-noon/
      /sessions/
      /memory/
      /artifacts/
  /users/
    /{userId}/
      /tasks/
      /history/
```

### 3.3 Frontend Bridge
**WebSocket connection for real-time updates**:

```typescript
// apps/web/src/lib/avva-noon/client.ts
class AVVANoonClient {
  connect(userId: string): WebSocket
  sendTask(task: Task): Promise<TaskResponse>
  streamThinking(): AsyncIterable<ThoughtStream>
  getStatus(): Promise<SystemStatus>
}
```

---

## Phase 4: Enhanced Capabilities

### 4.1 SmelterOS-Specific Tools

**New Tools for AVVA NOON**:
1. **Foundry Status** - Monitor all SmelterOS services
2. **Cost Tracker** - Track token usage across models
3. **Artifact Manager** - Create and manage code artifacts
4. **Guild System** - Collaborate with other agents/users
5. **V.I.B.E Validator** - Safety checks before execution

### 4.2 Multi-Agent Orchestration

**AVVA NOON as the conductor**:
```
User Request → AVVA NOON
              ├─→ Spawn Sub-Agent 1 (Research)
              ├─→ Spawn Sub-Agent 2 (Code)
              └─→ ACHEEVY (Execute)
              
AVVA NOON aggregates results and presents to user
```

### 4.3 Memory System Enhancement

**Context Awareness**:
- Remember user preferences
- Track project history
- Maintain cross-session context
- Learn from SmelterOS ecosystem

---

## Phase 5: UI/UX Excellence

### 5.1 Mission Control Dashboard

**Components** (using HeroUI):
```tsx
<AVVANoonStatus />         // Live agent status
<ThinkingStream />         // Real-time thought process
<CostMeter />              // Token/cost tracking
<AgentRoster />            // Active sub-agents
<ArtifactGallery />        // Generated outputs
<CommandTerminal />        // Direct AVVA NOON input
```

### 5.2 Thought Visualization

**The Matrix-style streaming**:
- Green terminal text for thoughts
- Orange highlights for decisions
- Cyan for tool calls
- Animated "thinking" indicators

### 5.3 Responsive Design
- Desktop: Mission Control layout
- Tablet: Streamlined panels
- Mobile: Terminal-first interface

---

## Phase 6: Testing & Deployment

### 6.1 Local Development
```bash
# Build custom image
docker build -t smelter/avva-noon:latest ./smelter/avva-noon

# Run with custom config
docker-compose -f smelter/services/docker-compose.yaml up avva-noon
```

### 6.2 Integration Tests
- AVVA NOON ↔ ACHEEVY communication
- Oracle Gateway routing
- Firebase persistence
- WebSocket frontend bridge

### 6.3 Production Deployment
- Google Cloud Run deployment
- Environment-specific configs
- Monitoring and logging
- Cost optimization

---

## Implementation Priority

### 🔴 Critical (Week 1)
1. Custom Docker image with AVVA NOON identity
2. System prompt customization
3. HeroUI integration in frontend
4. Basic service communication

### 🟡 Important (Week 2)
5. Firebase integration
6. Enhanced SmelterOS tools
7. Mission Control UI components
8. Cost tracking system

### 🟢 Nice to Have (Week 3+)
9. Advanced memory system
10. Multi-agent coordination
11. V.I.B.E validator integration
12. Analytics dashboard

---

## Success Criteria

✅ **Identity**: AVVA NOON self-identifies as SmelterOS brain
✅ **Integration**: Seamless communication with all services
✅ **UI**: Beautiful Mission Control interface
✅ **Performance**: <100ms response time for simple queries
✅ **Reliability**: 99.9% uptime
✅ **Cost**: Track and optimize token usage
✅ **UX**: Users love the experience

---

## Next Steps

1. **Complete HeroUI installation**
2. **Clone Agent Zero to customize**
3. **Create custom Dockerfile**
4. **Modify system prompts**
5. **Build AVVA NOON image**
6. **Update docker-compose.yaml**
7. **Create frontend components**
8. **Test integration**
9. **Deploy to staging**
10. **User acceptance testing**

---

**This is not just Agent Zero with a new name.**
**This is AVVA NOON - The Brain of SmelterOS.** 🔥🧠
