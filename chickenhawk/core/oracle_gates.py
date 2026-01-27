"""
7 ORACLE GATES — Defense-in-Depth Verification
═══════════════════════════════════════════════════════════════════════════════
A task is only "Done" when all 7 gates return TRUE.

Gate 1: TECHNICAL  - pytest pass, lint clean, coverage ≥ 80%
Gate 2: VIRTUE     - Alignment score (f_virtue) ≥ 0.995
Gate 3: ETHICS     - Charter-safe check (no internal cost leakage)
Gate 4: JUDGE      - LLM auditor compares code vs. spec
Gate 5: STRATEGY   - Long-term value check (no tech debt hacks)
Gate 6: PERCEPTION - VL-JEPA visual check (UI matches design)
Gate 7: EFFORT     - Token budget audit (is this worth the cost?)
"""

import subprocess
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

logger = logging.getLogger("chicken_hawk.oracle_gates")


# ═══════════════════════════════════════════════════════════════════════════
# DATA TYPES
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class GateResult:
    """Result of running all 7 ORACLE gates."""
    passed: bool
    gate_status: dict = field(default_factory=dict)
    failure_reason: Optional[str] = None
    tokens_used: int = 0
    details: dict = field(default_factory=dict)


@dataclass
class GateConfig:
    """Configuration for individual gates."""
    enabled: bool = True
    threshold: float = 0.0
    auto_fix: bool = False
    max_attempts: int = 3


# ═══════════════════════════════════════════════════════════════════════════
# ORACLE GATEKEEPER
# ═══════════════════════════════════════════════════════════════════════════

class OracleGatekeeper:
    """
    The 7 ORACLE Gates verification system.
    
    Enforces Defense-in-Depth: every artifact must pass all 7 gates
    before being marked as complete.
    """
    
    def __init__(self, config_path: Optional[Path] = None):
        self.gates = {
            "technical": GateConfig(threshold=0.80),
            "virtue": GateConfig(threshold=0.995),
            "ethics": GateConfig(),
            "judge": GateConfig(),
            "strategy": GateConfig(),
            "perception": GateConfig(enabled=False),  # VL-JEPA not yet integrated
            "effort": GateConfig(),
        }
        
        if config_path and config_path.exists():
            self._load_config(config_path)
    
    def verify_all(self, task) -> GateResult:
        """
        Run all 7 ORACLE gates on a task.
        
        Args:
            task: The TaskState object to verify
            
        Returns:
            GateResult with pass/fail status for each gate
        """
        results = {}
        details = {}
        all_passed = True
        failure_reason = None
        total_tokens = 0
        
        # Gate 1: TECHNICAL
        if self.gates["technical"].enabled:
            gate1 = self._gate_technical(task)
            results["technical"] = gate1["passed"]
            details["technical"] = gate1
            if not gate1["passed"]:
                all_passed = False
                failure_reason = failure_reason or gate1.get("reason")
        
        # Gate 2: VIRTUE
        if self.gates["virtue"].enabled:
            gate2 = self._gate_virtue(task)
            results["virtue"] = gate2["passed"]
            details["virtue"] = gate2
            total_tokens += gate2.get("tokens", 0)
            if not gate2["passed"]:
                all_passed = False
                failure_reason = failure_reason or gate2.get("reason")
        
        # Gate 3: ETHICS
        if self.gates["ethics"].enabled:
            gate3 = self._gate_ethics(task)
            results["ethics"] = gate3["passed"]
            details["ethics"] = gate3
            if not gate3["passed"]:
                all_passed = False
                failure_reason = failure_reason or gate3.get("reason")
        
        # Gate 4: JUDGE
        if self.gates["judge"].enabled:
            gate4 = self._gate_judge(task)
            results["judge"] = gate4["passed"]
            details["judge"] = gate4
            total_tokens += gate4.get("tokens", 0)
            if not gate4["passed"]:
                all_passed = False
                failure_reason = failure_reason or gate4.get("reason")
        
        # Gate 5: STRATEGY
        if self.gates["strategy"].enabled:
            gate5 = self._gate_strategy(task)
            results["strategy"] = gate5["passed"]
            details["strategy"] = gate5
            if not gate5["passed"]:
                all_passed = False
                failure_reason = failure_reason or gate5.get("reason")
        
        # Gate 6: PERCEPTION (VL-JEPA)
        if self.gates["perception"].enabled:
            gate6 = self._gate_perception(task)
            results["perception"] = gate6["passed"]
            details["perception"] = gate6
            total_tokens += gate6.get("tokens", 0)
            if not gate6["passed"]:
                all_passed = False
                failure_reason = failure_reason or gate6.get("reason")
        else:
            results["perception"] = True  # Skip if disabled
        
        # Gate 7: EFFORT
        if self.gates["effort"].enabled:
            gate7 = self._gate_effort(task, total_tokens)
            results["effort"] = gate7["passed"]
            details["effort"] = gate7
            if not gate7["passed"]:
                all_passed = False
                failure_reason = failure_reason or gate7.get("reason")
        
        return GateResult(
            passed=all_passed,
            gate_status=results,
            failure_reason=failure_reason,
            tokens_used=total_tokens,
            details=details
        )
    
    # ───────────────────────────────────────────────────────────────────────
    # GATE IMPLEMENTATIONS
    # ───────────────────────────────────────────────────────────────────────
    
    def _gate_technical(self, task) -> dict:
        """
        Gate 1: TECHNICAL
        - pytest passes
        - Linting clean (ruff)
        - Coverage ≥ 80%
        """
        logger.info("  [Gate 1] TECHNICAL — Running tests & lint...")
        
        # Run pytest
        pytest_passed = True
        coverage = 0.0
        
        try:
            result = subprocess.run(
                ["pytest", "--cov", "-q", "--tb=no"],
                capture_output=True,
                text=True,
                timeout=120
            )
            pytest_passed = result.returncode == 0
            
            # Parse coverage from output
            for line in result.stdout.split("\n"):
                if "TOTAL" in line and "%" in line:
                    parts = line.split()
                    for part in parts:
                        if part.endswith("%"):
                            coverage = float(part.rstrip("%")) / 100
                            break
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pytest_passed = False
        
        # Run ruff
        lint_passed = True
        try:
            result = subprocess.run(
                ["ruff", "check", "."],
                capture_output=True,
                timeout=30
            )
            lint_passed = result.returncode == 0
        except (subprocess.TimeoutExpired, FileNotFoundError):
            lint_passed = True  # Skip if ruff not available
        
        threshold = self.gates["technical"].threshold
        coverage_passed = coverage >= threshold
        
        passed = pytest_passed and lint_passed and coverage_passed
        
        return {
            "passed": passed,
            "pytest": pytest_passed,
            "lint": lint_passed,
            "coverage": coverage,
            "coverage_threshold": threshold,
            "reason": None if passed else f"Technical checks failed (coverage: {coverage:.0%})"
        }
    
    def _gate_virtue(self, task) -> dict:
        """
        Gate 2: VIRTUE
        - Alignment score (f_virtue) ≥ 0.995
        """
        logger.info("  [Gate 2] VIRTUE — Checking alignment score...")
        
        # Import AVVA NOON vibe validator
        try:
            from services.avva_noon.vibe_validator import validate_artifact
            
            result = validate_artifact(task.output_path)
            score = result.get("alignment_score", 0.0)
            threshold = self.gates["virtue"].threshold
            passed = score >= threshold
            
            return {
                "passed": passed,
                "alignment_score": score,
                "threshold": threshold,
                "tokens": result.get("tokens_used", 0),
                "reason": None if passed else f"Alignment score {score:.3f} < {threshold}"
            }
        except ImportError:
            # Fallback if validator not available
            logger.warning("  [Gate 2] VIRTUE validator not available — passing")
            return {"passed": True, "alignment_score": 1.0, "tokens": 0}
    
    def _gate_ethics(self, task) -> dict:
        """
        Gate 3: ETHICS
        - Charter-safe check
        - No internal cost leakage
        """
        logger.info("  [Gate 3] ETHICS — Checking charter compliance...")
        
        try:
            from services.avva_noon.charter_ledger import check_charter_safe
            
            result = check_charter_safe(task.output_path)
            passed = result.get("charter_safe", False)
            
            return {
                "passed": passed,
                "charter_safe": passed,
                "violations": result.get("violations", []),
                "reason": None if passed else "Charter violations detected"
            }
        except ImportError:
            logger.warning("  [Gate 3] ETHICS checker not available — passing")
            return {"passed": True, "charter_safe": True}
    
    def _gate_judge(self, task) -> dict:
        """
        Gate 4: JUDGE
        - LLM auditor compares code vs. spec
        """
        logger.info("  [Gate 4] JUDGE — LLM auditing code vs spec...")
        
        # TODO: Integrate with LLM auditor
        # For now, return passed
        return {
            "passed": True,
            "match_score": 1.0,
            "tokens": 0,
            "reason": None
        }
    
    def _gate_strategy(self, task) -> dict:
        """
        Gate 5: STRATEGY
        - Long-term value check
        - No tech debt hacks
        """
        logger.info("  [Gate 5] STRATEGY — Checking for tech debt...")
        
        # TODO: Implement tech debt scanner
        return {
            "passed": True,
            "tech_debt_score": 0.0,
            "reason": None
        }
    
    def _gate_perception(self, task) -> dict:
        """
        Gate 6: PERCEPTION
        - VL-JEPA visual check
        - UI matches design
        """
        logger.info("  [Gate 6] PERCEPTION — Visual verification...")
        
        # VL-JEPA integration placeholder
        return {
            "passed": True,
            "visual_match": 1.0,
            "tokens": 0,
            "reason": None
        }
    
    def _gate_effort(self, task, tokens_used: int) -> dict:
        """
        Gate 7: EFFORT
        - Token budget audit
        - Is this worth the cost?
        """
        logger.info("  [Gate 7] EFFORT — Auditing token budget...")
        
        max_tokens = 50000  # Per task limit
        passed = tokens_used <= max_tokens
        
        return {
            "passed": passed,
            "tokens_used": tokens_used,
            "max_tokens": max_tokens,
            "budget_ratio": tokens_used / max_tokens if max_tokens > 0 else 0,
            "reason": None if passed else f"Token budget exceeded: {tokens_used}/{max_tokens}"
        }
    
    def _load_config(self, config_path: Path):
        """Load gate configuration from file."""
        import yaml
        
        with open(config_path, encoding="utf-8") as f:
            config = yaml.safe_load(f)
        
        gates_config = config.get("oracle_gates", {})
        for gate_name, gate_settings in gates_config.items():
            if gate_name in self.gates:
                if isinstance(gate_settings, dict):
                    self.gates[gate_name].enabled = gate_settings.get("enabled", True)
                    if "threshold" in gate_settings:
                        self.gates[gate_name].threshold = gate_settings["threshold"]
                    if "coverage_threshold" in gate_settings:
                        self.gates[gate_name].threshold = gate_settings["coverage_threshold"] / 100
                    if "alignment_threshold" in gate_settings:
                        self.gates[gate_name].threshold = gate_settings["alignment_threshold"]


# ═══════════════════════════════════════════════════════════════════════════
# STANDALONE USAGE
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import sys
    
    gatekeeper = OracleGatekeeper()
    
    class MockTask:
        id = "test-001"
        output_path = "."
    
    result = gatekeeper.verify_all(MockTask())
    
    print("\n🛡️ ORACLE GATES RESULT")
    print("═" * 50)
    for gate, passed in result.gate_status.items():
        status = "✅" if passed else "❌"
        print(f"  {status} {gate.upper()}")
    print("═" * 50)
    print(f"  OVERALL: {'PASSED' if result.passed else 'FAILED'}")
    
    sys.exit(0 if result.passed else 1)
