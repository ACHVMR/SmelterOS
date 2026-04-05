"""
BaseLilHawk — Base class for ALL Lil_Hawks
═══════════════════════════════════════════════════════════════
Every Lil_Hawk inherits from this base.
Every Lil_Hawk has Claw-Code.
Every Lil_Hawk reports to Chicken Hawk (direct) and ACHEEVY (upstream).
Every Lil_Hawk can be promoted to Chicken Hawk status.
Every Lil_Hawk can be overseen by a delegated Boomer_Ang.
"""

from typing import Optional, List


class BaseLilHawk:

    def __init__(self, name: str, squad: str, specialty: str, model: str = "default"):
        self.name = name
        self.squad = squad  # "build", "security", "support"
        self.specialty = specialty
        self.model = model
        self.reports_to = "Chicken_Hawk"
        self.upstream = "ACHEEVY"
        self.claw_code = True
        self.tasks_completed = 0
        self.five_gate_pass_rate = 1.0
        self.security_incidents = 0
        self.delegated_overseer: Optional[str] = None

    @property
    def valid_assigners(self) -> List[str]:
        assigners = ["Chicken_Hawk", "ACHEEVY"]
        if self.delegated_overseer:
            assigners.append(self.delegated_overseer)
        return assigners

    def accept_task(self, task: dict) -> dict:
        """Accept a task — validates chain of command."""
        assigned_by = task.get("assigned_by", "")

        if assigned_by not in self.valid_assigners:
            return {
                "accepted": False,
                "error": f"{self.name} only accepts tasks from {self.valid_assigners}. "
                         f"Received from: {assigned_by}",
            }

        return {
            "accepted": True,
            "hawk": self.name,
            "squad": self.squad,
            "task_id": task.get("task_id"),
            "status": "EXECUTING",
        }

    def report_completion(self, task_id: str, result: dict) -> dict:
        """Report task completion back to Chicken Hawk."""
        self.tasks_completed += 1
        return {
            "from": self.name,
            "to": "Chicken_Hawk",
            "task_id": task_id,
            "status": "COMPLETE",
            "result": result,
            "claw_code_used": True,
            "five_gate_passed": result.get("five_gate_passed"),
        }

    def accept_boomer_ang_oversight(self, boomer_ang: str) -> dict:
        """Accept delegation from ACHEEVY to be overseen by a Boomer_Ang."""
        self.delegated_overseer = boomer_ang
        return {
            "hawk": self.name,
            "overseer": boomer_ang,
            "delegated_by": "ACHEEVY",
            "status": "oversight_accepted",
        }

    def check_promotion_eligibility(self) -> dict:
        """Check if this Lil_Hawk meets Chicken Hawk promotion criteria."""
        eligible = (
            self.tasks_completed >= 100
            and self.five_gate_pass_rate >= 0.95
            and self.security_incidents == 0
        )
        return {
            "hawk": self.name,
            "eligible_for_promotion": eligible,
            "tasks_completed": self.tasks_completed,
            "five_gate_pass_rate": self.five_gate_pass_rate,
            "security_incidents": self.security_incidents,
        }
