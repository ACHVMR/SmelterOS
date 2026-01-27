"""
V.I.B.E. Validator — Verifiable, Idempotent, Bounded, Evident
================================================================
Scoring gate for AVVA NOON execution readiness.

V.I.B.E. ensures all code and outputs meet quality thresholds
before being shipped to production or customers.

Thresholds:
- Execution: ≥ 0.85 (85%) — Required for commit/ship
- Governance: ≥ 0.995 (99.5%) — Required for security/compliance
"""

import os
import re
from dataclasses import dataclass, field
from typing import Optional, List, TypedDict, Literal
import logging

# Configure logging
logger = logging.getLogger("avva_noon.vibe_validator")

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

EXECUTION_THRESHOLD = float(os.getenv("AVVA_NOON_VIBE_THRESHOLD", "0.85"))
GOVERNANCE_THRESHOLD = 0.995

# Component weights (must sum to 1.0)
WEIGHTS = {
    "verifiable": 0.25,
    "idempotent": 0.25,
    "bounded": 0.25,
    "evident": 0.25
}


# ═══════════════════════════════════════════════════════════════════════════
# DATA TYPES
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class VibeScore:
    """V.I.B.E. score breakdown."""
    verifiable: float
    idempotent: float
    bounded: float
    evident: float
    
    @property
    def total(self) -> float:
        """Weighted average of all components."""
        return (
            self.verifiable * WEIGHTS["verifiable"] +
            self.idempotent * WEIGHTS["idempotent"] +
            self.bounded * WEIGHTS["bounded"] +
            self.evident * WEIGHTS["evident"]
        ) / sum(WEIGHTS.values()) * 4  # Normalize to 0-1 range
    
    @property
    def simple_average(self) -> float:
        """Simple average of all components."""
        return (self.verifiable + self.idempotent + 
                self.bounded + self.evident) / 4
    
    @property
    def passes_execution(self) -> bool:
        """Check if score meets execution threshold."""
        return self.simple_average >= EXECUTION_THRESHOLD
    
    @property
    def passes_governance(self) -> bool:
        """Check if score meets governance threshold."""
        return self.simple_average >= GOVERNANCE_THRESHOLD
    
    def to_dict(self) -> dict:
        return {
            "verifiable": round(self.verifiable, 3),
            "idempotent": round(self.idempotent, 3),
            "bounded": round(self.bounded, 3),
            "evident": round(self.evident, 3)
        }


class VibeResult(TypedDict):
    """Result of V.I.B.E. validation."""
    score: float
    breakdown: dict
    thresholds: dict
    passes_execution: bool
    passes_governance: bool
    recommendation: Literal["PROCEED", "HALT", "REVIEW"]
    improvements: List[str]
    metadata_used: dict
    grade: str


# ═══════════════════════════════════════════════════════════════════════════
# SCORING FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

def _analyze_verifiable(content: str, metadata: dict) -> float:
    """
    Score Verifiable component.
    
    Measures: Evidence, citations, test coverage, documentation links.
    """
    score = 0.5  # Base score
    
    # Has explicit test coverage?
    if metadata.get("has_tests", False):
        score += 0.2
    
    # Contains test patterns?
    test_patterns = [
        r"def test_",           # Python pytest
        r"it\s*\(",             # JavaScript/Jest
        r"describe\s*\(",       # JavaScript/Mocha
        r"@Test",               # Java JUnit
        r"#\[test\]",           # Rust
        r"expect\s*\(",         # Assertions
        r"assert",              # Generic assertions
    ]
    for pattern in test_patterns:
        if re.search(pattern, content, re.IGNORECASE):
            score += 0.05
            break
    
    # Has citations or links?
    if metadata.get("has_citations", False):
        score += 0.15
    if re.search(r'https?://', content):
        score += 0.05
    
    # Has docstrings?
    if '"""' in content or "'''" in content:
        score += 0.05
    
    # Has type hints (Python)?
    if re.search(r'def \w+\([^)]*:\s*\w+', content):
        score += 0.05
    
    return min(score, 1.0)


def _analyze_idempotent(content: str, metadata: dict) -> float:
    """
    Score Idempotent component.
    
    Measures: Reproducibility, error handling, determinism.
    """
    score = 0.6  # Base score
    
    # Has explicit error handling?
    if metadata.get("has_error_handling", False):
        score += 0.15
    
    # Contains try/except or try/catch?
    if re.search(r'try\s*[:{]', content):
        score += 0.05
    if re.search(r'except|catch\s*\(', content):
        score += 0.05
    
    # Has retry logic?
    if re.search(r'retry|retries|attempt', content, re.IGNORECASE):
        score += 0.05
    
    # Uses deterministic patterns (no random without seed)?
    if "random" in content.lower():
        if "seed" in content.lower() or "random_state" in content.lower():
            score += 0.05  # Seeded is OK
        else:
            score -= 0.1  # Unseeded random is bad
    else:
        score += 0.05  # No random is fine
    
    # Avoids mutable defaults?
    if re.search(r'def \w+\([^)]*=\s*\[\]', content):
        score -= 0.1  # Mutable default is bad
    if re.search(r'def \w+\([^)]*=\s*\{\}', content):
        score -= 0.1  # Mutable default is bad
    
    return max(min(score, 1.0), 0.0)


def _analyze_bounded(content: str, metadata: dict) -> float:
    """
    Score Bounded component.
    
    Measures: Scope limitation, no feature creep, reasonable size.
    """
    score = 0.7  # Base score
    
    # Scope explicitly defined?
    if metadata.get("scope_defined", False):
        score += 0.15
    
    # Reasonable size?
    content_length = len(content)
    if content_length < 3000:
        score += 0.1
    elif content_length < 5000:
        score += 0.05
    elif content_length > 15000:
        score -= 0.1
    
    # No scope creep indicators?
    scope_creep_patterns = [
        "TODO", "FIXME", "XXX", "HACK", 
        "later", "eventually", "someday",
        "not implemented", "placeholder"
    ]
    creep_count = sum(1 for s in scope_creep_patterns if s.lower() in content.lower())
    score -= creep_count * 0.03
    
    # Single responsibility (rough heuristic: function count)?
    function_count = len(re.findall(r'\bdef \w+\(', content))
    class_count = len(re.findall(r'\bclass \w+', content))
    
    if function_count > 0 and function_count <= 10:
        score += 0.05
    elif function_count > 20:
        score -= 0.1
    
    return max(min(score, 1.0), 0.0)


def _analyze_evident(content: str, metadata: dict) -> float:
    """
    Score Evident component.
    
    Measures: Audit trail, documentation, clear reasoning.
    """
    score = 0.5  # Base score
    
    # Has explicit audit trail?
    if metadata.get("audit_trail", False):
        score += 0.25
    
    # Has docstrings?
    docstring_count = content.count('"""') // 2 + content.count("'''") // 2
    if docstring_count >= 3:
        score += 0.1
    elif docstring_count >= 1:
        score += 0.05
    
    # Has inline comments?
    comment_lines = len([l for l in content.split('\n') if l.strip().startswith('#')])
    if comment_lines >= 10:
        score += 0.1
    elif comment_lines >= 5:
        score += 0.05
    elif comment_lines > 0:
        score += 0.02
    
    # Has logging?
    if re.search(r'logger\.|logging\.|console\.log|print\(', content):
        score += 0.05
    
    # Has type annotations (improves readability)?
    type_hints = len(re.findall(r':\s*(str|int|float|bool|dict|list|Optional|List|Dict)', content))
    if type_hints >= 5:
        score += 0.1
    elif type_hints >= 2:
        score += 0.05
    
    return min(score, 1.0)


def _get_grade(score: float) -> str:
    """Convert score to letter grade."""
    if score >= 0.95:
        return "A+"
    elif score >= 0.90:
        return "A"
    elif score >= 0.85:
        return "B+"
    elif score >= 0.80:
        return "B"
    elif score >= 0.75:
        return "C+"
    elif score >= 0.70:
        return "C"
    elif score >= 0.60:
        return "D"
    else:
        return "F"


# ═══════════════════════════════════════════════════════════════════════════
# MAIN VALIDATION FUNCTION
# ═══════════════════════════════════════════════════════════════════════════

def validate_vibe(
    content: str,
    has_tests: bool = False,
    has_citations: bool = False,
    has_error_handling: bool = False,
    scope_defined: bool = False,
    audit_trail: bool = False,
    custom_scores: Optional[dict] = None
) -> VibeResult:
    """
    Calculate V.I.B.E. score for content.
    
    Args:
        content: Code or output to validate
        has_tests: Whether test coverage exists
        has_citations: Whether citations/links exist
        has_error_handling: Whether error handling is present
        scope_defined: Whether scope is clearly defined
        audit_trail: Whether audit trail exists
        custom_scores: Optional dict to override component scores
        
    Returns:
        VibeResult with complete assessment
        
    Example:
        >>> result = validate_vibe(
        ...     my_code,
        ...     has_tests=True,
        ...     has_error_handling=True,
        ...     scope_defined=True
        ... )
        >>> if result["passes_execution"]:
        ...     proceed_with_commit()
        ... else:
        ...     for improvement in result["improvements"]:
        ...         print(f"Fix: {improvement}")
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
    if custom_scores:
        v = custom_scores.get("verifiable", v)
        i = custom_scores.get("idempotent", i)
        b = custom_scores.get("bounded", b)
        e = custom_scores.get("evident", e)
    
    score = VibeScore(
        verifiable=round(v, 3),
        idempotent=round(i, 3),
        bounded=round(b, 3),
        evident=round(e, 3)
    )
    
    # Build improvement recommendations
    improvements = []
    if score.verifiable < 0.85:
        improvements.append("Add tests or citations to improve Verifiable score")
    if score.idempotent < 0.85:
        improvements.append("Add error handling and avoid non-determinism for Idempotent score")
    if score.bounded < 0.85:
        improvements.append("Define scope more clearly, remove TODOs for Bounded score")
    if score.evident < 0.85:
        improvements.append("Add documentation and logging for Evident score")
    
    # Determine recommendation
    if score.passes_execution:
        recommendation = "PROCEED"
    elif score.simple_average >= 0.75:
        recommendation = "REVIEW"
    else:
        recommendation = "HALT"
    
    logger.info(f"V.I.B.E. Score: {score.simple_average:.3f} ({_get_grade(score.simple_average)})")
    
    return VibeResult(
        score=round(score.simple_average, 3),
        breakdown=score.to_dict(),
        thresholds={
            "execution": EXECUTION_THRESHOLD,
            "governance": GOVERNANCE_THRESHOLD
        },
        passes_execution=score.passes_execution,
        passes_governance=score.passes_governance,
        recommendation=recommendation,
        improvements=improvements,
        metadata_used=metadata,
        grade=_get_grade(score.simple_average)
    )


# ═══════════════════════════════════════════════════════════════════════════
# QUICK CHECK FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

def quick_check(content: str) -> bool:
    """
    Quick pass/fail check without detailed analysis.
    
    Args:
        content: Code to check
        
    Returns:
        True if likely to pass, False otherwise
    """
    result = validate_vibe(content)
    return result["passes_execution"]


def get_minimum_requirements() -> dict:
    """Get minimum requirements for passing V.I.B.E."""
    return {
        "execution_threshold": EXECUTION_THRESHOLD,
        "governance_threshold": GOVERNANCE_THRESHOLD,
        "required_components": {
            "verifiable": "Tests OR citations",
            "idempotent": "Error handling, deterministic",
            "bounded": "Clear scope, reasonable size",
            "evident": "Documentation, audit trail"
        }
    }


# ═══════════════════════════════════════════════════════════════════════════
# CLI ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import sys
    import json
    
    if len(sys.argv) < 2:
        print("Usage: python vibe_validator.py <code_or_file>")
        print("       python vibe_validator.py --file path/to/code.py")
        sys.exit(1)
    
    if sys.argv[1] == "--file" and len(sys.argv) > 2:
        with open(sys.argv[2]) as f:
            content = f.read()
    else:
        content = sys.argv[1]
    
    result = validate_vibe(content)
    print(json.dumps(result, indent=2))
    
    # Exit with appropriate code
    sys.exit(0 if result["passes_execution"] else 1)
