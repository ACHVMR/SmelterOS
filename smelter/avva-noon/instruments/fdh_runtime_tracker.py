"""
FDH Runtime Tracker - NOON Governance Instrument #4

Tracks Foster-Develop-Hone cycles and calculates efficiency gains
vs legacy time estimates.

Purpose: Demonstrate 90%+ time compression via FDH methodology
Components: Cycle timing, efficiency calculation, progress reporting
"""

import time
from datetime import datetime, timedelta
from typing import Dict, Optional
from enum import Enum


class FDHPhase(Enum):
    """FDH Cycle phases"""
    FOSTER = "foster"      # 1-2 hours: Task decomposition
    DEVELOP = "develop"    # Continuous: Execution
    HONE = "hone"          # Parallel: Validation
    COMPLETE = "complete"


class FDHRuntimeTracker:
    """Track Foster-Develop-Hone runtime and efficiency"""
    
    TARGET_COMPRESSION = 0.90  # 90% time compression target
    
    def __init__(self, task_id: str, legacy_estimate_hours: Optional[float] = None):
        self.task_id = task_id
        self.legacy_estimate_hours = legacy_estimate_hours
        
        # Phase timing
        self.phases = {
            FDHPhase.FOSTER: {"start": None, "end": None, "duration": 0.0},
            FDHPhase.DEVELOP: {"start": None, "end": None, "duration": 0.0},
            FDHPhase.HONE: {"start": None, "end": None, "duration": 0.0},
        }
        
        self.current_phase = None
        self.task_start = None
        self.task_end = None
        self.total_runtime_hours = 0.0
        
        # Progress tracking
        self.develop_progress = 0.0  # 0.0 to 1.0
        self.hone_validations = []
        
    def start_task(self):
        """Initialize task tracking"""
        self.task_start = datetime.now()
        self.start_phase(FDHPhase.FOSTER)
    
    def start_phase(self, phase: FDHPhase):
        """Start a specific FDH phase"""
        if self.current_phase and self.phases[self.current_phase]["end"] is None:
            # End previous phase
            self.end_phase()
        
        self.current_phase = phase
        self.phases[phase]["start"] = datetime.now()
        print(f"[FDH] {phase.value.upper()} phase started at {self.phases[phase]['start'].strftime('%H:%M:%S')}")
    
    def end_phase(self):
        """End current phase"""
        if not self.current_phase:
            return
        
        phase = self.current_phase
        self.phases[phase]["end"] = datetime.now()
        
        duration = (self.phases[phase]["end"] - self.phases[phase]["start"]).total_seconds() / 3600
        self.phases[phase]["duration"] = duration
        
        print(f"[FDH] {phase.value.upper()} phase completed: {duration:.2f} hours")
    
    def update_develop_progress(self, progress: float):
        """Update Develop phase progress (0.0 to 1.0)"""
        self.develop_progress = max(0.0, min(1.0, progress))
        
        # Trigger Hone validation at 25% if not started
        if self.develop_progress >= 0.25 and self.phases[FDHPhase.HONE]["start"] is None:
            print(f"[FDH] 25% progress reached, starting parallel Hone validation")
            # Note: Hone runs in parallel, don't end Develop
            old_phase = self.current_phase
            self.current_phase = FDHPhase.HONE
            self.phases[FDHPhase.HONE]["start"] = datetime.now()
            self.current_phase = old_phase
    
    def log_hone_validation(self, vibe_score: float, passed: bool):
        """Log a Hone cycle validation"""
        self.hone_validations.append({
            "timestamp": datetime.now(),
            "progress": self.develop_progress,
            "vibe_score": vibe_score,
            "passed": passed
        })
    
    def complete_task(self):
        """Mark task as complete"""
        if self.current_phase:
            self.end_phase()
        
        self.task_end = datetime.now()
        self.total_runtime_hours = (self.task_end - self.task_start).total_seconds() / 3600
        self.current_phase = FDHPhase.COMPLETE
        
        print(f"[FDH] Task {self.task_id} completed: {self.total_runtime_hours:.2f} runtime_hours")
    
    def calculate_efficiency(self) -> Dict:
        """Calculate FDH efficiency metrics"""
        if not self.task_end:
            return {"error": "Task not completed yet"}
        
        # If no legacy estimate provided, use industry standard multiplier
        if self.legacy_estimate_hours is None:
            # Assume legacy is 5x FDH runtime (industry avg)
            self.legacy_estimate_hours = self.total_runtime_hours * 5
        
        time_saved = self.legacy_estimate_hours - self.total_runtime_hours
        compression_rate = (time_saved / self.legacy_estimate_hours) if self.legacy_estimate_hours > 0 else 0
        
        meets_target = compression_rate >= self.TARGET_COMPRESSION
        
        return {
            "fdh_runtime_hours": round(self.total_runtime_hours, 2),
            "legacy_estimate_hours": round(self.legacy_estimate_hours, 2),
            "time_saved_hours": round(time_saved, 2),
            "compression_rate": round(compression_rate, 3),
            "target_met": meets_target,
            "efficiency_percentage": round(compression_rate * 100, 1)
        }
    
    def get_phase_breakdown(self) -> Dict:
        """Get breakdown of time spent in each phase"""
        return {
            "foster": {
                "hours": round(self.phases[FDHPhase.FOSTER]["duration"], 2),
                "percentage": round(self.phases[FDHPhase.FOSTER]["duration"] / self.total_runtime_hours * 100, 1) if self.total_runtime_hours > 0 else 0
            },
            "develop": {
                "hours": round(self.phases[FDHPhase.DEVELOP]["duration"], 2),
                "percentage": round(self.phases[FDHPhase.DEVELOP]["duration"] / self.total_runtime_hours * 100, 1) if self.total_runtime_hours > 0 else 0
            },
            "hone": {
                "hours": round(self.phases[FDHPhase.HONE]["duration"], 2),
                "percentage": round(self.phases[FDHPhase.HONE]["duration"] / self.total_runtime_hours * 100, 1) if self.total_runtime_hours > 0 else 0
            },
        }
    
    def generate_progress_report(self) -> str:
        """Generate real-time progress report"""
        report = f"📊 FDH Progress Report - Task {self.task_id}\n"
        report += "=" * 60 + "\n\n"
        
        if not self.task_start:
            return report + "Task not started.\n"
        
        # Current phase
        elapsed = (datetime.now() - self.task_start).total_seconds() / 3600
        report += f"Current Phase: {self.current_phase.value.upper() if self.current_phase else 'N/A'}\n"
        report += f"Elapsed Time: {elapsed:.2f} runtime_hours\n"
        report += f"Develop Progress: {self.develop_progress * 100:.0f}%\n\n"
        
        # Phase breakdown
        report += "Phase Breakdown:\n"
        for phase, data in self.get_phase_breakdown().items():
            status = "✅" if data["hours"] > 0 else "⏳"
            report += f"  {status} {phase.capitalize()}: {data['hours']} hours ({data['percentage']}%)\n"
        
        report += "\n"
        
        # Hone validations
        if self.hone_validations:
            report += f"Hone Validations: {len(self.hone_validations)}\n"
            latest = self.hone_validations[-1]
            status = "✅ PASS" if latest["passed"] else "❌ FAIL"
            report += f"  Latest: V.I.B.E. {latest['vibe_score']:.2f} at {latest['progress']*100:.0f}% - {status}\n\n"
        
        # Efficiency projection
        if self.task_end:
            efficiency = self.calculate_efficiency()
            report += "Final Efficiency:\n"
            report += f"  FDH Runtime: {efficiency['fdh_runtime_hours']} hours\n"
            report += f"  Legacy Estimate: {efficiency['legacy_estimate_hours']} hours\n"
            report += f"  Compression: {efficiency['efficiency_percentage']}% {'✅' if efficiency['target_met'] else '⚠️'}\n"
        else:
            # Project based on progress
            if self.develop_progress > 0:
                projected_total = elapsed / self.develop_progress
                report += f"Projected Total: ~{projected_total:.2f} runtime_hours\n"
        
        return report
    
    def export_metrics(self) -> Dict:
        """Export metrics for logging/analysis"""
        return {
            "task_id": self.task_id,
            "status": self.current_phase.value if self.current_phase else "not_started",
            "runtime_hours": self.total_runtime_hours,
            "progress": self.develop_progress,
            "phase_breakdown": self.get_phase_breakdown(),
            "efficiency": self.calculate_efficiency() if self.task_end else None,
            "hone_validations": len(self.hone_validations),
            "legacy_estimate": self.legacy_estimate_hours
        }


# Tool interface for Agent Zero
def track_fdh_progress(task_id: str, legacy_hours: Optional[float] = None) -> str:
    """
    Agent Zero tool to track FDH runtime
    
    Usage:
    tracker = track_fdh_progress("TASK-001", legacy_hours=40)
    # Then update progress with:
    # tracker.update_develop_progress(0.5)
    """
    tracker = FDHRuntimeTracker(task_id, legacy_hours)
    tracker.start_task()
    return f"FDH tracker started for {task_id}. Legacy estimate: {legacy_hours} hours"


# Example usage
if __name__ == "__main__":
    print("🔥 FDH Runtime Tracker Demo\n")
    
    # Simulate a task
    tracker = FDHRuntimeTracker("DEMO-001", legacy_estimate_hours=40)
    tracker.start_task()
    
    # Simulate Foster phase (quick)
    time.sleep(0.1)
    tracker.start_phase(FDHPhase.DEVELOP)
    
    # Simulate Develop progress
    for progress in [0.25, 0.5, 0.75, 1.0]:
        time.sleep(0.05)
        tracker.update_develop_progress(progress)
        tracker.log_hone_validation(0.88 + progress * 0.05, True)
        print(f"\n[PROGRESS] {progress * 100:.0f}% complete")
    
    # Complete
    tracker.complete_task()
    
    # Generate final report
    print("\n" + tracker.generate_progress_report())
    print("\n📈 Efficiency Metrics:")
    print(tracker.calculate_efficiency())
