"""
FDH Runtime Tracker — Foster-Develop-Hone Cycle Management
================================================================
Tracks runtime hours and calculates efficiency vs legacy estimates.

FDH replaces legacy calendar-based estimation with runtime_hours:
- Foster: Context intake, task decomposition (1-2 hours typical)
- Develop: Execution, building, testing (variable)
- Hone: Parallel validation (runs concurrently, doesn't add time)

Target: 90%+ compression vs legacy estimates.
"""

import os
from datetime import datetime, timezone
from dataclasses import dataclass, field, asdict
from typing import Optional, List, TypedDict, Literal
from enum import Enum
import json
import logging

# Configure logging
logger = logging.getLogger("avva_noon.fdh_tracker")

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

COMPRESSION_TARGET = float(os.getenv("AVVA_NOON_COMPRESSION_TARGET", "0.90"))
FOSTER_MAX_HOURS = float(os.getenv("AVVA_NOON_FOSTER_MAX", "2.0"))
HONE_START_THRESHOLD = float(os.getenv("AVVA_NOON_HONE_START", "0.25"))


# ═══════════════════════════════════════════════════════════════════════════
# DATA TYPES
# ═══════════════════════════════════════════════════════════════════════════

class CyclePhase(str, Enum):
    """FDH cycle phases."""
    FOSTER = "FOSTER"
    DEVELOP = "DEVELOP"
    HONE = "HONE"
    COMPLETE = "COMPLETE"


@dataclass
class CycleMetrics:
    """Metrics for a single cycle."""
    phase: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    duration_hours: float = 0.0
    notes: str = ""


@dataclass
class FDHMetrics:
    """Complete FDH metrics for a task."""
    task_id: str
    created_at: str
    
    legacy_estimate_hours: Optional[float] = None
    
    foster: CycleMetrics = field(default_factory=lambda: CycleMetrics(phase="FOSTER"))
    develop: CycleMetrics = field(default_factory=lambda: CycleMetrics(phase="DEVELOP"))
    hone: CycleMetrics = field(default_factory=lambda: CycleMetrics(phase="HONE"))
    
    current_phase: str = "FOSTER"
    status: str = "ACTIVE"
    
    @property
    def total_runtime_hours(self) -> float:
        """Total runtime (Foster + Develop, Hone is parallel)."""
        return self.foster.duration_hours + self.develop.duration_hours
    
    @property
    def compression_rate(self) -> Optional[float]:
        """Calculate compression rate vs legacy estimate."""
        if self.legacy_estimate_hours and self.legacy_estimate_hours > 0:
            return (self.legacy_estimate_hours - self.total_runtime_hours) / self.legacy_estimate_hours
        return None
    
    @property
    def meets_target(self) -> Optional[bool]:
        """Check if compression meets target."""
        rate = self.compression_rate
        return rate >= COMPRESSION_TARGET if rate is not None else None
    
    def to_dict(self) -> dict:
        return {
            "task_id": self.task_id,
            "created_at": self.created_at,
            "legacy_estimate_hours": self.legacy_estimate_hours,
            "foster": asdict(self.foster),
            "develop": asdict(self.develop),
            "hone": asdict(self.hone),
            "current_phase": self.current_phase,
            "status": self.status,
            "total_runtime_hours": round(self.total_runtime_hours, 2),
            "compression_rate": round(self.compression_rate, 4) if self.compression_rate else None,
            "compression_percentage": f"{self.compression_rate * 100:.1f}%" if self.compression_rate else None,
            "meets_target": self.meets_target
        }


# ═══════════════════════════════════════════════════════════════════════════
# FDH TRACKER CLASS
# ═══════════════════════════════════════════════════════════════════════════

class FDHTracker:
    """
    Track FDH runtime for a task.
    
    Example:
        >>> tracker = FDHTracker("TASK-001", legacy_estimate_hours=40.0)
        >>> tracker.start_foster()
        >>> # ... do foster work ...
        >>> tracker.end_foster()
        >>> tracker.start_develop()
        >>> tracker.start_hone()  # Parallel
        >>> # ... do develop + hone work ...
        >>> tracker.end_develop()
        >>> tracker.end_hone()
        >>> print(tracker.get_summary())
    """
    
    def __init__(
        self,
        task_id: str,
        legacy_estimate_hours: Optional[float] = None,
        description: str = ""
    ):
        """
        Initialize FDH tracker.
        
        Args:
            task_id: Unique task identifier
            legacy_estimate_hours: Original legacy estimate (optional)
            description: Task description
        """
        self.metrics = FDHMetrics(
            task_id=task_id,
            created_at=datetime.now(timezone.utc).isoformat(),
            legacy_estimate_hours=legacy_estimate_hours
        )
        self.description = description
        self._phase_starts = {}
        
        logger.info(f"FDH Tracker initialized for {task_id}")
        if legacy_estimate_hours:
            logger.info(f"  Legacy estimate: {legacy_estimate_hours} hours")
    
    # ═══ FOSTER CYCLE ═══
    
    def start_foster(self) -> dict:
        """Start Foster cycle (context intake, decomposition)."""
        now = datetime.now(timezone.utc)
        self.metrics.foster.start_time = now.isoformat()
        self.metrics.current_phase = CyclePhase.FOSTER.value
        self._phase_starts["foster"] = now
        
        logger.info(f"[{self.metrics.task_id}] Foster cycle started")
        
        return {
            "phase": "FOSTER",
            "action": "started",
            "timestamp": now.isoformat(),
            "max_hours": FOSTER_MAX_HOURS
        }
    
    def end_foster(self, notes: str = "") -> dict:
        """End Foster cycle."""
        now = datetime.now(timezone.utc)
        self.metrics.foster.end_time = now.isoformat()
        self.metrics.foster.notes = notes
        
        if "foster" in self._phase_starts:
            delta = now - self._phase_starts["foster"]
            self.metrics.foster.duration_hours = delta.total_seconds() / 3600
        
        logger.info(f"[{self.metrics.task_id}] Foster cycle ended: {self.metrics.foster.duration_hours:.2f}h")
        
        return {
            "phase": "FOSTER",
            "action": "ended",
            "duration_hours": round(self.metrics.foster.duration_hours, 2)
        }
    
    # ═══ DEVELOP CYCLE ═══
    
    def start_develop(self) -> dict:
        """Start Develop cycle (execution, building)."""
        now = datetime.now(timezone.utc)
        self.metrics.develop.start_time = now.isoformat()
        self.metrics.current_phase = CyclePhase.DEVELOP.value
        self._phase_starts["develop"] = now
        
        logger.info(f"[{self.metrics.task_id}] Develop cycle started")
        
        return {
            "phase": "DEVELOP",
            "action": "started",
            "timestamp": now.isoformat()
        }
    
    def end_develop(self, notes: str = "") -> dict:
        """End Develop cycle."""
        now = datetime.now(timezone.utc)
        self.metrics.develop.end_time = now.isoformat()
        self.metrics.develop.notes = notes
        
        if "develop" in self._phase_starts:
            delta = now - self._phase_starts["develop"]
            self.metrics.develop.duration_hours = delta.total_seconds() / 3600
        
        logger.info(f"[{self.metrics.task_id}] Develop cycle ended: {self.metrics.develop.duration_hours:.2f}h")
        
        return {
            "phase": "DEVELOP",
            "action": "ended",
            "duration_hours": round(self.metrics.develop.duration_hours, 2)
        }
    
    # ═══ HONE CYCLE (PARALLEL) ═══
    
    def start_hone(self) -> dict:
        """Start Hone cycle (parallel validation)."""
        now = datetime.now(timezone.utc)
        self.metrics.hone.start_time = now.isoformat()
        self._phase_starts["hone"] = now
        
        logger.info(f"[{self.metrics.task_id}] Hone cycle started (parallel)")
        
        return {
            "phase": "HONE",
            "action": "started",
            "parallel": True,
            "timestamp": now.isoformat()
        }
    
    def end_hone(self, notes: str = "") -> dict:
        """End Hone cycle."""
        now = datetime.now(timezone.utc)
        self.metrics.hone.end_time = now.isoformat()
        self.metrics.hone.notes = notes
        
        if "hone" in self._phase_starts:
            delta = now - self._phase_starts["hone"]
            self.metrics.hone.duration_hours = delta.total_seconds() / 3600
        
        logger.info(f"[{self.metrics.task_id}] Hone cycle ended: {self.metrics.hone.duration_hours:.2f}h (parallel, not added)")
        
        return {
            "phase": "HONE",
            "action": "ended",
            "duration_hours": round(self.metrics.hone.duration_hours, 2),
            "note": "Parallel cycle - not added to total runtime"
        }
    
    # ═══ COMPLETION ═══
    
    def complete(self) -> dict:
        """Mark task as complete and calculate final metrics."""
        self.metrics.status = "COMPLETE"
        self.metrics.current_phase = CyclePhase.COMPLETE.value
        
        result = self.get_summary()
        
        logger.info(f"[{self.metrics.task_id}] Task complete: {self.metrics.total_runtime_hours:.2f}h total")
        if self.metrics.compression_rate:
            logger.info(f"  Compression: {self.metrics.compression_rate * 100:.1f}%")
        
        return result
    
    # ═══ QUERIES ═══
    
    def get_status(self) -> dict:
        """Get current status."""
        return {
            "task_id": self.metrics.task_id,
            "current_phase": self.metrics.current_phase,
            "status": self.metrics.status,
            "total_runtime_hours": round(self.metrics.total_runtime_hours, 2),
            "phases_complete": {
                "foster": self.metrics.foster.end_time is not None,
                "develop": self.metrics.develop.end_time is not None,
                "hone": self.metrics.hone.end_time is not None
            }
        }
    
    def get_summary(self) -> dict:
        """Get complete metrics summary."""
        return self.metrics.to_dict()
    
    def get_efficiency_report(self) -> str:
        """Get human-readable efficiency report."""
        m = self.metrics
        lines = [
            f"═══ FDH EFFICIENCY REPORT: {m.task_id} ═══",
            f"",
            f"Foster:  {m.foster.duration_hours:.2f}h",
            f"Develop: {m.develop.duration_hours:.2f}h",
            f"Hone:    {m.hone.duration_hours:.2f}h (parallel)",
            f"",
            f"Total Runtime: {m.total_runtime_hours:.2f}h",
        ]
        
        if m.legacy_estimate_hours:
            lines.extend([
                f"Legacy Estimate: {m.legacy_estimate_hours:.2f}h",
                f"Compression: {m.compression_rate * 100:.1f}%",
                f"Target (90%): {'✓ MET' if m.meets_target else '✗ NOT MET'}"
            ])
        
        return "\n".join(lines)


# ═══════════════════════════════════════════════════════════════════════════
# UTILITY FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

def estimate_fdh_from_legacy(legacy_hours: float, complexity: str = "medium") -> dict:
    """
    Estimate FDH runtime from legacy hours.
    
    Args:
        legacy_hours: Legacy calendar-based estimate
        complexity: "low", "medium", or "high"
        
    Returns:
        Estimated FDH breakdown
    """
    # Complexity multipliers
    multipliers = {
        "low": 0.05,
        "medium": 0.075,
        "high": 0.10
    }
    multiplier = multipliers.get(complexity, 0.075)
    
    estimated_fdh = legacy_hours * multiplier
    
    return {
        "legacy_hours": legacy_hours,
        "complexity": complexity,
        "estimated_fdh_hours": round(estimated_fdh, 1),
        "estimated_foster": round(min(estimated_fdh * 0.2, 2.0), 1),
        "estimated_develop": round(estimated_fdh * 0.8, 1),
        "compression_rate": round(1 - multiplier, 2),
        "compression_percentage": f"{(1 - multiplier) * 100:.0f}%"
    }


def convert_legacy_to_fdh(estimate: str) -> dict:
    """
    Convert legacy time language to FDH runtime_hours.
    
    Args:
        estimate: Legacy estimate like "2 weeks" or "1 sprint"
        
    Returns:
        FDH conversion
    """
    estimate_lower = estimate.lower().strip()
    
    # Conversion table (legacy → typical legacy hours → FDH hours)
    conversions = {
        "1 day": (8, 0.5),
        "2 days": (16, 1.0),
        "3 days": (24, 1.5),
        "1 week": (40, 3.0),
        "2 weeks": (80, 6.0),
        "1 sprint": (80, 6.0),
        "2 sprints": (160, 12.0),
        "1 month": (160, 12.0),
        "1 quarter": (480, 30.0),
    }
    
    if estimate_lower in conversions:
        legacy_hours, fdh_hours = conversions[estimate_lower]
        return {
            "input": estimate,
            "legacy_hours": legacy_hours,
            "fdh_hours": fdh_hours,
            "compression_rate": round((legacy_hours - fdh_hours) / legacy_hours, 2)
        }
    
    return {
        "input": estimate,
        "error": "Unknown format. Use: '2 weeks', '1 sprint', '1 month', etc.",
        "legacy_hours": None,
        "fdh_hours": None
    }


# ═══════════════════════════════════════════════════════════════════════════
# CLI ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python fdh_tracker.py <task_id> [legacy_hours]")
        print("       python fdh_tracker.py --convert '2 weeks'")
        print("       python fdh_tracker.py --estimate 80 medium")
        sys.exit(1)
    
    if sys.argv[1] == "--convert":
        result = convert_legacy_to_fdh(sys.argv[2])
        print(json.dumps(result, indent=2))
    elif sys.argv[1] == "--estimate":
        hours = float(sys.argv[2])
        complexity = sys.argv[3] if len(sys.argv) > 3 else "medium"
        result = estimate_fdh_from_legacy(hours, complexity)
        print(json.dumps(result, indent=2))
    else:
        task_id = sys.argv[1]
        legacy = float(sys.argv[2]) if len(sys.argv) > 2 else None
        
        tracker = FDHTracker(task_id, legacy_estimate_hours=legacy)
        print(json.dumps(tracker.get_summary(), indent=2))
