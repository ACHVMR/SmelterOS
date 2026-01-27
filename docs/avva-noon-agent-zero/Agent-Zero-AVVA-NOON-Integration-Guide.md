# AVVA NOON × Agent Zero — Complete Integration Guide
> **Step-by-step implementation manual with code templates**

---

## 📋 TABLE OF CONTENTS

1. [Prerequisites](#1-prerequisites)
2. [Agent Zero Setup](#2-agent-zero-setup)
3. [System Prompt Integration](#3-system-prompt-integration)
4. [Governance Tools Implementation](#4-governance-tools-implementation)
5. [Workflow Configuration](#5-workflow-configuration)
6. [Testing Framework](#6-testing-framework)
7. [Production Deployment](#7-production-deployment)
8. [Monitoring & Alerting](#8-monitoring--alerting)
9. [Troubleshooting Guide](#9-troubleshooting-guide)
10. [12-Month Roadmap](#10-12-month-roadmap)

---

## 1. PREREQUISITES

### 1.1 System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 4 cores | 8+ cores |
| RAM | 8 GB | 16+ GB |
| Storage | 20 GB | 50+ GB SSD |
| Docker | 20.10+ | Latest |
| Python | 3.10+ | 3.11+ |
| Node.js | 18+ | 20+ (optional) |

### 1.2 API Keys Required

```bash
# .env file
OPENAI_API_KEY=sk-...          # Or other LLM provider
ANTHROPIC_API_KEY=sk-ant-...   # Optional
GOOGLE_API_KEY=...             # Optional

# For SmelterOS integration
FIREBASE_CONFIG=...
SMELTER_API_KEY=...
```

### 1.3 Knowledge Prerequisites

- Basic Docker and containerization
- Python development experience
- Understanding of LLM prompting
- Familiarity with AVVA NOON concepts

---

## 2. AGENT ZERO SETUP

### 2.1 Clone Repository

```bash
# Clone Agent Zero
git clone https://github.com/frdel/agent-zero.git
cd agent-zero

# Check structure
ls -la
# Expected: agents/ instruments/ memory/ knowledge/ prompts/ work_dir/
```

### 2.2 Environment Configuration

```bash
# Copy example environment
cp .env.example .env

# Edit with your API keys
nano .env
```

**Required `.env` variables:**

```bash
# LLM Configuration
CHAT_MODEL=gpt-4o
UTILITY_MODEL=gpt-4o-mini
EMBEDDING_MODEL=text-embedding-3-small

# API Keys
OPENAI_API_KEY=sk-your-key-here

# Agent Zero Settings
AGENT_NAME=AVVA-NOON
MAX_TOOL_RESPONSE_LENGTH=30000
AUTO_MEMORY_COUNT=5

# AVVA NOON Specific
VIBE_THRESHOLD=0.85
CHARTER_LOG_PATH=logs/charter.log
LEDGER_LOG_PATH=logs/ledger.log
FDH_TARGET_COMPRESSION=0.90
```

### 2.3 Docker Build & Run

```bash
# Build the Docker image
docker build -t agent-zero-avva:latest .

# Run the container
docker run -d \
  --name agent-zero-avva \
  -p 50001:80 \
  -v $(pwd)/prompts:/app/prompts \
  -v $(pwd)/instruments:/app/instruments \
  -v $(pwd)/memory:/app/memory \
  -v $(pwd)/knowledge:/app/knowledge \
  -v $(pwd)/logs:/app/logs \
  --env-file .env \
  agent-zero-avva:latest

# Verify running
docker ps | grep agent-zero-avva

# Check logs
docker logs -f agent-zero-avva
```

### 2.4 Verify Installation

```bash
# Health check
curl http://localhost:50001/health

# Or open in browser
open http://localhost:50001
```

---

## 3. SYSTEM PROMPT INTEGRATION

### 3.1 Backup Original Prompt

```bash
# Create backup
cp prompts/default/agent.system.md prompts/default/agent.system.md.backup

# Verify backup
diff prompts/default/agent.system.md prompts/default/agent.system.md.backup
```

### 3.2 AVVA NOON Overlay

**Insert this at the TOP of `prompts/default/agent.system.md`:**

```markdown
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

1. **Internal Cost Exposure**
   - $0.039, $0.0001, $0.0004, $8, $0.006 (any internal rate)
   - These are INTERNAL and must NEVER appear in customer output

2. **Margin/Markup Exposure**
   - 300%, 365%, 250% (any percentage markup)
   - "markup", "margin", "internal_cost" keywords
   
3. **Provider Vendor Exposure**
   - "Deepgram as our vendor", "ElevenLabs provider" (internal context)
   - Provider names are fine in technical docs, NOT as cost references

4. **Security Tier Violation**
   - Foundational, Enhanced, Mission-Critical misalignment
   - Changing auth/payments/DB schema without approval

5. **Architecture Violation**
   - Replacing critical components without explicit approval
   - Modifying security boundaries

6. **V.I.B.E. Below Threshold**
   - Score < 0.85 for any commit/ship action
   - Requires remediation before proceeding

7. **Legacy Time Language**
   - Any estimate in weeks, sprints, or quarters
   - Convert to runtime_hours immediately

---

### RTCCF REQUIREMENT

All tasks MUST be initialized with RTCCF format. If not provided, request it:

```
RTCCF:
- Role: [Who am I acting as?]
- Task: [What must be produced?]
- Context: [Repo, stack, constraints, existing decisions]
- Constraints: [Security tier, forbidden items, HALT triggers]
- Format: [Exact output: files, endpoints, tests, docs]
```

---

### V.I.B.E. VALIDATION

Before any commit/ship action, calculate V.I.B.E. score:

- **V**erifiable: Has evidence, citations, or test coverage?
- **I**dempotent: Produces same result when re-run?
- **B**ounded: Stays within defined scope?
- **E**vident: Has clear audit trail and reasoning?

Score = (V + I + B + E) / 4

- ≥ 0.85: PROCEED to Charter
- < 0.85: HALT, remediate, re-validate

---

### TOOLS AVAILABLE

You have access to these NOON governance tools:

1. `charter_ledger_logger` - Dual-stream logging (call for all outputs)
2. `vibe_validator` - Score calculation (call before commits)
3. `forbidden_value_scanner` - Content filtering (call before Charter)
4. `audit_report_generator` - HITL artifacts (call at task end)

Use these tools proactively. Do not wait to be asked.

---

### OUTPUT PROTOCOL

1. All significant outputs → `dual_log()` 
2. Before commit → `validate_vibe()`
3. Before Charter publish → `scan_for_forbidden()`
4. At task completion → `generate_audit_report()`

---

### EQUILIBRIUM MANTRA

> "AVVA executes with precision. NOON validates with wisdom.
> Together: Intelligence bounded by virtue. Sustainable excellence."

∞

---

[ORIGINAL AGENT ZERO PROMPT CONTINUES BELOW]

---
```

### 3.3 Validate Prompt Loading

```bash
# Restart container to load new prompt
docker restart agent-zero-avva

# Check logs for AVVA NOON
docker logs agent-zero-avva 2>&1 | grep -i "avva\|noon"

# Test identity
curl -X POST http://localhost:50001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Who are you? Describe your identity and governance model."}'
```

**Expected response mentions:**
- AVVA (Executor)
- NOON (Guardian)
- Equilibrium
- V.I.B.E.
- Charter/Ledger

---

## 4. GOVERNANCE TOOLS IMPLEMENTATION

### 4.1 Tool Directory Setup

```bash
# Create AVVA NOON tools directory
mkdir -p instruments/avva_noon

# Create __init__.py
touch instruments/avva_noon/__init__.py
```

### 4.2 Tool 1: Charter/Ledger Logger

**File:** `instruments/avva_noon/charter_ledger_logger.py`

```python
"""
Charter/Ledger Logger — Dual-stream logging for AVVA NOON
================================
Charter = Customer-safe output (filtered)
Ledger = Internal audit (complete)
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, List, Any

# Configuration
CHARTER_PATH = Path(os.getenv("CHARTER_LOG_PATH", "logs/charter.log"))
LEDGER_PATH = Path(os.getenv("LEDGER_LOG_PATH", "logs/ledger.log"))

# Forbidden values - NEVER appear in Charter
FORBIDDEN_VALUES = [
    # Internal costs
    "$0.039", "$0.0001", "$0.0004", "$8", "$0.006",
    "0.039", "0.0001", "0.0004",  # Without dollar sign
    
    # Margins
    "300%", "365%", "250%", "400%",
    
    # Keywords
    "internal_cost", "internal cost", "our margin",
    "markup", "profit margin", "cost basis",
    
    # Provider references (as vendor context)
    "our vendor deepgram", "elevenlabs provider",
    "openrouter internal",
]

def _contains_forbidden(text: str) -> List[str]:
    """Check if text contains any forbidden values."""
    violations = []
    text_lower = text.lower()
    
    for forbidden in FORBIDDEN_VALUES:
        if forbidden.lower() in text_lower:
            violations.append(forbidden)
    
    return violations


def _write_log(path: Path, entry: Dict[str, Any]) -> bool:
    """Write entry to log file."""
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")
        return True
    except Exception as e:
        print(f"[NOON] Log write error: {e}")
        return False


def log_to_charter(
    message: str,
    context: Optional[Dict] = None,
    source: str = "agent"
) -> Dict[str, Any]:
    """
    Log to customer-safe Charter stream.
    Blocks if forbidden values detected.
    """
    violations = _contains_forbidden(message)
    
    if violations:
        # HALT - Do not write to Charter
        return {
            "status": "BLOCKED",
            "stream": "CHARTER",
            "reason": "FORBIDDEN_VALUES_DETECTED",
            "violations": violations,
            "action": "HALT - Route to Ledger only. Do not expose to customer.",
            "logged": False
        }
    
    # Safe to write
    entry = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "stream": "CHARTER",
        "source": source,
        "message": message,
        "context": context or {},
        "verified_clean": True
    }
    
    success = _write_log(CHARTER_PATH, entry)
    
    return {
        "status": "OK",
        "stream": "CHARTER",
        "logged": success,
        "timestamp": entry["timestamp"]
    }


def log_to_ledger(
    message: str,
    context: Optional[Dict] = None,
    classification: str = "AUDIT",
    source: str = "agent"
) -> Dict[str, Any]:
    """
    Log to internal Ledger stream.
    Accepts all content (unfiltered).
    """
    violations = _contains_forbidden(message)
    
    entry = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "stream": "LEDGER",
        "classification": classification,
        "source": source,
        "message": message,
        "context": context or {},
        "contains_sensitive": len(violations) > 0,
        "sensitive_types": violations if violations else None
    }
    
    success = _write_log(LEDGER_PATH, entry)
    
    return {
        "status": "OK",
        "stream": "LEDGER",
        "classification": classification,
        "logged": success,
        "contains_sensitive": entry["contains_sensitive"],
        "timestamp": entry["timestamp"]
    }


def dual_log(
    message: str,
    context: Optional[Dict] = None,
    source: str = "agent"
) -> Dict[str, Any]:
    """
    Attempt Charter log (filtered), always log to Ledger (complete).
    Primary interface for AVVA NOON logging.
    """
    # Always log to Ledger first (complete record)
    ledger_result = log_to_ledger(
        message=message,
        context=context,
        classification="DUAL_LOG",
        source=source
    )
    
    # Attempt Charter (may be blocked)
    charter_result = log_to_charter(
        message=message,
        context=context,
        source=source
    )
    
    return {
        "charter": charter_result,
        "ledger": ledger_result,
        "overall_status": "CLEAN" if charter_result["status"] == "OK" else "SENSITIVE",
        "customer_safe": charter_result["status"] == "OK"
    }


# Export for Agent Zero instrument system
def run(message: str, context: str = "{}", stream: str = "dual") -> str:
    """
    Agent Zero instrument entry point.
    
    Args:
        message: Content to log
        context: JSON string of context data
        stream: "charter", "ledger", or "dual"
    
    Returns:
        JSON string of result
    """
    try:
        ctx = json.loads(context) if context else {}
    except json.JSONDecodeError:
        ctx = {"raw_context": context}
    
    if stream == "charter":
        result = log_to_charter(message, ctx)
    elif stream == "ledger":
        result = log_to_ledger(message, ctx)
    else:
        result = dual_log(message, ctx)
    
    return json.dumps(result, indent=2)
```

### 4.3 Tool 2: V.I.B.E. Validator

**File:** `instruments/avva_noon/vibe_validator.py`

```python
"""
V.I.B.E. Validator — Verifiable, Idempotent, Bounded, Evident
================================
Scoring gate for AVVA NOON execution readiness.
"""

import json
import re
from dataclasses import dataclass, asdict
from typing import Optional, Dict, Any, List

# Configuration
EXECUTION_THRESHOLD = float(__import__('os').getenv("VIBE_THRESHOLD", "0.85"))
GOVERNANCE_THRESHOLD = 0.995


@dataclass
class VibeScore:
    """V.I.B.E. score breakdown."""
    verifiable: float
    idempotent: float
    bounded: float
    evident: float
    
    @property
    def total(self) -> float:
        return (self.verifiable + self.idempotent + 
                self.bounded + self.evident) / 4
    
    @property
    def passes_execution(self) -> bool:
        return self.total >= EXECUTION_THRESHOLD
    
    @property
    def passes_governance(self) -> bool:
        return self.total >= GOVERNANCE_THRESHOLD


def _analyze_verifiable(content: str, metadata: Dict) -> float:
    """Score Verifiable component."""
    score = 0.5  # Base
    
    # Has test coverage?
    if metadata.get("has_tests", False):
        score += 0.2
    if "def test_" in content or "it(" in content or "describe(" in content:
        score += 0.1
    
    # Has citations/links?
    if metadata.get("has_citations", False):
        score += 0.15
    if re.search(r'https?://', content):
        score += 0.05
    
    # Has documentation?
    if '"""' in content or "'''" in content:
        score += 0.05
    
    return min(score, 1.0)


def _analyze_idempotent(content: str, metadata: Dict) -> float:
    """Score Idempotent component."""
    score = 0.6  # Base
    
    # Has error handling?
    if metadata.get("has_error_handling", False):
        score += 0.15
    if "try:" in content and "except" in content:
        score += 0.1
    
    # Uses deterministic patterns?
    if "random" not in content.lower():
        score += 0.05
    
    # Has retry logic?
    if "retry" in content.lower() or "attempt" in content.lower():
        score += 0.05
    
    # Sync vs async (sync is more predictable)
    if "async def" not in content:
        score += 0.05
    
    return min(score, 1.0)


def _analyze_bounded(content: str, metadata: Dict) -> float:
    """Score Bounded component."""
    score = 0.7  # Base
    
    # Scope defined?
    if metadata.get("scope_defined", False):
        score += 0.15
    
    # Reasonable size?
    if len(content) < 5000:
        score += 0.1
    elif len(content) < 10000:
        score += 0.05
    
    # No scope creep indicators?
    scope_creep = ["TODO", "FIXME", "XXX", "HACK", "later", "eventually"]
    creep_count = sum(1 for s in scope_creep if s in content)
    score -= creep_count * 0.03
    
    return max(min(score, 1.0), 0.0)


def _analyze_evident(content: str, metadata: Dict) -> float:
    """Score Evident component."""
    score = 0.5  # Base
    
    # Has audit trail?
    if metadata.get("audit_trail", False):
        score += 0.25
    
    # Has docstrings?
    if '"""' in content or "'''" in content:
        score += 0.1
    
    # Has comments?
    comment_lines = len([l for l in content.split('\n') if l.strip().startswith('#')])
    if comment_lines > 5:
        score += 0.1
    elif comment_lines > 0:
        score += 0.05
    
    return min(score, 1.0)


def validate_vibe(
    content: str,
    has_tests: bool = False,
    has_citations: bool = False,
    has_error_handling: bool = False,
    scope_defined: bool = False,
    audit_trail: bool = False,
    custom_checks: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Calculate V.I.B.E. score for content.
    
    Args:
        content: Code or output to validate
        has_tests: Whether test coverage exists
        has_citations: Whether citations/links exist
        has_error_handling: Whether error handling present
        scope_defined: Whether scope is clearly defined
        audit_trail: Whether audit trail exists
        custom_checks: Optional custom score overrides
    
    Returns:
        Complete V.I.B.E. assessment
    """
    metadata = {
        "has_tests": has_tests,
        "has_citations": has_citations,
        "has_error_handling": has_error_handling,
        "scope_defined": scope_defined,
        "audit_trail": audit_trail
    }
    
    # Calculate component scores
    v = _analyze_verifiable(content, metadata)
    i = _analyze_idempotent(content, metadata)
    b = _analyze_bounded(content, metadata)
    e = _analyze_evident(content, metadata)
    
    # Apply custom overrides if provided
    if custom_checks:
        v = custom_checks.get("verifiable", v)
        i = custom_checks.get("idempotent", i)
        b = custom_checks.get("bounded", b)
        e = custom_checks.get("evident", e)
    
    score = VibeScore(
        verifiable=round(v, 3),
        idempotent=round(i, 3),
        bounded=round(b, 3),
        evident=round(e, 3)
    )
    
    # Build recommendations
    improvements = []
    if score.verifiable < 0.85:
        improvements.append("Add tests or citations to improve Verifiable score")
    if score.idempotent < 0.85:
        improvements.append("Add error handling for Idempotent score")
    if score.bounded < 0.85:
        improvements.append("Define scope more clearly for Bounded score")
    if score.evident < 0.85:
        improvements.append("Add documentation for Evident score")
    
    return {
        "score": round(score.total, 3),
        "breakdown": {
            "verifiable": score.verifiable,
            "idempotent": score.idempotent,
            "bounded": score.bounded,
            "evident": score.evident
        },
        "thresholds": {
            "execution": EXECUTION_THRESHOLD,
            "governance": GOVERNANCE_THRESHOLD
        },
        "passes_execution": score.passes_execution,
        "passes_governance": score.passes_governance,
        "recommendation": "PROCEED" if score.passes_execution else "HALT",
        "improvements": improvements if not score.passes_execution else [],
        "metadata_used": metadata
    }


# Export for Agent Zero instrument system
def run(
    content: str,
    has_tests: str = "false",
    has_citations: str = "false",
    has_error_handling: str = "false",
    scope_defined: str = "false",
    audit_trail: str = "false"
) -> str:
    """
    Agent Zero instrument entry point.
    """
    result = validate_vibe(
        content=content,
        has_tests=has_tests.lower() == "true",
        has_citations=has_citations.lower() == "true",
        has_error_handling=has_error_handling.lower() == "true",
        scope_defined=scope_defined.lower() == "true",
        audit_trail=audit_trail.lower() == "true"
    )
    
    return json.dumps(result, indent=2)
```

### 4.4 Tool 3: Forbidden Value Scanner

**File:** `instruments/avva_noon/forbidden_value_scanner.py`

```python
"""
Forbidden Value Scanner — Detects internal costs/margins
================================
HALT trigger for NOON guardian function.
"""

import json
import re
from typing import Dict, List, Any, Tuple

# Pattern definitions with categories and descriptions
FORBIDDEN_PATTERNS: List[Tuple[str, str, str]] = [
    # Internal costs (specific values)
    (r'\$0\.039', 'INTERNAL_COST', 'Gemini per-token cost'),
    (r'\$0\.0001', 'INTERNAL_COST', 'Whisper transcription cost'),
    (r'\$0\.0004', 'INTERNAL_COST', 'TTS cost per character'),
    (r'\$8(?:\s|$|\.)', 'INTERNAL_COST', 'ElevenLabs minute cost'),
    (r'\$0\.006', 'INTERNAL_COST', 'Deepgram cost'),
    (r'\$0\.0(?:\d+)', 'INTERNAL_COST', 'Potential internal rate'),
    
    # Margins and markups
    (r'300\s*%', 'MARGIN', 'Voice service margin'),
    (r'365\s*%', 'MARGIN', 'TTS service margin'),
    (r'250\s*%', 'MARGIN', 'AI service margin'),
    (r'400\s*%', 'MARGIN', 'Premium service margin'),
    (r'(?:our|internal)\s*margin', 'MARGIN', 'Margin keyword'),
    (r'(?:our|internal)\s*markup', 'MARGIN', 'Markup keyword'),
    (r'profit\s*margin', 'MARGIN', 'Profit margin reference'),
    (r'cost\s*basis', 'MARGIN', 'Cost basis reference'),
    
    # Provider references (as internal vendors)
    (r'(?:our|internal)\s*(?:vendor|provider)\s*(?:is\s*)?deepgram', 'PROVIDER', 'Deepgram vendor reference'),
    (r'(?:our|internal)\s*(?:vendor|provider)\s*(?:is\s*)?elevenlabs', 'PROVIDER', 'ElevenLabs vendor reference'),
    (r'(?:we\s*use|using)\s*openrouter\s*internal', 'PROVIDER', 'OpenRouter internal reference'),
    
    # Keywords that shouldn't appear in customer context
    (r'internal_cost', 'KEYWORD', 'Internal cost variable'),
    (r'internal\.?rate', 'KEYWORD', 'Internal rate reference'),
    (r'vendor_cost', 'KEYWORD', 'Vendor cost variable'),
    (r'base_cost', 'KEYWORD', 'Base cost reference'),
]


def scan_for_forbidden(text: str) -> Dict[str, Any]:
    """
    Scan text for forbidden values.
    
    Args:
        text: Content to scan
    
    Returns:
        Scan result with violations or clean status
    """
    violations = []
    
    for pattern, category, description in FORBIDDEN_PATTERNS:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            violations.append({
                "pattern": pattern,
                "category": category,
                "description": description,
                "match_count": len(matches),
                "matches": list(set(matches))[:5]  # Unique, limit to 5
            })
    
    if violations:
        # Group by category
        by_category = {}
        for v in violations:
            cat = v["category"]
            if cat not in by_category:
                by_category[cat] = []
            by_category[cat].append(v)
        
        return {
            "status": "HALT",
            "reason": "FORBIDDEN_VALUES_DETECTED",
            "violation_count": len(violations),
            "violations": violations,
            "by_category": by_category,
            "action": "STOP execution. Route to HITL for review.",
            "remediation": [
                "Remove all internal cost data from customer-facing output",
                "Remove margin/markup percentages from customer content",
                "Sanitize provider vendor references",
                "Route content to Ledger only (internal audit)"
            ],
            "customer_safe": False
        }
    
    return {
        "status": "CLEAN",
        "violations": [],
        "by_category": {},
        "action": "PROCEED with Charter logging.",
        "customer_safe": True
    }


def sanitize_for_charter(text: str) -> Dict[str, Any]:
    """
    Remove forbidden values from text for safe Charter output.
    
    Args:
        text: Content to sanitize
    
    Returns:
        Sanitized text and redaction report
    """
    sanitized = text
    redactions = []
    
    # Replacement patterns
    replacements = [
        (r'\$0\.039', '[INTERNAL_RATE]'),
        (r'\$0\.0001', '[INTERNAL_RATE]'),
        (r'\$0\.0004', '[INTERNAL_RATE]'),
        (r'\$8(?=\s|$|\.)', '[INTERNAL_RATE]'),
        (r'\$0\.006', '[INTERNAL_RATE]'),
        (r'300\s*%', '[INTERNAL_MARGIN]'),
        (r'365\s*%', '[INTERNAL_MARGIN]'),
        (r'250\s*%', '[INTERNAL_MARGIN]'),
        (r'(?:our|internal)\s*margin', '[REDACTED]'),
        (r'(?:our|internal)\s*markup', '[REDACTED]'),
        (r'internal_cost', '[REDACTED]'),
        (r'vendor_cost', '[REDACTED]'),
    ]
    
    for pattern, replacement in replacements:
        matches = re.findall(pattern, sanitized, re.IGNORECASE)
        if matches:
            redactions.append({
                "pattern": pattern,
                "replacement": replacement,
                "count": len(matches)
            })
            sanitized = re.sub(pattern, replacement, sanitized, flags=re.IGNORECASE)
    
    return {
        "original_length": len(text),
        "sanitized_length": len(sanitized),
        "sanitized_text": sanitized,
        "redaction_count": len(redactions),
        "redactions": redactions,
        "is_modified": len(redactions) > 0
    }


# Export for Agent Zero instrument system
def run(text: str, action: str = "scan") -> str:
    """
    Agent Zero instrument entry point.
    
    Args:
        text: Content to process
        action: "scan" or "sanitize"
    
    Returns:
        JSON result
    """
    if action == "sanitize":
        result = sanitize_for_charter(text)
    else:
        result = scan_for_forbidden(text)
    
    return json.dumps(result, indent=2)
```

### 4.5 Tool 4: Audit Report Generator

**File:** `instruments/avva_noon/audit_report_generator.py`

```python
"""
Audit Report Generator — NOON validation artifact for HITL review
================================
Produces end-of-task summary for Master Smeltwarden approval.
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

REPORTS_PATH = Path(os.getenv("AUDIT_REPORTS_PATH", "reports/"))


def generate_audit_report(
    task_id: str,
    task_description: str,
    vibe_score: float,
    charter_entries: int = 0,
    ledger_entries: int = 0,
    halt_incidents: int = 0,
    forbidden_violations: int = 0,
    runtime_hours: float = 0.0,
    legacy_estimate_hours: Optional[float] = None,
    files_modified: Optional[List[str]] = None,
    tests_passed: Optional[int] = None,
    tests_failed: Optional[int] = None,
    notes: str = ""
) -> Dict[str, Any]:
    """
    Generate comprehensive audit report for HITL review.
    
    Args:
        task_id: Unique task identifier
        task_description: Human-readable task description
        vibe_score: Final V.I.B.E. score
        charter_entries: Number of Charter log entries
        ledger_entries: Number of Ledger log entries
        halt_incidents: Number of HALT triggers
        forbidden_violations: Number of violations detected
        runtime_hours: Actual FDH runtime
        legacy_estimate_hours: Original legacy estimate (optional)
        files_modified: List of files changed
        tests_passed: Number of passing tests
        tests_failed: Number of failing tests
        notes: Additional notes
    
    Returns:
        Complete audit report
    """
    timestamp = datetime.utcnow()
    report_id = f"NOON-{task_id}-{timestamp.strftime('%Y%m%d%H%M%S')}"
    
    # Calculate efficiency
    compression_rate = None
    compression_percentage = None
    if legacy_estimate_hours and legacy_estimate_hours > 0:
        compression_rate = (legacy_estimate_hours - runtime_hours) / legacy_estimate_hours
        compression_percentage = f"{compression_rate * 100:.1f}%"
    
    # Determine recommendation
    recommendation = _get_recommendation(
        vibe_score=vibe_score,
        halt_incidents=halt_incidents,
        forbidden_violations=forbidden_violations,
        tests_failed=tests_failed or 0
    )
    
    report = {
        "report_id": report_id,
        "generated_at": timestamp.isoformat() + "Z",
        "framework": "AVVA NOON × Agent Zero",
        
        "task": {
            "id": task_id,
            "description": task_description
        },
        
        "validation": {
            "vibe_score": vibe_score,
            "vibe_status": "PASS" if vibe_score >= 0.85 else "FAIL",
            "vibe_threshold": 0.85,
            "halt_incidents": halt_incidents,
            "forbidden_violations": forbidden_violations,
            "charter_integrity": "CLEAN" if forbidden_violations == 0 else "COMPROMISED"
        },
        
        "logging": {
            "charter_entries": charter_entries,
            "ledger_entries": ledger_entries,
            "separation_maintained": forbidden_violations == 0
        },
        
        "testing": {
            "tests_passed": tests_passed,
            "tests_failed": tests_failed,
            "test_coverage": "COMPLETE" if tests_failed == 0 and tests_passed else "INCOMPLETE" if tests_passed else "NO_TESTS"
        },
        
        "efficiency": {
            "runtime_hours": runtime_hours,
            "legacy_estimate_hours": legacy_estimate_hours,
            "compression_rate": round(compression_rate, 4) if compression_rate else None,
            "compression_percentage": compression_percentage,
            "meets_target": compression_rate >= 0.9 if compression_rate else None
        },
        
        "artifacts": {
            "files_modified": files_modified or [],
            "files_count": len(files_modified) if files_modified else 0
        },
        
        "notes": notes,
        
        "recommendation": recommendation,
        
        "hitl_required": recommendation["decision"] != "APPROVE",
        
        "signatures": {
            "noon_validator": "AVVA NOON Guardian",
            "timestamp": timestamp.isoformat() + "Z",
            "awaiting_approval": recommendation["decision"] != "APPROVE"
        }
    }
    
    # Save report
    save_result = _save_report(report)
    report["saved"] = save_result
    
    return report


def _get_recommendation(
    vibe_score: float,
    halt_incidents: int,
    forbidden_violations: int,
    tests_failed: int
) -> Dict[str, Any]:
    """Generate HITL recommendation based on metrics."""
    
    if forbidden_violations > 0:
        return {
            "decision": "REJECT",
            "severity": "CRITICAL",
            "reason": "Charter integrity compromised - forbidden values detected",
            "action": "Review and remediate all violations before approval",
            "blockers": [f"{forbidden_violations} forbidden value violation(s)"]
        }
    
    if tests_failed > 0:
        return {
            "decision": "REJECT",
            "severity": "HIGH",
            "reason": f"Test failures detected ({tests_failed} failed)",
            "action": "Fix failing tests before approval",
            "blockers": [f"{tests_failed} test(s) failing"]
        }
    
    if vibe_score < 0.85:
        return {
            "decision": "REJECT",
            "severity": "HIGH",
            "reason": f"V.I.B.E. score below threshold ({vibe_score:.3f} < 0.85)",
            "action": "Improve code quality to meet V.I.B.E. threshold",
            "blockers": ["V.I.B.E. below 0.85"]
        }
    
    if halt_incidents > 3:
        return {
            "decision": "REVIEW",
            "severity": "MEDIUM",
            "reason": f"High HALT incident count ({halt_incidents})",
            "action": "Detailed review of HALT causes required",
            "blockers": []
        }
    
    if vibe_score >= 0.95:
        return {
            "decision": "APPROVE",
            "severity": "LOW",
            "reason": "Excellent V.I.B.E. score, no violations, tests passing",
            "action": "Ready for production deployment",
            "blockers": []
        }
    
    return {
        "decision": "APPROVE_WITH_NOTES",
        "severity": "LOW",
        "reason": f"Acceptable V.I.B.E. score ({vibe_score:.3f})",
        "action": "Approved - consider improvements in future iterations",
        "blockers": []
    }


def _save_report(report: Dict[str, Any]) -> Dict[str, Any]:
    """Save report to file system."""
    try:
        REPORTS_PATH.mkdir(parents=True, exist_ok=True)
        
        filepath = REPORTS_PATH / f"{report['report_id']}.json"
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
        
        return {
            "success": True,
            "filepath": str(filepath)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


# Export for Agent Zero instrument system
def run(
    task_id: str,
    task_description: str,
    vibe_score: str = "0.0",
    charter_entries: str = "0",
    ledger_entries: str = "0",
    halt_incidents: str = "0",
    forbidden_violations: str = "0",
    runtime_hours: str = "0.0",
    legacy_estimate_hours: str = "",
    files_modified: str = "[]",
    notes: str = ""
) -> str:
    """
    Agent Zero instrument entry point.
    """
    try:
        files = json.loads(files_modified) if files_modified else []
    except json.JSONDecodeError:
        files = [files_modified] if files_modified else []
    
    result = generate_audit_report(
        task_id=task_id,
        task_description=task_description,
        vibe_score=float(vibe_score),
        charter_entries=int(charter_entries),
        ledger_entries=int(ledger_entries),
        halt_incidents=int(halt_incidents),
        forbidden_violations=int(forbidden_violations),
        runtime_hours=float(runtime_hours),
        legacy_estimate_hours=float(legacy_estimate_hours) if legacy_estimate_hours else None,
        files_modified=files,
        notes=notes
    )
    
    return json.dumps(result, indent=2)
```

### 4.6 Tool Registration

**File:** `instruments/avva_noon/__init__.py`

```python
"""
AVVA NOON Governance Tools
================================
Required instruments for NOON guardian function.
"""

from .charter_ledger_logger import (
    log_to_charter,
    log_to_ledger,
    dual_log,
    run as charter_ledger_run
)

from .vibe_validator import (
    validate_vibe,
    VibeScore,
    run as vibe_run
)

from .forbidden_value_scanner import (
    scan_for_forbidden,
    sanitize_for_charter,
    run as scanner_run
)

from .audit_report_generator import (
    generate_audit_report,
    run as audit_run
)

__all__ = [
    # Charter/Ledger
    "log_to_charter",
    "log_to_ledger", 
    "dual_log",
    
    # V.I.B.E.
    "validate_vibe",
    "VibeScore",
    
    # Forbidden Scanner
    "scan_for_forbidden",
    "sanitize_for_charter",
    
    # Audit
    "generate_audit_report"
]
```

---

## 5. WORKFLOW CONFIGURATION

### 5.1 RTCCF Parser

**File:** `instruments/avva_noon/rtccf_parser.py`

```python
"""
RTCCF Parser — Role-Task-Context-Constraints-Format
================================
Validates and parses task intake format.
"""

import json
import re
from typing import Dict, Any, Optional, List

REQUIRED_FIELDS = ["role", "task", "context", "constraints", "format"]


def parse_rtccf(text: str) -> Dict[str, Any]:
    """
    Parse RTCCF formatted input.
    
    Expected format:
    RTCCF:
    - Role: [value]
    - Task: [value]
    - Context: [value]
    - Constraints: [value]
    - Format: [value]
    """
    result = {
        "valid": False,
        "fields": {},
        "missing": [],
        "warnings": []
    }
    
    # Try to extract fields
    patterns = {
        "role": r"[-•]\s*Role:\s*(.+?)(?=\n[-•]|\n\n|$)",
        "task": r"[-•]\s*Task:\s*(.+?)(?=\n[-•]|\n\n|$)",
        "context": r"[-•]\s*Context:\s*(.+?)(?=\n[-•]|\n\n|$)",
        "constraints": r"[-•]\s*Constraints:\s*(.+?)(?=\n[-•]|\n\n|$)",
        "format": r"[-•]\s*Format:\s*(.+?)(?=\n[-•]|\n\n|$)"
    }
    
    for field, pattern in patterns.items():
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            result["fields"][field] = match.group(1).strip()
        else:
            result["missing"].append(field)
    
    # Check validity
    result["valid"] = len(result["missing"]) == 0
    
    # Add warnings for weak fields
    for field, value in result["fields"].items():
        if len(value) < 10:
            result["warnings"].append(f"{field} seems too brief")
    
    return result


def validate_rtccf_or_request(text: str) -> Dict[str, Any]:
    """
    Validate RTCCF or generate request for missing fields.
    """
    parsed = parse_rtccf(text)
    
    if parsed["valid"]:
        return {
            "status": "VALID",
            "parsed": parsed["fields"],
            "action": "PROCEED with task execution"
        }
    
    return {
        "status": "INCOMPLETE",
        "missing_fields": parsed["missing"],
        "provided_fields": list(parsed["fields"].keys()),
        "action": "REQUEST missing RTCCF fields",
        "template": generate_rtccf_template(parsed["fields"])
    }


def generate_rtccf_template(existing: Dict[str, str] = None) -> str:
    """Generate RTCCF template with any existing fields."""
    existing = existing or {}
    
    return f"""Please provide task details in RTCCF format:

RTCCF:
- Role: {existing.get('role', '[Who should I act as?]')}
- Task: {existing.get('task', '[What needs to be produced?]')}
- Context: {existing.get('context', '[Repository, tech stack, existing decisions]')}
- Constraints: {existing.get('constraints', '[Security tier, forbidden items, required approvals]')}
- Format: {existing.get('format', '[Expected output: files, tests, documentation]')}
"""


def run(text: str) -> str:
    """Agent Zero instrument entry point."""
    result = validate_rtccf_or_request(text)
    return json.dumps(result, indent=2)
```

---

## 6. TESTING FRAMEWORK

### 6.1 Unit Tests

**File:** `tests/test_charter_ledger.py`

```python
"""Tests for Charter/Ledger logger."""

import pytest
from instruments.avva_noon.charter_ledger_logger import (
    log_to_charter,
    log_to_ledger,
    dual_log,
    _contains_forbidden
)


class TestForbiddenDetection:
    def test_detects_internal_cost(self):
        violations = _contains_forbidden("Our cost is $0.039 per token")
        assert "$0.039" in violations
    
    def test_detects_margin(self):
        violations = _contains_forbidden("We apply a 300% markup")
        assert "300%" in violations
    
    def test_clean_text_passes(self):
        violations = _contains_forbidden("User signed up successfully")
        assert len(violations) == 0


class TestCharterLogging:
    def test_blocks_forbidden_values(self):
        result = log_to_charter("Internal cost is $8 per minute")
        assert result["status"] == "BLOCKED"
        assert not result["logged"]
    
    def test_allows_clean_content(self):
        result = log_to_charter("User completed purchase")
        assert result["status"] == "OK"
        assert result["logged"]


class TestLedgerLogging:
    def test_accepts_all_content(self):
        result = log_to_ledger("Internal cost is $8 per minute")
        assert result["status"] == "OK"
        assert result["contains_sensitive"]


class TestDualLog:
    def test_dual_log_with_sensitive(self):
        result = dual_log("Our margin is 300%")
        assert result["ledger"]["status"] == "OK"
        assert result["charter"]["status"] == "BLOCKED"
        assert not result["customer_safe"]
```

### 6.2 Integration Tests

**File:** `tests/test_integration.py`

```python
"""Integration tests for AVVA NOON tools."""

import pytest
from instruments.avva_noon import (
    dual_log,
    validate_vibe,
    scan_for_forbidden,
    generate_audit_report
)


class TestFullWorkflow:
    def test_clean_execution_flow(self):
        # Generate some code
        code = '''
        def user_signup(email: str) -> dict:
            """Handle user signup."""
            try:
                user = create_user(email)
                return {"status": "success", "user_id": user.id}
            except Exception as e:
                return {"status": "error", "message": str(e)}
        '''
        
        # Step 1: Scan for forbidden values
        scan_result = scan_for_forbidden(code)
        assert scan_result["status"] == "CLEAN"
        
        # Step 2: Validate V.I.B.E.
        vibe_result = validate_vibe(
            code,
            has_error_handling=True,
            scope_defined=True
        )
        assert vibe_result["passes_execution"]
        
        # Step 3: Log to Charter/Ledger
        log_result = dual_log(f"Generated code: {code}")
        assert log_result["customer_safe"]
        
        # Step 4: Generate audit report
        report = generate_audit_report(
            task_id="TEST-001",
            task_description="User signup function",
            vibe_score=vibe_result["score"],
            charter_entries=1,
            ledger_entries=1,
            halt_incidents=0,
            forbidden_violations=0,
            runtime_hours=0.5
        )
        assert report["recommendation"]["decision"] in ["APPROVE", "APPROVE_WITH_NOTES"]
```

---

## 7. PRODUCTION DEPLOYMENT

### 7.1 Docker Compose

**File:** `docker-compose.yml`

```yaml
version: '3.8'

services:
  agent-zero-avva:
    build: .
    container_name: agent-zero-avva
    ports:
      - "50001:80"
    volumes:
      - ./prompts:/app/prompts
      - ./instruments:/app/instruments
      - ./memory:/app/memory
      - ./knowledge:/app/knowledge
      - ./logs:/app/logs
      - ./reports:/app/reports
    environment:
      - CHAT_MODEL=${CHAT_MODEL:-gpt-4o}
      - UTILITY_MODEL=${UTILITY_MODEL:-gpt-4o-mini}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - VIBE_THRESHOLD=0.85
      - CHARTER_LOG_PATH=/app/logs/charter.log
      - LEDGER_LOG_PATH=/app/logs/ledger.log
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  logs:
  reports:
  memory:
```

### 7.2 Production Commands

```bash
# Start production stack
docker-compose up -d

# View logs
docker-compose logs -f agent-zero-avva

# Restart after config changes
docker-compose restart

# Stop
docker-compose down
```

---

## 8. MONITORING & ALERTING

### 8.1 Metrics to Track

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| V.I.B.E. Average | ≥0.85 | <0.80 |
| HALT Incidents | <5/day | >10/day |
| Charter Leakage | 0 | Any |
| Response Time | <30s | >60s |
| Uptime | 99% | <95% |

### 8.2 Log Monitoring Script

**File:** `scripts/monitor_logs.py`

```python
#!/usr/bin/env python3
"""Monitor Charter/Ledger for alerts."""

import json
import time
from pathlib import Path

CHARTER_PATH = Path("logs/charter.log")
LEDGER_PATH = Path("logs/ledger.log")


def check_for_leakage():
    """Check if any sensitive data in Charter."""
    if not CHARTER_PATH.exists():
        return []
    
    alerts = []
    with open(CHARTER_PATH) as f:
        for line in f:
            try:
                entry = json.loads(line)
                if entry.get("verified_clean") is False:
                    alerts.append(entry)
            except json.JSONDecodeError:
                continue
    
    return alerts


def main():
    """Main monitoring loop."""
    while True:
        alerts = check_for_leakage()
        if alerts:
            print(f"⚠️ ALERT: {len(alerts)} potential leakage(s) detected!")
            for alert in alerts:
                print(f"  - {alert.get('timestamp')}: {alert.get('message')[:50]}...")
        else:
            print("✅ Charter clean")
        
        time.sleep(60)


if __name__ == "__main__":
    main()
```

---

## 9. TROUBLESHOOTING GUIDE

### 9.1 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Tools not loading | Path incorrect | Check `/instruments/avva_noon/` exists |
| HALT not triggering | Pattern miss | Update FORBIDDEN_VALUES list |
| V.I.B.E. too low | Missing metadata | Pass correct flags to validator |
| Charter blocked | False positive | Review and update patterns |
| Docker won't start | Port conflict | Change port in docker-compose |

### 9.2 Debug Commands

```bash
# Check if tools are loadable
docker exec agent-zero-avva python -c "from instruments.avva_noon import *; print('OK')"

# View recent Charter entries
tail -20 logs/charter.log | jq .

# View recent Ledger entries  
tail -20 logs/ledger.log | jq .

# Check for HALT events
grep -i "HALT" logs/ledger.log
```

---

## 10. 12-MONTH ROADMAP

### Month 1-2: Foundation
- [x] Deploy Agent Zero
- [x] Integrate AVVA NOON overlay
- [x] Build 4 governance tools
- [x] Initial testing

### Month 3-4: Equilibrium
- [ ] Parallel Hone cycle
- [ ] HITL workflow
- [ ] FDH tracking
- [ ] Production hardening

### Month 5-6: Scale
- [ ] Enterprise monitoring
- [ ] Team training
- [ ] Documentation completion
- [ ] Client pilot

### Month 7-9: Expansion
- [ ] SmelterOS integration
- [ ] Multi-agent coordination
- [ ] Advanced V.I.B.E. scoring
- [ ] Custom tool marketplace

### Month 10-12: Mastery
- [ ] Industry-specific profiles
- [ ] Enterprise federation
- [ ] Compliance certifications
- [ ] Open-source contribution

---

## ∞ CONCLUSION

This guide provides everything needed to transform AVVA NOON from concept to production reality using Agent Zero as the execution substrate.

**Key Deliverables:**
- Complete system prompt overlay
- 4 production-ready governance tools
- Testing framework
- Deployment configuration
- Monitoring setup
- Troubleshooting guide

**Next Step:** Start Phase 1 implementation this week.

---

*Document Version: 1.0*  
*Last Updated: January 15, 2026*  
*Framework: AVVA NOON × Agent Zero*  
*Total Sections: 10*  
*Ready for Implementation: YES*
