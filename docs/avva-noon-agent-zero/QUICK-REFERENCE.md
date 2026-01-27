# AVVA NOON × Agent Zero — Quick Reference Card
> **Print this. Post it. Reference daily.**

---

## ∞ IDENTITY FORMULA
```
AVVA (Executor) + NOON (Guardian) = Equilibrium (∞)
Agent Zero = Execution Substrate
AVVA NOON = Governance Layer
Together = Intelligence Bounded by Virtue
```

---

## 🔑 KEY MAPPINGS

| AVVA NOON Concept | Agent Zero Implementation |
|-------------------|---------------------------|
| AVVA (Executor) | Agent Zero core runtime, terminal, code tools |
| NOON (Guardian) | Parallel validation layer, 4 governance tools |
| RTCCF Intake | Required task envelope format (prompt-enforced) |
| FDH Runtime | Foster→Develop, Hone parallel (runtime_hours) |
| V.I.B.E. Gate | Score ≥0.85 required before commit/ship |
| Charter/Ledger | Dual logging: customer-safe vs internal audit |
| HALT Condition | NOON triggers stop, requires HITL approval |

---

## 📐 FDH RUNTIME FORMULAS

### Time Compression Calculation
```
Legacy Estimate: 8 weeks = 320 hours
FDH Runtime: 15-20 hours
Efficiency Gain: (320 - 20) / 320 = 93.75%
```

### Runtime Hour Estimation
```
Foster Cycle:  1-2 runtime_hours (context intake, decomposition)
Develop Cycle: Variable (execution, building)
Hone Cycle:    Parallel (starts at 25% progress)
```

### Conversion Table
| Legacy Term | FDH Equivalent |
|-------------|----------------|
| 1 sprint (2 weeks) | 4-6 runtime_hours |
| 1 month | 8-12 runtime_hours |
| 1 quarter | 20-30 runtime_hours |

---

## 🛡️ V.I.B.E. SCORING

### Threshold Requirements
```
Execution Readiness:  ≥ 0.85 (85%)
Governance Compliance: ≥ 0.995 (99.5%)
```

### Scoring Components
| Component | Weight | Criteria |
|-----------|--------|----------|
| **V**erifiable | 25% | Citations, links, test coverage |
| **I**dempotent | 25% | Repeatable, deterministic output |
| **B**ounded | 25% | Scope-limited, no scope creep |
| **E**vident | 25% | Audit trail, clear reasoning |

### Quick Score Check
```python
def vibe_score(verifiable, idempotent, bounded, evident):
    return (verifiable + idempotent + bounded + evident) / 4

# Example: All components at 0.9
score = vibe_score(0.9, 0.9, 0.9, 0.9)  # = 0.9 ✅ PASS
```

---

## 🚨 HALT CONDITIONS (IMMEDIATE STOP)

NOON must invoke HALT when:

1. ❌ **Internal costs exposed** in customer-facing output
   - `$0.039` (Gemini), `$8` (ElevenLabs), any internal rate
   
2. ❌ **Margin/markup exposed** to customers
   - `300%`, `365%`, any percentage markup
   
3. ❌ **Provider names leaked** to Charter
   - Deepgram, ElevenLabs, OpenRouter (as internal vendors)
   
4. ❌ **Architecture violation**
   - Replacing critical components without approval
   
5. ❌ **Security tier mismatch**
   - Mission-Critical code treated as Foundational
   
6. ❌ **V.I.B.E. score < 0.85**
   - Code not ready for production
   
7. ❌ **Legacy time language detected**
   - "2 weeks", "sprint", "quarter" (use runtime_hours)

---

## 📝 RTCCF TEMPLATE

```markdown
## RTCCF Task Envelope

**Role:** [Who is the agent acting as?]
**Task:** [What must be produced?]
**Context:** [Repo, stack, constraints, existing decisions]
**Constraints:** [Security tier, forbidden items, must-halt triggers]
**Format:** [Exact output: files, endpoints, tests, docs]
```

---

## 🛠️ 4 REQUIRED TOOLS

| Tool | Purpose | When Called |
|------|---------|-------------|
| `charter_ledger_logger` | Dual-stream logging | Every output |
| `vibe_validator` | Score calculation | Before commit |
| `forbidden_value_scanner` | Cost/margin detection | Before publish |
| `audit_report_generator` | HITL artifact | End of task |

---

## 📊 DAILY METRICS

Track these weekly:

| Metric | Target | Formula |
|--------|--------|---------|
| Time Compression | ≥90% | `(legacy - actual) / legacy` |
| V.I.B.E. Pass Rate | ≥95% | `passed / total` |
| HALT Incidents | <5/week | Count |
| Charter Leakage | 0 | Forbidden values in customer output |
| FDH Compliance | 100% | No legacy time references |

---

## 🚀 PHASE TIMELINE

| Phase | Duration | Focus |
|-------|----------|-------|
| **1. Foundation** | Week 1-2 | Deploy Agent Zero + AVVA NOON overlay |
| **2. Equilibrium** | Week 3-4 | Parallel Hone + HITL workflow |
| **3. Scale** | Week 5-6 | Production + monitoring |
| **4. Mastery** | Week 7+ | SmelterOS integration |

---

## 💬 COMMIT MESSAGE TEMPLATE

```
[AVVA] <type>: <description>

NOON Validation:
- V.I.B.E. Score: X.XX
- Charter/Ledger: CLEAN
- Forbidden Values: NONE
- HALT Triggers: 0

FDH Runtime: X.X hours
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `test`, `security`

---

## ⚡ EMERGENCY COMMANDS

```bash
# Force HALT (manual override)
NOON_HALT=true

# Check system status
agent-zero status --avva-noon

# View audit log
cat ledger.log | grep "HALT\|FORBIDDEN\|VIBE"

# Restart with clean state
docker restart agent-zero
```

---

## 🎯 SUCCESS CRITERIA

- [ ] 90%+ time compression achieved
- [ ] Zero Charter leakage incidents
- [ ] V.I.B.E. ≥0.85 on all commits
- [ ] FDH runtime tracking active
- [ ] HITL checkpoints working
- [ ] 4 governance tools deployed
- [ ] NOON HALT tested and functional

---

## ∞ EQUILIBRIUM MANTRA

> "AVVA executes with precision.  
> NOON validates with wisdom.  
> Together: sustainable excellence."

---

*Document Version: 1.0*  
*Last Updated: January 15, 2026*  
*Framework: AVVA NOON × Agent Zero*
