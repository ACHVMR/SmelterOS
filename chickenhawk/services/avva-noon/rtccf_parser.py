"""
RTCCF Parser — Role-Task-Context-Constraints-Format
================================================================
Task intake validation and parsing for AVVA NOON.

All tasks MUST be initialized with RTCCF format:
- Role: Who is the agent acting as?
- Task: What must be produced?
- Context: Repository, tech stack, existing decisions
- Constraints: Security tier, forbidden items, HALT triggers
- Format: Expected output (files, tests, docs)
"""

import re
from dataclasses import dataclass, field, asdict
from typing import Optional, List, TypedDict, Literal
import json
import logging

# Configure logging
logger = logging.getLogger("avva_noon.rtccf_parser")

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

REQUIRED_FIELDS = ["role", "task", "context", "constraints", "format"]

RTCCF_TEMPLATE = """## RTCCF Task Envelope

**Role:** [Who should the agent act as? e.g., "Backend Developer", "Security Auditor"]
**Task:** [What must be produced? Be specific about deliverables]
**Context:** [Repository, tech stack, constraints, existing decisions, dependencies]
**Constraints:** [Security tier, forbidden items, required approvals, HALT triggers]
**Format:** [Expected output format: files, endpoints, tests, documentation]
"""

RTCCF_EXAMPLE = """## RTCCF Task Envelope

**Role:** Backend Developer for SmelterOS authentication system
**Task:** Implement JWT-based authentication with refresh token rotation
**Context:** 
- Repository: chickenhawk/services/auth
- Stack: Python 3.11, FastAPI, PostgreSQL
- Existing: User model defined, bcrypt for passwords
- Dependencies: PyJWT, python-jose
**Constraints:**
- Security Tier: Mission-Critical
- HALT on: Any plaintext password storage, any auth bypass
- Require approval for: Token expiry changes, new auth endpoints
**Format:**
- Files: auth/jwt_handler.py, auth/refresh_tokens.py
- Tests: tests/test_jwt.py, tests/test_refresh.py
- Docs: Update API.md with new endpoints
"""


# ═══════════════════════════════════════════════════════════════════════════
# DATA TYPES
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class RTCCFTask:
    """Parsed RTCCF task."""
    role: str
    task: str
    context: str
    constraints: str
    format: str
    
    raw_input: str = ""
    valid: bool = True
    warnings: List[str] = field(default_factory=list)
    
    def to_dict(self) -> dict:
        return {
            "role": self.role,
            "task": self.task,
            "context": self.context,
            "constraints": self.constraints,
            "format": self.format,
            "valid": self.valid,
            "warnings": self.warnings
        }
    
    def get_summary(self) -> str:
        """Get one-line summary."""
        return f"[{self.role[:30]}] {self.task[:50]}..."


class ParseResult(TypedDict):
    """Result of RTCCF parsing."""
    valid: bool
    fields: dict
    missing: List[str]
    warnings: List[str]
    task: Optional[dict]


class ValidationResult(TypedDict):
    """Result of RTCCF validation."""
    status: Literal["VALID", "INCOMPLETE", "INVALID"]
    missing_fields: List[str]
    provided_fields: List[str]
    action: str
    template: Optional[str]
    parsed: Optional[dict]


# ═══════════════════════════════════════════════════════════════════════════
# PARSING FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

def parse_rtccf(text: str) -> ParseResult:
    """
    Parse RTCCF formatted input.
    
    Supports multiple formats:
    - Markdown with **Field:** value
    - YAML-like with - Field: value
    - Plain text with Field: value
    
    Args:
        text: Input text to parse
        
    Returns:
        ParseResult with extracted fields
    """
    fields = {}
    missing = []
    warnings = []
    
    # Pattern variations to try
    patterns = {
        "role": [
            r'\*\*Role:\*\*\s*(.+?)(?=\n\*\*|\n\n|$)',
            r'[-•]\s*Role:\s*(.+?)(?=\n[-•]|\n\n|$)',
            r'Role:\s*(.+?)(?=\n|$)',
        ],
        "task": [
            r'\*\*Task:\*\*\s*(.+?)(?=\n\*\*|\n\n|$)',
            r'[-•]\s*Task:\s*(.+?)(?=\n[-•]|\n\n|$)',
            r'Task:\s*(.+?)(?=\n|$)',
        ],
        "context": [
            r'\*\*Context:\*\*\s*(.+?)(?=\n\*\*|\n\n|$)',
            r'[-•]\s*Context:\s*(.+?)(?=\n[-•]|\n\n|$)',
            r'Context:\s*(.+?)(?=\n|$)',
        ],
        "constraints": [
            r'\*\*Constraints:\*\*\s*(.+?)(?=\n\*\*|\n\n|$)',
            r'[-•]\s*Constraints:\s*(.+?)(?=\n[-•]|\n\n|$)',
            r'Constraints:\s*(.+?)(?=\n|$)',
        ],
        "format": [
            r'\*\*Format:\*\*\s*(.+?)(?=\n\*\*|\n\n|$)',
            r'[-•]\s*Format:\s*(.+?)(?=\n[-•]|\n\n|$)',
            r'Format:\s*(.+?)(?=\n|$)',
        ],
    }
    
    for field_name, field_patterns in patterns.items():
        matched = False
        for pattern in field_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                value = match.group(1).strip()
                if value:
                    fields[field_name] = value
                    matched = True
                    break
        
        if not matched:
            missing.append(field_name)
    
    # Validate field quality
    for field_name, value in fields.items():
        if len(value) < 10:
            warnings.append(f"'{field_name}' seems too brief (< 10 chars)")
        if value.startswith('[') and value.endswith(']'):
            warnings.append(f"'{field_name}' appears to be a placeholder")
    
    # Build task object if all fields present
    task = None
    if len(missing) == 0:
        task = RTCCFTask(
            role=fields.get("role", ""),
            task=fields.get("task", ""),
            context=fields.get("context", ""),
            constraints=fields.get("constraints", ""),
            format=fields.get("format", ""),
            raw_input=text,
            valid=True,
            warnings=warnings
        )
    
    valid = len(missing) == 0
    
    logger.info(f"RTCCF parse: valid={valid}, missing={missing}")
    
    return ParseResult(
        valid=valid,
        fields=fields,
        missing=missing,
        warnings=warnings,
        task=task.to_dict() if task else None
    )


def validate_rtccf(text: str) -> ValidationResult:
    """
    Validate RTCCF format and return actionable result.
    
    If incomplete, provides template for missing fields.
    
    Args:
        text: Input to validate
        
    Returns:
        ValidationResult with status and guidance
    """
    parsed = parse_rtccf(text)
    
    if parsed["valid"]:
        return ValidationResult(
            status="VALID",
            missing_fields=[],
            provided_fields=list(parsed["fields"].keys()),
            action="PROCEED with task execution",
            template=None,
            parsed=parsed["task"]
        )
    
    if len(parsed["fields"]) == 0:
        # No fields found at all
        return ValidationResult(
            status="INVALID",
            missing_fields=REQUIRED_FIELDS,
            provided_fields=[],
            action="REQUEST complete RTCCF format",
            template=RTCCF_TEMPLATE,
            parsed=None
        )
    
    # Some fields found, some missing
    template = _generate_partial_template(parsed["fields"])
    
    return ValidationResult(
        status="INCOMPLETE",
        missing_fields=parsed["missing"],
        provided_fields=list(parsed["fields"].keys()),
        action=f"REQUEST missing fields: {', '.join(parsed['missing'])}",
        template=template,
        parsed=None
    )


def _generate_partial_template(existing_fields: dict) -> str:
    """Generate template with existing values filled in."""
    template_parts = ["## RTCCF Task Envelope\n"]
    
    for field in REQUIRED_FIELDS:
        if field in existing_fields:
            template_parts.append(f"**{field.title()}:** {existing_fields[field]}")
        else:
            template_parts.append(f"**{field.title()}:** [PLEASE PROVIDE]")
    
    return "\n".join(template_parts)


# ═══════════════════════════════════════════════════════════════════════════
# UTILITY FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

def create_rtccf(
    role: str,
    task: str,
    context: str,
    constraints: str,
    format: str
) -> RTCCFTask:
    """
    Create an RTCCF task object directly.
    
    Args:
        role: Agent role
        task: Task description
        context: Context information
        constraints: Constraints and HALT triggers
        format: Expected output format
        
    Returns:
        RTCCFTask object
    """
    return RTCCFTask(
        role=role,
        task=task,
        context=context,
        constraints=constraints,
        format=format,
        valid=True,
        warnings=[]
    )


def rtccf_to_markdown(task: RTCCFTask) -> str:
    """Convert RTCCFTask to markdown format."""
    return f"""## RTCCF Task Envelope

**Role:** {task.role}
**Task:** {task.task}
**Context:** {task.context}
**Constraints:** {task.constraints}
**Format:** {task.format}
"""


def extract_security_tier(constraints: str) -> Optional[str]:
    """Extract security tier from constraints."""
    tiers = ["foundational", "enhanced", "mission-critical", "mission critical"]
    constraints_lower = constraints.lower()
    
    for tier in tiers:
        if tier in constraints_lower:
            return tier.replace(" ", "-").title()
    
    return None


def extract_halt_triggers(constraints: str) -> List[str]:
    """Extract HALT triggers from constraints."""
    triggers = []
    
    # Look for "HALT on:" or "HALT:" patterns
    match = re.search(r'HALT\s*(?:on|triggers?)?\s*:\s*(.+?)(?=\n|$)', 
                     constraints, re.IGNORECASE)
    if match:
        trigger_text = match.group(1)
        # Split on commas or "any"
        parts = re.split(r',|;|\bany\b', trigger_text)
        triggers = [p.strip() for p in parts if p.strip()]
    
    return triggers


def get_template() -> str:
    """Get empty RTCCF template."""
    return RTCCF_TEMPLATE


def get_example() -> str:
    """Get example RTCCF."""
    return RTCCF_EXAMPLE


# ═══════════════════════════════════════════════════════════════════════════
# CLI ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python rtccf_parser.py <text_or_file>")
        print("       python rtccf_parser.py --template")
        print("       python rtccf_parser.py --example")
        print("       python rtccf_parser.py --validate 'text'")
        sys.exit(1)
    
    if sys.argv[1] == "--template":
        print(RTCCF_TEMPLATE)
    elif sys.argv[1] == "--example":
        print(RTCCF_EXAMPLE)
    elif sys.argv[1] == "--validate":
        text = sys.argv[2] if len(sys.argv) > 2 else ""
        result = validate_rtccf(text)
        print(json.dumps(result, indent=2))
    elif sys.argv[1] == "--file":
        with open(sys.argv[2]) as f:
            text = f.read()
        result = parse_rtccf(text)
        print(json.dumps(result, indent=2))
    else:
        result = parse_rtccf(sys.argv[1])
        print(json.dumps(result, indent=2))
