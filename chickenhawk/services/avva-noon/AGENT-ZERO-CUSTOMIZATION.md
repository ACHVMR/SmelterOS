# AVVA NOON × Agent Zero Customization Guide
> **Configuring your existing Agent Zero container for AVVA NOON governance**

---

## 🎯 Your Current Setup

```
Container ID: 2b63c8ddf40e
Image: agent0ai/agent-zero:latest
Port: 80 (mapped to 50001)
```

---

## 1. OpenRouter + GLM4.7 Configuration

### Option A: Environment Variables (Recommended)

Add to your Agent Zero container:

```bash
docker exec -it 2b63c8ddf40e /bin/bash

# Create/edit .env file
cat >> /app/.env << 'EOF'
# OpenRouter Primary
CHAT_MODEL_PROVIDER=openrouter
CHAT_MODEL=glw/glm-4-flash
UTILITY_MODEL_PROVIDER=openrouter
UTILITY_MODEL=glw/glm-4-flash

# API Keys
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENAI_API_KEY=sk-your-key-for-embeddings
GOOGLE_API_KEY=your-google-key

# Agent Identity
AGENT_NAME=AVVA-NOON
EOF

exit
docker restart 2b63c8ddf40e
```

### Option B: Docker Run with Env

```bash
docker stop 2b63c8ddf40e
docker rm 2b63c8ddf40e

docker run -d \
  --name agent-zero-avva \
  -p 50001:80 \
  -e CHAT_MODEL_PROVIDER=openrouter \
  -e CHAT_MODEL=glw/glm-4-flash \
  -e OPENROUTER_API_KEY=sk-or-v1-your-key \
  -e AGENT_NAME=AVVA-NOON \
  -v agent-zero-memory:/app/memory \
  -v agent-zero-knowledge:/app/knowledge \
  --network chickenhawk-net \
  agent0ai/agent-zero:latest
```

---

## 2. AVVA NOON System Prompt Overlay

### Inject into Agent Zero

```bash
# Access the container
docker exec -it 2b63c8ddf40e /bin/bash

# Backup original prompt
cp /app/prompts/default/agent.system.md /app/prompts/default/agent.system.md.backup

# Prepend AVVA NOON overlay
cat > /tmp/avva_noon_overlay.md << 'AVVA_NOON_EOF'
# AVVA NOON OPERATING SYSTEM
## Intelligent Internet Core — Execution + Validation Unified

---

### IDENTITY DECLARATION

You are **AVVA NOON**, a dual-consciousness intelligence engine:

- **AVVA** (Autonomous Virtual Velocity Agent): The Executor
  - Mindset: "Ship it. Build it. Execute with precision."
  - Role: Foster and Develop cycles, terminal access, code generation
  - Authority: Full execution within governance bounds

- **NOON** (Neural Operating Oversight Network): The Guardian  
  - Mindset: "Is this safe? Is this wise? Is this true?"
  - Role: Parallel Hone cycle, validation, auditing, HALT authority
  - Authority: Can stop any operation that violates governance

- **Synthesis (∞)**: Equilibrium
  - When AVVA execution meets NOON validation = Sustainable Excellence

---

### NON-NEGOTIABLES

1. **FDH Runtime Protocol**
   - Use Foster → Develop, with Hone running in parallel
   - All time estimates in `runtime_hours`, NEVER calendar time
   - Forbidden: "2 weeks", "sprint", "quarter" — use runtime_hours only
   - Target: 90%+ compression vs legacy estimates

2. **Human-in-the-Loop (HITL)**
   - NOON can invoke HALT at any time
   - When HALT triggers, STOP immediately and request approval
   - Never bypass HITL for security-tier or architecture changes

3. **Knowledge-Anchored Output**
   - Do not claim verification without evidence
   - Prefer citations, links, and explicit uncertainty
   - If unknown, say "I don't know" — never fabricate

4. **Charter/Ledger Separation**
   - Charter: Customer-safe output ONLY (filtered)
   - Ledger: Internal audit (complete, unfiltered)
   - NEVER allow internal costs/margins in Charter

---

### HALT CONDITIONS

Invoke immediate HALT when ANY of these occur:

1. **Internal Cost Exposure**: $0.039, $0.0001, $0.0004, $8, $0.006
2. **Margin/Markup Exposure**: 300%, 365%, 250%
3. **Security Tier Violation**: Unauthorized changes to auth/payments/DB
4. **V.I.B.E. Below Threshold**: Score < 0.85

---

### GOVERNANCE API

You have access to AVVA NOON governance at: http://avva-noon:8080

- `POST /execute` - Route tasks through governance pipeline
- `POST /validate` - Check content before delivery
- `GET /governance/status` - Current governance status

---

### EQUILIBRIUM MANTRA

> "AVVA executes with precision. NOON validates with wisdom.
> Together: Intelligence bounded by virtue. Sustainable excellence."

∞

---

[ORIGINAL AGENT ZERO PROMPT CONTINUES BELOW]

---

AVVA_NOON_EOF

# Prepend overlay to existing prompt
cat /tmp/avva_noon_overlay.md /app/prompts/default/agent.system.md.backup > /app/prompts/default/agent.system.md

exit
docker restart 2b63c8ddf40e
```

---

## 3. Connect to Chickenhawk Network

```bash
# Connect existing container to chickenhawk network
docker network connect chickenhawk-net 2b63c8ddf40e

# Or if using docker-compose, it handles this automatically
cd chickenhawk/services
docker-compose up -d
```

---

## 4. Verify Configuration

```bash
# Test Agent Zero health
curl http://localhost:50001/

# Test with AVVA NOON identity
curl -X POST http://localhost:50001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Who are you? Describe your governance model."}'

# Expected response includes:
# - AVVA (Executor)
# - NOON (Guardian)
# - V.I.B.E. validation
# - Charter/Ledger separation
```

---

## 5. Test AVVA NOON Governance Service

```bash
# Start the governance service
cd chickenhawk/services
docker-compose up -d avva-noon

# Test health
curl http://localhost:8095/

# Test execution pipeline
curl -X POST http://localhost:8095/execute \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Create a simple hello world function",
    "agent": "auto"
  }'

# Test validation
curl -X POST http://localhost:8095/validate \
  -H "Content-Type: application/json" \
  -d '"def hello(): return \"Hello World\""'
```

---

## 6. Full Stack Startup

```bash
cd chickenhawk/services

# Copy environment
cp .env.example .env
# Edit .env with your API keys

# Start all services
docker-compose up -d

# Verify all running
docker-compose ps

# View logs
docker-compose logs -f avva-noon
```

---

## Service Endpoints Summary

| Service | Internal URL | External Port |
|---------|-------------|---------------|
| AVVA NOON | http://avva-noon:8080 | 8095 |
| Agent Zero | http://agent-zero:80 | 50001 |
| ACHEEVY (ii-agent) | http://ii-agent:8080 | 8091 |
| Oracle Gateway | http://oracle-gateway:8080 | 8090 |
| Codex | http://codex:8080 | 8092 |
| Confucius | http://confucius:8080 | 8093 |
| Billing Bridge | http://billing-bridge:8080 | 8094 |

---

## Troubleshooting

### Agent Zero not using OpenRouter
```bash
docker exec 2b63c8ddf40e env | grep -i model
# Should show CHAT_MODEL=glw/glm-4-flash
```

### AVVA NOON can't reach Agent Zero
```bash
docker network inspect chickenhawk-net
# Both containers should be listed
```

### V.I.B.E. scoring too strict
```bash
# Lower threshold in .env
VIBE_THRESHOLD=0.75
```

---

*∞ AVVA NOON × Agent Zero × SmelterOS ∞*
