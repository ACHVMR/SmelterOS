"""
Audit Report Generator — NOON validation artifact for HITL review
================================================================
Produces end-of-task summary for Master Smeltwarden approval.

Generates comprehensive audit reports that summarize:
- V.I.B.E. validation results
- Charter/Ledger integrity
- FDH efficiency metrics
- HITL recommendations
"""

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from dataclasses import dataclass, field, asdict
from typing import Optional, List, TypedDict, Literal
import logging
import uuid

# Configure logging
logger = logging.getLogger("avva_noon.audit_report")

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

REPORTS_PATH = Path(os.getenv("AVVA_NOON_REPORTS_PATH", "reports/"))
VIBE_THRESHOLD = float(os.getenv("AVVA_NOON_VIBE_THRESHOLD", "0.85"))
COMPRESSION_TARGET = float(os.getenv("AVVA_NOON_COMPRESSION_TARGET", "0.90"))


# ═══════════════════════════════════════════════════════════════════════════
# DATA TYPES
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class Recommendation:
    """HITL recommendation."""
    decision: Literal["APPROVE", "APPROVE_WITH_NOTES", "REVIEW", "REJECT"]
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    reason: str
    action: str
    blockers: List[str] = field(default_factory=list)
    
    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class AuditReport:
    """Complete audit report."""
    report_id: str
    generated_at: str
    framework: str
    
    task_id: str
    task_description: str
    
    vibe_score: float
    vibe_status: str
    halt_incidents: int
    forbidden_violations: int
    charter_integrity: str
    
    charter_entries: int
    ledger_entries: int
    
    runtime_hours: float
    legacy_estimate_hours: Optional[float]
    compression_rate: Optional[float]
    compression_percentage: Optional[str]
    meets_compression_target: Optional[bool]
    
    files_modified: List[str]
    tests_passed: Optional[int]
    tests_failed: Optional[int]
    
    recommendation: Recommendation
    hitl_required: bool
    
    notes: str
    
    def to_dict(self) -> dict:
        data = asdict(self)
        data["recommendation"] = self.recommendation.to_dict()
        return data


class AuditReportResult(TypedDict):
    """Result type for generate_audit_report."""
    report: dict
    saved: dict
    summary: str


# ═══════════════════════════════════════════════════════════════════════════
# RECOMMENDATION LOGIC
# ═══════════════════════════════════════════════════════════════════════════

def _determine_recommendation(
    vibe_score: float,
    halt_incidents: int,
    forbidden_violations: int,
    tests_failed: int
) -> Recommendation:
    """Determine HITL recommendation based on metrics."""
    
    # Critical: Charter integrity compromised
    if forbidden_violations > 0:
        return Recommendation(
            decision="REJECT",
            severity="CRITICAL",
            reason="Charter integrity compromised - forbidden values detected",
            action="Review and remediate all violations before approval",
            blockers=[f"{forbidden_violations} forbidden value violation(s)"]
        )
    
    # Critical: Tests failing
    if tests_failed and tests_failed > 0:
        return Recommendation(
            decision="REJECT",
            severity="HIGH",
            reason=f"Test failures detected ({tests_failed} failed)",
            action="Fix failing tests before approval",
            blockers=[f"{tests_failed} test(s) failing"]
        )
    
    # High: V.I.B.E. below threshold
    if vibe_score < VIBE_THRESHOLD:
        return Recommendation(
            decision="REJECT",
            severity="HIGH",
            reason=f"V.I.B.E. score below threshold ({vibe_score:.3f} < {VIBE_THRESHOLD})",
            action="Improve code quality to meet V.I.B.E. threshold",
            blockers=["V.I.B.E. below threshold"]
        )
    
    # Medium: High HALT count
    if halt_incidents > 3:
        return Recommendation(
            decision="REVIEW",
            severity="MEDIUM",
            reason=f"High HALT incident count ({halt_incidents})",
            action="Detailed review of HALT causes required",
            blockers=[]
        )
    
    # Excellent: High V.I.B.E.
    if vibe_score >= 0.95:
        return Recommendation(
            decision="APPROVE",
            severity="LOW",
            reason="Excellent V.I.B.E. score, no violations, tests passing",
            action="Ready for production deployment",
            blockers=[]
        )
    
    # Good: Acceptable V.I.B.E.
    return Recommendation(
        decision="APPROVE_WITH_NOTES",
        severity="LOW",
        reason=f"Acceptable V.I.B.E. score ({vibe_score:.3f})",
        action="Approved - consider improvements in future iterations",
        blockers=[]
    )


# ═══════════════════════════════════════════════════════════════════════════
# MAIN FUNCTION
# ═══════════════════════════════════════════════════════════════════════════

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
    notes: str = "",
    save_report: bool = True
) -> AuditReportResult:
    """
    Generate comprehensive audit report for HITL review.
    
    Args:
        task_id: Unique task identifier
        task_description: Human-readable task description
        vibe_score: Final V.I.B.E. score (0.0 - 1.0)
        charter_entries: Number of Charter log entries
        ledger_entries: Number of Ledger log entries
        halt_incidents: Number of HALT triggers during task
        forbidden_violations: Number of forbidden value violations
        runtime_hours: Actual FDH runtime hours
        legacy_estimate_hours: Original legacy estimate in hours
        files_modified: List of files changed
        tests_passed: Number of passing tests
        tests_failed: Number of failing tests
        notes: Additional notes for reviewers
        save_report: Whether to save report to disk
        
    Returns:
        AuditReportResult with report data and save status
        
    Example:
        >>> report = generate_audit_report(
        ...     task_id="TASK-001",
        ...     task_description="Implement user authentication",
        ...     vibe_score=0.92,
        ...     runtime_hours=3.5,
        ...     legacy_estimate_hours=40.0,
        ...     files_modified=["auth.py", "tests/test_auth.py"]
        ... )
        >>> if report["report"]["recommendation"]["decision"] == "APPROVE":
        ...     deploy_to_production()
    """
    timestamp = datetime.now(timezone.utc)
    report_id = f"NOON-{task_id}-{timestamp.strftime('%Y%m%d%H%M%S')}"
    
    # Calculate compression metrics
    compression_rate = None
    compression_percentage = None
    meets_target = None
    
    if legacy_estimate_hours and legacy_estimate_hours > 0:
        compression_rate = (legacy_estimate_hours - runtime_hours) / legacy_estimate_hours
        compression_percentage = f"{compression_rate * 100:.1f}%"
        meets_target = compression_rate >= COMPRESSION_TARGET
    
    # Determine recommendation
    recommendation = _determine_recommendation(
        vibe_score=vibe_score,
        halt_incidents=halt_incidents,
        forbidden_violations=forbidden_violations,
        tests_failed=tests_failed or 0
    )
    
    # Build report
    report = AuditReport(
        report_id=report_id,
        generated_at=timestamp.isoformat(),
        framework="AVVA NOON × SmelterOS",
        
        task_id=task_id,
        task_description=task_description,
        
        vibe_score=round(vibe_score, 3),
        vibe_status="PASS" if vibe_score >= VIBE_THRESHOLD else "FAIL",
        halt_incidents=halt_incidents,
        forbidden_violations=forbidden_violations,
        charter_integrity="CLEAN" if forbidden_violations == 0 else "COMPROMISED",
        
        charter_entries=charter_entries,
        ledger_entries=ledger_entries,
        
        runtime_hours=round(runtime_hours, 2),
        legacy_estimate_hours=legacy_estimate_hours,
        compression_rate=round(compression_rate, 4) if compression_rate else None,
        compression_percentage=compression_percentage,
        meets_compression_target=meets_target,
        
        files_modified=files_modified or [],
        tests_passed=tests_passed,
        tests_failed=tests_failed,
        
        recommendation=recommendation,
        hitl_required=recommendation.decision != "APPROVE",
        
        notes=notes
    )
    
    # Save to disk
    save_result = {"success": False, "filepath": None}
    if save_report:
        save_result = _save_report(report)
    
    # Build summary string
    summary = _generate_summary(report)
    
    logger.info(f"Generated audit report: {report_id} → {recommendation.decision}")
    
    return AuditReportResult(
        report=report.to_dict(),
        saved=save_result,
        summary=summary
    )


def _save_report(report: AuditReport) -> dict:
    """Save report to filesystem."""
    try:
        REPORTS_PATH.mkdir(parents=True, exist_ok=True)
        filepath = REPORTS_PATH / f"{report.report_id}.json"
        
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(report.to_dict(), f, indent=2)
        
        return {"success": True, "filepath": str(filepath)}
    except Exception as e:
        logger.error(f"Failed to save report: {e}")
        return {"success": False, "error": str(e)}


def _generate_summary(report: AuditReport) -> str:
    """Generate human-readable summary."""
    lines = [
        f"═══ NOON AUDIT REPORT: {report.report_id} ═══",
        f"",
        f"Task: {report.task_description}",
        f"V.I.B.E.: {report.vibe_score:.3f} ({report.vibe_status})",
        f"Charter Integrity: {report.charter_integrity}",
        f"",
    ]
    
    if report.compression_percentage:
        lines.append(f"Efficiency: {report.compression_percentage} compression")
        lines.append(f"Runtime: {report.runtime_hours}h (vs {report.legacy_estimate_hours}h legacy)")
        lines.append("")
    
    lines.extend([
        f"RECOMMENDATION: {report.recommendation.decision}",
        f"Reason: {report.recommendation.reason}",
        f"Action: {report.recommendation.action}",
    ])
    
    if report.recommendation.blockers:
        lines.append(f"Blockers: {', '.join(report.recommendation.blockers)}")
    
    return "\n".join(lines)


# ═══════════════════════════════════════════════════════════════════════════
# UTILITY FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

def load_report(report_id: str) -> Optional[dict]:
    """Load a saved report by ID."""
    filepath = REPORTS_PATH / f"{report_id}.json"
    if filepath.exists():
        with open(filepath) as f:
            return json.load(f)
    return None


def list_reports(limit: int = 20) -> List[dict]:
    """List recent reports."""
    if not REPORTS_PATH.exists():
        return []
    
    reports = []
    for filepath in sorted(REPORTS_PATH.glob("NOON-*.json"), reverse=True)[:limit]:
        with open(filepath) as f:
            data = json.load(f)
            reports.append({
                "report_id": data["report_id"],
                "task_id": data["task_id"],
                "vibe_score": data["vibe_score"],
                "decision": data["recommendation"]["decision"],
                "generated_at": data["generated_at"]
            })
    
    return reports


# ═══════════════════════════════════════════════════════════════════════════
# CLI ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 4:
        print("Usage: python audit_report.py <task_id> <description> <vibe_score>")
        print("       python audit_report.py --list")
        sys.exit(1)
    
    if sys.argv[1] == "--list":
        reports = list_reports()
        for r in reports:
            print(f"{r['report_id']}: {r['decision']} (V.I.B.E. {r['vibe_score']})")
        sys.exit(0)
    
    result = generate_audit_report(
        task_id=sys.argv[1],
        task_description=sys.argv[2],
        vibe_score=float(sys.argv[3])
    )
    
    print(result["summary"])
    print(f"\nSaved: {result['saved']['filepath']}")
