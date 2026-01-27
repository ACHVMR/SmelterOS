"""
Charter/Ledger Logger — Dual-stream logging for AVVA NOON
================================================================
Charter = Customer-safe output (filtered, no internal costs/margins)
Ledger = Internal audit (complete, unfiltered, for compliance)

The separation ensures internal pricing, margins, and vendor costs
NEVER appear in customer-facing outputs.
"""

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List, TypedDict, Literal
from dataclasses import dataclass, asdict, field
import logging

# Configure logging
logger = logging.getLogger("avva_noon.charter_ledger")

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

CHARTER_PATH = Path(os.getenv("AVVA_NOON_CHARTER_PATH", "logs/charter.log"))
LEDGER_PATH = Path(os.getenv("AVVA_NOON_LEDGER_PATH", "logs/ledger.log"))

# Forbidden values - MUST NEVER appear in Charter (customer-safe) output
FORBIDDEN_VALUES: List[str] = [
    # ═══ Internal Costs ═══
    "$0.039",           # Gemini per-token cost
    "$0.0001",          # Whisper transcription cost
    "$0.0004",          # TTS cost per character
    "$8",               # ElevenLabs minute cost
    "$0.006",           # Deepgram cost
    "$0.015",           # GPT-4 input cost
    "$0.03",            # GPT-4 output cost
    "$0.0025",          # Claude Haiku cost
    "0.039",            # Without dollar sign variants
    "0.0001",
    "0.0004",
    
    # ═══ Margins & Markups ═══
    "300%",             # Voice service margin
    "365%",             # TTS service margin
    "250%",             # AI service margin
    "400%",             # Premium service margin
    "200%",             # Base service margin
    
    # ═══ Keywords ═══
    "internal_cost",
    "internal cost",
    "our margin",
    "our markup",
    "markup",
    "profit margin",
    "cost basis",
    "vendor cost",
    "base cost",
    "internal rate",
    "wholesale price",
    
    # ═══ Provider Internal References ═══
    "our vendor deepgram",
    "elevenlabs provider",
    "openrouter internal",
    "our provider openai",
]


# ═══════════════════════════════════════════════════════════════════════════
# DATA TYPES
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class CharterEntry:
    """Customer-safe log entry."""
    timestamp: str
    stream: Literal["CHARTER"] = "CHARTER"
    source: str = "agent"
    message: str = ""
    context: dict = field(default_factory=dict)
    verified_clean: bool = True
    
    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class LedgerEntry:
    """Internal audit log entry."""
    timestamp: str
    stream: Literal["LEDGER"] = "LEDGER"
    classification: str = "AUDIT"
    source: str = "agent"
    message: str = ""
    context: dict = field(default_factory=dict)
    contains_sensitive: bool = False
    sensitive_types: Optional[List[str]] = None
    
    def to_dict(self) -> dict:
        return asdict(self)


class CharterResult(TypedDict):
    status: Literal["OK", "BLOCKED"]
    stream: Literal["CHARTER"]
    logged: bool
    timestamp: Optional[str]
    reason: Optional[str]
    violations: Optional[List[str]]
    action: Optional[str]


class LedgerResult(TypedDict):
    status: Literal["OK"]
    stream: Literal["LEDGER"]
    classification: str
    logged: bool
    contains_sensitive: bool
    timestamp: str


class DualLogResult(TypedDict):
    charter: CharterResult
    ledger: LedgerResult
    overall_status: Literal["CLEAN", "SENSITIVE"]
    customer_safe: bool


# ═══════════════════════════════════════════════════════════════════════════
# CORE FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

def _contains_forbidden(text: str) -> List[str]:
    """
    Check if text contains any forbidden values.
    
    Args:
        text: Content to scan
        
    Returns:
        List of forbidden values found
    """
    violations = []
    text_lower = text.lower()
    
    for forbidden in FORBIDDEN_VALUES:
        if forbidden.lower() in text_lower:
            violations.append(forbidden)
    
    return violations


def _get_timestamp() -> str:
    """Get current UTC timestamp in ISO format."""
    return datetime.now(timezone.utc).isoformat()


def _write_log(path: Path, entry: dict) -> bool:
    """
    Write entry to log file.
    
    Args:
        path: Log file path
        entry: Log entry dictionary
        
    Returns:
        True if successful, False otherwise
    """
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")
        return True
    except Exception as e:
        logger.error(f"Log write error: {e}")
        return False


def log_to_charter(
    message: str,
    context: Optional[dict] = None,
    source: str = "agent"
) -> CharterResult:
    """
    Log to customer-safe Charter stream.
    
    BLOCKS if forbidden values detected. Use this for all customer-facing output.
    
    Args:
        message: Content to log
        context: Optional context dictionary
        source: Source identifier (agent, system, user)
        
    Returns:
        CharterResult with status and logging details
        
    Example:
        >>> result = log_to_charter("User purchased subscription")
        >>> if result["status"] == "OK":
        ...     print("Logged to Charter")
    """
    violations = _contains_forbidden(message)
    
    if violations:
        # HALT - Do not write to Charter
        logger.warning(f"Charter BLOCKED: {len(violations)} forbidden values detected")
        return CharterResult(
            status="BLOCKED",
            stream="CHARTER",
            logged=False,
            timestamp=None,
            reason="FORBIDDEN_VALUES_DETECTED",
            violations=violations,
            action="HALT - Route to Ledger only. Do not expose to customer."
        )
    
    # Safe to write
    timestamp = _get_timestamp()
    entry = CharterEntry(
        timestamp=timestamp,
        source=source,
        message=message,
        context=context or {},
        verified_clean=True
    )
    
    success = _write_log(CHARTER_PATH, entry.to_dict())
    
    return CharterResult(
        status="OK",
        stream="CHARTER",
        logged=success,
        timestamp=timestamp,
        reason=None,
        violations=None,
        action=None
    )


def log_to_ledger(
    message: str,
    context: Optional[dict] = None,
    classification: str = "AUDIT",
    source: str = "agent"
) -> LedgerResult:
    """
    Log to internal Ledger stream.
    
    Accepts ALL content (unfiltered). Use for internal auditing and compliance.
    
    Args:
        message: Content to log
        context: Optional context dictionary
        classification: Log classification (AUDIT, DEBUG, SECURITY, COST, etc.)
        source: Source identifier
        
    Returns:
        LedgerResult with logging details
        
    Example:
        >>> result = log_to_ledger(
        ...     "Internal cost: $0.039 per token",
        ...     classification="COST"
        ... )
    """
    violations = _contains_forbidden(message)
    timestamp = _get_timestamp()
    
    entry = LedgerEntry(
        timestamp=timestamp,
        classification=classification,
        source=source,
        message=message,
        context=context or {},
        contains_sensitive=len(violations) > 0,
        sensitive_types=violations if violations else None
    )
    
    success = _write_log(LEDGER_PATH, entry.to_dict())
    
    return LedgerResult(
        status="OK",
        stream="LEDGER",
        classification=classification,
        logged=success,
        contains_sensitive=entry.contains_sensitive,
        timestamp=timestamp
    )


def dual_log(
    message: str,
    context: Optional[dict] = None,
    source: str = "agent"
) -> DualLogResult:
    """
    Attempt Charter log (filtered), always log to Ledger (complete).
    
    This is the PRIMARY interface for AVVA NOON logging. Use this by default.
    
    Args:
        message: Content to log
        context: Optional context dictionary
        source: Source identifier
        
    Returns:
        DualLogResult with both stream results
        
    Example:
        >>> result = dual_log("Task completed successfully")
        >>> if result["customer_safe"]:
        ...     send_to_customer(result)
        ... else:
        ...     route_to_internal_review(result)
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
    
    is_clean = charter_result["status"] == "OK"
    
    return DualLogResult(
        charter=charter_result,
        ledger=ledger_result,
        overall_status="CLEAN" if is_clean else "SENSITIVE",
        customer_safe=is_clean
    )


# ═══════════════════════════════════════════════════════════════════════════
# UTILITY FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

def check_charter_safety(text: str) -> dict:
    """
    Check if text is safe for Charter without logging.
    
    Args:
        text: Content to check
        
    Returns:
        Safety check result
    """
    violations = _contains_forbidden(text)
    
    return {
        "safe": len(violations) == 0,
        "violations": violations,
        "violation_count": len(violations)
    }


def get_log_stats() -> dict:
    """Get statistics about log files."""
    stats = {
        "charter": {"exists": False, "entries": 0, "size_bytes": 0},
        "ledger": {"exists": False, "entries": 0, "size_bytes": 0}
    }
    
    for name, path in [("charter", CHARTER_PATH), ("ledger", LEDGER_PATH)]:
        if path.exists():
            stats[name]["exists"] = True
            stats[name]["size_bytes"] = path.stat().st_size
            with open(path) as f:
                stats[name]["entries"] = sum(1 for _ in f)
    
    return stats


# ═══════════════════════════════════════════════════════════════════════════
# CLI ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python charter_ledger.py <message> [stream]")
        print("  stream: charter, ledger, or dual (default)")
        sys.exit(1)
    
    message = sys.argv[1]
    stream = sys.argv[2] if len(sys.argv) > 2 else "dual"
    
    if stream == "charter":
        result = log_to_charter(message)
    elif stream == "ledger":
        result = log_to_ledger(message)
    else:
        result = dual_log(message)
    
    print(json.dumps(result, indent=2))
