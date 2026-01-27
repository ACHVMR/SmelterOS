# AVVA NOON Governance Service
# ================================
# Core governance tools for the AVVA NOON equilibrium framework.
# Provides Charter/Ledger logging, V.I.B.E. validation, forbidden value scanning,
# and audit report generation.

from .charter_ledger import (
    log_to_charter,
    log_to_ledger,
    dual_log,
    CharterEntry,
    LedgerEntry,
    DualLogResult,
    FORBIDDEN_VALUES
)

from .vibe_validator import (
    validate_vibe,
    VibeScore,
    VibeResult,
    EXECUTION_THRESHOLD,
    GOVERNANCE_THRESHOLD
)

from .forbidden_scanner import (
    scan_for_forbidden,
    sanitize_for_charter,
    ScanResult,
    SanitizeResult,
    FORBIDDEN_PATTERNS
)

from .audit_report import (
    generate_audit_report,
    AuditReport,
    Recommendation
)

from .fdh_tracker import (
    FDHTracker,
    FDHMetrics
)

from .rtccf_parser import (
    parse_rtccf,
    validate_rtccf,
    RTCCFTask,
    RTCCF_TEMPLATE
)

__all__ = [
    # Charter/Ledger
    "log_to_charter",
    "log_to_ledger",
    "dual_log",
    "CharterEntry",
    "LedgerEntry",
    "DualLogResult",
    "FORBIDDEN_VALUES",
    
    # V.I.B.E.
    "validate_vibe",
    "VibeScore",
    "VibeResult",
    "EXECUTION_THRESHOLD",
    "GOVERNANCE_THRESHOLD",
    
    # Forbidden Scanner
    "scan_for_forbidden",
    "sanitize_for_charter",
    "ScanResult",
    "SanitizeResult",
    "FORBIDDEN_PATTERNS",
    
    # Audit Report
    "generate_audit_report",
    "AuditReport",
    "Recommendation",
    
    # FDH Tracker
    "FDHTracker",
    "FDHMetrics",
    
    # RTCCF Parser
    "parse_rtccf",
    "validate_rtccf",
    "RTCCFTask",
    "RTCCF_TEMPLATE"
]

__version__ = "1.0.0"
__framework__ = "AVVA NOON × SmelterOS"
