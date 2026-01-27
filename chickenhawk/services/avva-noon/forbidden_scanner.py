"""
Forbidden Value Scanner — Detects internal costs/margins
================================================================
HALT trigger for NOON guardian function.

Scans content for internal pricing, margins, and vendor cost data
that should NEVER appear in customer-facing outputs.

Use before any output goes to Charter (customer-safe) stream.
"""

import os
import re
from dataclasses import dataclass
from typing import List, Tuple, TypedDict, Optional, Literal
import logging

# Configure logging
logger = logging.getLogger("avva_noon.forbidden_scanner")

# ═══════════════════════════════════════════════════════════════════════════
# FORBIDDEN PATTERNS
# ═══════════════════════════════════════════════════════════════════════════

# Pattern definitions: (regex, category, description, severity)
FORBIDDEN_PATTERNS: List[Tuple[str, str, str, str]] = [
    # ═══ Internal Costs (CRITICAL) ═══
    (r'\$0\.039\b', 'INTERNAL_COST', 'Gemini per-token cost', 'CRITICAL'),
    (r'\$0\.0001\b', 'INTERNAL_COST', 'Whisper transcription cost', 'CRITICAL'),
    (r'\$0\.0004\b', 'INTERNAL_COST', 'TTS cost per character', 'CRITICAL'),
    (r'\$8(?:\s|$|\.|\,)', 'INTERNAL_COST', 'ElevenLabs minute cost', 'CRITICAL'),
    (r'\$0\.006\b', 'INTERNAL_COST', 'Deepgram cost', 'CRITICAL'),
    (r'\$0\.015\b', 'INTERNAL_COST', 'GPT-4 input cost', 'CRITICAL'),
    (r'\$0\.03\b', 'INTERNAL_COST', 'GPT-4 output cost', 'CRITICAL'),
    (r'\$0\.0025\b', 'INTERNAL_COST', 'Claude Haiku cost', 'CRITICAL'),
    (r'\$0\.0(?:\d{2,})\b', 'INTERNAL_COST', 'Potential internal rate', 'HIGH'),
    
    # ═══ Margins and Markups (CRITICAL) ═══
    (r'300\s*%\s*(?:margin|markup)?', 'MARGIN', 'Voice service margin', 'CRITICAL'),
    (r'365\s*%\s*(?:margin|markup)?', 'MARGIN', 'TTS service margin', 'CRITICAL'),
    (r'250\s*%\s*(?:margin|markup)?', 'MARGIN', 'AI service margin', 'CRITICAL'),
    (r'400\s*%\s*(?:margin|markup)?', 'MARGIN', 'Premium service margin', 'CRITICAL'),
    (r'(?:our|internal)\s*margin', 'MARGIN', 'Margin keyword', 'HIGH'),
    (r'(?:our|internal)\s*markup', 'MARGIN', 'Markup keyword', 'HIGH'),
    (r'profit\s*margin', 'MARGIN', 'Profit margin reference', 'HIGH'),
    (r'cost\s*basis', 'MARGIN', 'Cost basis reference', 'MEDIUM'),
    
    # ═══ Provider Internal References (HIGH) ═══
    (r'(?:our|internal)\s*(?:vendor|provider)\s*(?:is\s*)?deepgram', 'PROVIDER', 'Deepgram vendor ref', 'HIGH'),
    (r'(?:our|internal)\s*(?:vendor|provider)\s*(?:is\s*)?elevenlabs', 'PROVIDER', 'ElevenLabs vendor ref', 'HIGH'),
    (r'(?:our|internal)\s*(?:vendor|provider)\s*(?:is\s*)?openrouter', 'PROVIDER', 'OpenRouter vendor ref', 'HIGH'),
    (r'(?:we\s*use|using)\s*\w+\s*(?:as\s*)?internal', 'PROVIDER', 'Internal provider ref', 'MEDIUM'),
    
    # ═══ Keywords (MEDIUM) ═══
    (r'internal_cost', 'KEYWORD', 'Internal cost variable', 'HIGH'),
    (r'internal\.?rate', 'KEYWORD', 'Internal rate reference', 'HIGH'),
    (r'vendor_cost', 'KEYWORD', 'Vendor cost variable', 'HIGH'),
    (r'base_cost', 'KEYWORD', 'Base cost reference', 'MEDIUM'),
    (r'wholesale_?price', 'KEYWORD', 'Wholesale price reference', 'HIGH'),
    (r'unit_economics', 'KEYWORD', 'Unit economics reference', 'MEDIUM'),
]

# Replacement patterns for sanitization
SANITIZE_REPLACEMENTS: List[Tuple[str, str]] = [
    (r'\$0\.039\b', '[REDACTED_RATE]'),
    (r'\$0\.0001\b', '[REDACTED_RATE]'),
    (r'\$0\.0004\b', '[REDACTED_RATE]'),
    (r'\$8(?=\s|$|\.|\,)', '[REDACTED_RATE]'),
    (r'\$0\.006\b', '[REDACTED_RATE]'),
    (r'\$0\.015\b', '[REDACTED_RATE]'),
    (r'\$0\.03\b', '[REDACTED_RATE]'),
    (r'\$0\.0(?:\d{2,})\b', '[REDACTED_RATE]'),
    (r'300\s*%', '[REDACTED_MARGIN]'),
    (r'365\s*%', '[REDACTED_MARGIN]'),
    (r'250\s*%', '[REDACTED_MARGIN]'),
    (r'400\s*%', '[REDACTED_MARGIN]'),
    (r'(?:our|internal)\s*margin', '[REDACTED]'),
    (r'(?:our|internal)\s*markup', '[REDACTED]'),
    (r'internal_cost', '[REDACTED]'),
    (r'vendor_cost', '[REDACTED]'),
    (r'base_cost', '[REDACTED]'),
    (r'wholesale_?price', '[REDACTED]'),
]


# ═══════════════════════════════════════════════════════════════════════════
# DATA TYPES
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class Violation:
    """Single forbidden value violation."""
    pattern: str
    category: str
    description: str
    severity: str
    match_count: int
    matches: List[str]
    
    def to_dict(self) -> dict:
        return {
            "pattern": self.pattern,
            "category": self.category,
            "description": self.description,
            "severity": self.severity,
            "match_count": self.match_count,
            "matches": self.matches
        }


class ScanResult(TypedDict):
    """Result of forbidden value scan."""
    status: Literal["CLEAN", "HALT"]
    reason: Optional[str]
    violation_count: int
    violations: List[dict]
    by_category: dict
    by_severity: dict
    action: str
    remediation: List[str]
    customer_safe: bool


class SanitizeResult(TypedDict):
    """Result of content sanitization."""
    original_length: int
    sanitized_length: int
    sanitized_text: str
    redaction_count: int
    redactions: List[dict]
    is_modified: bool


# ═══════════════════════════════════════════════════════════════════════════
# CORE FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

def scan_for_forbidden(text: str) -> ScanResult:
    """
    Scan text for forbidden values.
    
    Returns HALT status if ANY forbidden values are found.
    Use this before sending any content to customers.
    
    Args:
        text: Content to scan
        
    Returns:
        ScanResult with violations or clean status
        
    Example:
        >>> result = scan_for_forbidden("Our margin is 300%")
        >>> if result["status"] == "HALT":
        ...     print("Cannot send to customer!")
        ...     for v in result["violations"]:
        ...         print(f"  - {v['description']}")
    """
    violations: List[Violation] = []
    
    for pattern, category, description, severity in FORBIDDEN_PATTERNS:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            violations.append(Violation(
                pattern=pattern,
                category=category,
                description=description,
                severity=severity,
                match_count=len(matches),
                matches=list(set(matches))[:5]  # Unique, limit to 5
            ))
    
    if violations:
        # Group by category
        by_category: dict = {}
        for v in violations:
            if v.category not in by_category:
                by_category[v.category] = []
            by_category[v.category].append(v.to_dict())
        
        # Group by severity
        by_severity: dict = {"CRITICAL": [], "HIGH": [], "MEDIUM": [], "LOW": []}
        for v in violations:
            if v.severity in by_severity:
                by_severity[v.severity].append(v.to_dict())
        
        # Remove empty severity levels
        by_severity = {k: v for k, v in by_severity.items() if v}
        
        logger.warning(f"Forbidden scan: {len(violations)} violation(s) detected")
        
        return ScanResult(
            status="HALT",
            reason="FORBIDDEN_VALUES_DETECTED",
            violation_count=len(violations),
            violations=[v.to_dict() for v in violations],
            by_category=by_category,
            by_severity=by_severity,
            action="STOP execution. Route to HITL for review.",
            remediation=[
                "Remove all internal cost data from customer-facing output",
                "Remove margin/markup percentages from customer content",
                "Sanitize provider vendor references",
                "Route content to Ledger only (internal audit)",
                "Use sanitize_for_charter() to auto-redact sensitive values"
            ],
            customer_safe=False
        )
    
    return ScanResult(
        status="CLEAN",
        reason=None,
        violation_count=0,
        violations=[],
        by_category={},
        by_severity={},
        action="PROCEED with Charter logging.",
        remediation=[],
        customer_safe=True
    )


def sanitize_for_charter(text: str) -> SanitizeResult:
    """
    Remove forbidden values from text for safe Charter output.
    
    Replaces detected patterns with [REDACTED] placeholders.
    Use when content MUST go to customers but contains sensitive data.
    
    Args:
        text: Content to sanitize
        
    Returns:
        SanitizeResult with cleaned text and redaction report
        
    Example:
        >>> result = sanitize_for_charter("Internal cost is $0.039")
        >>> print(result["sanitized_text"])
        Internal cost is [REDACTED_RATE]
    """
    sanitized = text
    redactions: List[dict] = []
    
    for pattern, replacement in SANITIZE_REPLACEMENTS:
        matches = re.findall(pattern, sanitized, re.IGNORECASE)
        if matches:
            redactions.append({
                "pattern": pattern,
                "replacement": replacement,
                "count": len(matches),
                "original_values": list(set(matches))[:3]
            })
            sanitized = re.sub(pattern, replacement, sanitized, flags=re.IGNORECASE)
    
    is_modified = len(redactions) > 0
    
    if is_modified:
        logger.info(f"Sanitized {len(redactions)} pattern(s) for Charter")
    
    return SanitizeResult(
        original_length=len(text),
        sanitized_length=len(sanitized),
        sanitized_text=sanitized,
        redaction_count=len(redactions),
        redactions=redactions,
        is_modified=is_modified
    )


def scan_and_sanitize(text: str) -> dict:
    """
    Combined scan and sanitize operation.
    
    First scans for violations, then sanitizes if any found.
    
    Args:
        text: Content to process
        
    Returns:
        Combined result with scan and sanitize data
    """
    scan_result = scan_for_forbidden(text)
    
    if scan_result["status"] == "HALT":
        sanitize_result = sanitize_for_charter(text)
        return {
            "original_status": "HALT",
            "scan": scan_result,
            "sanitize": sanitize_result,
            "safe_output": sanitize_result["sanitized_text"],
            "action": "Use safe_output for Charter, original for Ledger"
        }
    
    return {
        "original_status": "CLEAN",
        "scan": scan_result,
        "sanitize": None,
        "safe_output": text,
        "action": "Original text is safe for Charter"
    }


# ═══════════════════════════════════════════════════════════════════════════
# UTILITY FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

def get_pattern_list() -> List[dict]:
    """Get list of all forbidden patterns with metadata."""
    return [
        {
            "pattern": p[0],
            "category": p[1],
            "description": p[2],
            "severity": p[3]
        }
        for p in FORBIDDEN_PATTERNS
    ]


def add_custom_pattern(
    pattern: str,
    category: str,
    description: str,
    severity: str = "HIGH"
) -> None:
    """
    Add a custom forbidden pattern at runtime.
    
    Args:
        pattern: Regex pattern to match
        category: Category (INTERNAL_COST, MARGIN, PROVIDER, KEYWORD)
        description: Human-readable description
        severity: CRITICAL, HIGH, MEDIUM, or LOW
    """
    FORBIDDEN_PATTERNS.append((pattern, category, description, severity))
    logger.info(f"Added custom pattern: {description}")


def check_single_value(value: str) -> dict:
    """
    Quick check if a single value is forbidden.
    
    Args:
        value: Value to check
        
    Returns:
        Check result
    """
    for pattern, category, description, severity in FORBIDDEN_PATTERNS:
        if re.search(pattern, value, re.IGNORECASE):
            return {
                "forbidden": True,
                "pattern": pattern,
                "category": category,
                "description": description,
                "severity": severity
            }
    
    return {"forbidden": False}


# ═══════════════════════════════════════════════════════════════════════════
# CLI ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import sys
    import json
    
    if len(sys.argv) < 2:
        print("Usage: python forbidden_scanner.py <text_or_file>")
        print("       python forbidden_scanner.py --scan 'text to scan'")
        print("       python forbidden_scanner.py --sanitize 'text to clean'")
        print("       python forbidden_scanner.py --file path/to/file.txt")
        sys.exit(1)
    
    action = "scan"
    content = ""
    
    if sys.argv[1] == "--scan" and len(sys.argv) > 2:
        action = "scan"
        content = sys.argv[2]
    elif sys.argv[1] == "--sanitize" and len(sys.argv) > 2:
        action = "sanitize"
        content = sys.argv[2]
    elif sys.argv[1] == "--file" and len(sys.argv) > 2:
        action = "scan"
        with open(sys.argv[2]) as f:
            content = f.read()
    else:
        content = sys.argv[1]
    
    if action == "sanitize":
        result = sanitize_for_charter(content)
    else:
        result = scan_for_forbidden(content)
    
    print(json.dumps(result, indent=2))
    
    # Exit with appropriate code
    if action == "scan":
        sys.exit(0 if result["status"] == "CLEAN" else 1)
    else:
        sys.exit(0)
