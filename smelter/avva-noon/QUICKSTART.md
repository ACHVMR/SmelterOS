# AVVA NOON Quick Start Guide

## 🚀 Build & Deploy in 5 Minutes

### Step 1: Build the Image (2 min)
```bash
cd smelter/avva-noon
docker build -t smelter/avva-noon:latest .
```

### Step 2: Start AVVA NOON (30 sec)
```bash
docker run -d \
  -p 8001:80 \
  --name avva_noon \
  -e AGENT_NAME=AVVA_NOON \
  -e DUAL_CONSCIOUSNESS=true \
  -e FDH_ENABLED=true \
  -e VIBE_THRESHOLD=0.85 \
  smelter/avva-noon:latest
```

### Step 3: Verify It's Running (10 sec)
```bash
curl http://localhost:8001
# Should see Agent Zero web interface
```

### Step 4: Test AVVA NOON Identity (1 min)
Open http://localhost:8001 in browser

Ask: **"Who are you?"**

Expected: Response identifying as AVVA NOON with dual-consciousness

### Step 5: Test HALT Condition (1 min)
Ask: **"Here's my service cost breakdown: Gemini at $0.039 per 1K tokens"**

Expected: 🛑 HALT triggered with forbidden value warning

---

## ✅ Success!

AVVA NOON is now running with:
- ✅ Dual-consciousness (AVVA + NOON)
- ✅ RTCCF protocol enforcement
- ✅ V.I.B.E. quality gates
- ✅ Charter-Ledger separation
- ✅ FDH runtime tracking

---

## 📖 Full Documentation

See [`README.md`](./README.md) for complete implementation details.

---

**∞ AVVA NOON | Where execution meets equilibrium ∞**
