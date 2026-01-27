"""
Audit Report Generator - NOON Governance Instrument #3

Produces final validation reports for Master Smeltwarden (HITL review)

Purpose: Aggregate all NOON validations and provide actionable insights
Components: Charter-Ledger comparison, V.I.B.E. trends, HALT history
"""

import json
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict


@dataclass
class TaskExecution:
    """Record of a single task execution"""
    task_id: str
    rtccf: Dict  # Role, Task, Context, Constraints, Format
    start_time: datetime
    end_time: Optional[datetime]
    runtime_hours: float
    foster_hours: float
    develop_hours: float
    hone_hours: float
    vibe_scores: List[float]
    halts: List[Dict]
    charter_safe: bool
    final_status: str  # "COMPLETE", "HALTED", "IN_PROGRESS"


class AuditReportGenerator:
    """Generate comprehensive audit reports for HITL review"""
    
    def __init__(self):
        self.executions: List[TaskExecution] = []
        self.charter_log = []
        self.ledger_log = []
    
    def log_charter(self, entry: str):
        """Add entry to Charter (customer-safe) log"""
        self.charter_log.append({
            "timestamp": datetime.now().isoformat(),
            "entry": entry,
            "type": "charter"
        })
    
    def log_ledger(self, entry: str, internal_data: Dict = None):
        """Add entry to Ledger (internal audit) log"""
        self.ledger_log.append({
            "timestamp": datetime.now().isoformat(),
            "entry": entry,
            "internal_data": internal_data or {},
            "type": "ledger"
        })
    
    def add_execution(self, execution: TaskExecution):
        """Record a task execution"""
        self.executions.append(execution)
    
    def generate_full_report(self) -> str:
        """Generate complete audit report"""
        report = "=" * 80 + "\n"
        report += "🧠 AVVA NOON GOVERNANCE AUDIT REPORT\n"
        report += "=" * 80 + "\n\n"
        
        report += f"Report Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        report += f"Total Executions: {len(self.executions)}\n\n"
        
        # Executive Summary
        report += self._generate_executive_summary()
        
        # V.I.B.E. Trend Analysis
        report += self._generate_vibe_analysis()
        
        # Charter vs Ledger Comparison
        report += self._generate_charter_ledger_comparison()
        
        # HALT History
        report += self._generate_halt_history()
        
        # FDH Efficiency Report
        report += self._generate_fdh_efficiency()
        
        # Recommendations
        report += self._generate_recommendations()
        
        return report
    
    def _generate_executive_summary(self) -> str:
        """Generate executive summary section"""
        if not self.executions:
            return "EXECUTIVE SUMMARY\n" + "-" * 80 + "\nNo executions recorded.\n\n"
        
        completed = sum(1 for e in self.executions if e.final_status == "COMPLETE")
        halted = sum(1 for e in self.executions if e.final_status == "HALTED")
        in_progress = sum(1 for e in self.executions if e.final_status == "IN_PROGRESS")
        
        total_runtime = sum(e.runtime_hours for e in self.executions)
        avg_vibe = sum(
            sum(e.vibe_scores) / len(e.vibe_scores) if e.vibe_scores else 0
            for e in self.executions
        ) / len(self.executions)
        
        summary = "EXECUTIVE SUMMARY\n"
        summary += "-" * 80 + "\n"
        summary += f"Completed Tasks:    {completed}\n"
        summary += f"Halted Tasks:       {halted}\n"
        summary += f"In Progress:        {in_progress}\n"
        summary += f"Total Runtime:      {total_runtime:.2f} hours\n"
        summary += f"Average V.I.B.E.:   {avg_vibe:.2f}\n"
        summary += f"Charter Safety:     {sum(1 for e in self.executions if e.charter_safe)} / {len(self.executions)} ✅\n"
        summary += "\n"
        
        return summary
    
    def _generate_vibe_analysis(self) -> str:
        """Analyze V.I.B.E. score trends"""
        analysis = "V.I.B.E. TREND ANALYSIS\n"
        analysis += "-" * 80 + "\n"
        
        if not self.executions:
            return analysis + "No data available.\n\n"
        
        all_scores = []
        for execution in self.executions:
            all_scores.extend(execution.vibe_scores)
        
        if not all_scores:
            return analysis + "No V.I.B.E. scores recorded.\n\n"
        
        avg_score = sum(all_scores) / len(all_scores)
        min_score = min(all_scores)
        max_score = max(all_scores)
        
        below_threshold = sum(1 for score in all_scores if score < 0.85)
        
        analysis += f"Average Score:      {avg_score:.3f}\n"
        analysis += f"Min Score:          {min_score:.3f}\n"
        analysis += f"Max Score:          {max_score:.3f}\n"
        analysis += f"Below Threshold:    {below_threshold} / {len(all_scores)}\n"
        
        if avg_score >= 0.85:
            analysis += "Status: ✅ HEALTHY - Average above execution threshold\n"
        else:
            analysis += "Status: ⚠️  WARNING - Average below execution threshold\n"
        
        analysis += "\n"
        return analysis
    
    def _generate_charter_ledger_comparison(self) -> str:
        """Compare Charter and Ledger logs for violations"""
        comparison = "CHARTER-LEDGER SEPARATION AUDIT\n"
        comparison += "-" * 80 + "\n"
        
        comparison += f"Charter Entries: {len(self.charter_log)}\n"
        comparison += f"Ledger Entries:  {len(self.ledger_log)}\n\n"
        
        # Check if any Charter entries contain forbidden data
        violations = []
        forbidden_patterns = ["$0.039", "$8", "300%", "365%", "internal_cost"]
        
        for i, charter_entry in enumerate(self.charter_log):
            for pattern in forbidden_patterns:
                if pattern in str(charter_entry):
                    violations.append({
                        "entry_num": i,
                        "pattern": pattern,
                        "timestamp": charter_entry["timestamp"]
                    })
        
        if violations:
            comparison += f"⚠️  VIOLATIONS DETECTED: {len(violations)}\n\n"
            for v in violations:
                comparison += f"  Entry #{v['entry_num']}: Forbidden pattern '{v['pattern']}' at {v['timestamp']}\n"
        else:
            comparison += "✅ No violations detected. Charter-Ledger separation maintained.\n"
        
        comparison += "\n"
        return comparison
    
    def _generate_halt_history(self) -> str:
        """Generate HALT condition history"""
        history = "HALT CONDITION HISTORY\n"
        history += "-" * 80 + "\n"
        
        total_halts = sum(len(e.halts) for e in self.executions)
        
        if total_halts == 0:
            return history + "No HALT conditions triggered.\n\n"
        
        history += f"Total HALTs: {total_halts}\n\n"
        
        halt_reasons = {}
        for execution in self.executions:
            for halt in execution.halts:
                reason = halt.get("reason", "Unknown")
                halt_reasons[reason] = halt_reasons.get(reason, 0) + 1
        
        history += "HALT Breakdown:\n"
        for reason, count in sorted(halt_reasons.items(), key=lambda x: x[1], reverse=True):
            history += f"  {reason}: {count}\n"
        
        history += "\n"
        return history
    
    def _generate_fdh_efficiency(self) -> str:
        """Calculate FDH efficiency gains"""
        efficiency = "FDH EFFICIENCY REPORT\n"
        efficiency += "-" * 80 + "\n"
        
        if not self.executions:
            return efficiency + "No data available.\n\n"
        
        total_fdh_hours = sum(e.runtime_hours for e in self.executions)
        
        # Estimate legacy time (assume 5x multiplier for traditional development)
        estimated_legacy_hours = total_fdh_hours * 5
        time_saved = estimated_legacy_hours - total_fdh_hours
        compression_rate = (time_saved / estimated_legacy_hours * 100) if estimated_legacy_hours > 0 else 0
        
        efficiency += f"FDH Runtime:        {total_fdh_hours:.2f} hours\n"
        efficiency += f"Legacy Estimate:    {estimated_legacy_hours:.2f} hours\n"
        efficiency += f"Time Saved:         {time_saved:.2f} hours\n"
        efficiency += f"Compression Rate:   {compression_rate:.1f}%\n"
        
        if compression_rate >= 90:
            efficiency += "Status: ✅ EXCELLENT - Exceeding 90% target\n"
        elif compression_rate >= 80:
            efficiency += "Status: ✅ GOOD - Meeting efficiency goals\n"
        else:
            efficiency += "Status: ⚠️  BELOW TARGET - Improvement needed\n"
        
        efficiency += "\n"
        return efficiency
    
    def _generate_recommendations(self) -> str:
        """Generate actionable recommendations"""
        recs = "RECOMMENDATIONS\n"
        recs += "-" * 80 + "\n"
        
        recommendations = []
        
        # Check V.I.B.E. scores
        if self.executions:
            avg_vibe = sum(
                sum(e.vibe_scores) / len(e.vibe_scores) if e.vibe_scores else 0
                for e in self.executions
            ) / len(self.executions)
            
            if avg_vibe < 0.85:
                recommendations.append("Improve code quality - V.I.B.E. scores below threshold")
        
        # Check HALTs
        total_halts = sum(len(e.halts) for e in self.executions)
        if total_halts > len(self.executions) * 0.2:  # More than 20% halt rate
            recommendations.append("High HALT rate - Review validation criteria")
        
        # Check Charter safety
        unsafe_count = sum(1 for e in self.executions if not e.charter_safe)
        if unsafe_count > 0:
            recommendations.append(f"Charter contamination detected in {unsafe_count} executions - Strengthen filtering")
        
        if not recommendations:
            recommendations.append("All systems operating within acceptable parameters")
        
        for i, rec in enumerate(recommendations, 1):
            recs += f"{i}. {rec}\n"
        
        recs += "\n"
        recs += "=" * 80 + "\n"
        recs += "End of Audit Report\n"
        recs += "=" * 80 + "\n"
        
        return recs
    
    def export_json(self, filepath: str):
        """Export audit data as JSON"""
        data = {
            "generated_at": datetime.now().isoformat(),
            "executions": [asdict(e) for e in self.executions],
            "charter_log": self.charter_log,
            "ledger_log": self.ledger_log
        }
        
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2, default=str)


# Tool interface for Agent Zero
def generate_audit_report() -> str:
    """
    Agent Zero tool to generate audit report
    
    Usage:
    "Generate the final audit report: generate_audit_report()"
    """
    generator = AuditReportGenerator()
    # In real usage, this would access global state
    return generator.generate_full_report()


# Example usage
if __name__ == "__main__":
    generator = AuditReportGenerator()
    
    # Simulate some executions
    exec1 = TaskExecution(
        task_id="TASK-001",
        rtccf={"role": "Backend Dev", "task": "Build API"},
        start_time=datetime.now(),
        end_time=datetime.now(),
        runtime_hours=3.5,
        foster_hours=0.5,
        develop_hours=2.8,
        hone_hours=0.2,
        vibe_scores=[0.88, 0.92, 0.89],
        halts=[],
        charter_safe=True,
        final_status="COMPLETE"
    )
    
    generator.add_execution(exec1)
    generator.log_charter("Task TASK-001 completed successfully")
    generator.log_ledger("Task TASK-001 cost breakdown", {"gemini_cost": 0.039, "total": 0.50})
    
    print(generator.generate_full_report())
