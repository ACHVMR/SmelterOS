#!/usr/bin/env python3
"""
CHICKEN HAWK v2.1 — Autonomous Effort Engine
═══════════════════════════════════════════════════════════════════════════════
The Ralph Wiggum Pattern: "I'm helping!" (until the PRD is complete)

This is the main harness that wraps Agent Zero (or any LLM backend) in a
rigid governance loop with the 70% Context Rule and 7 ORACLE Gates.

Usage:
    python chicken_hawk.py --mode autonomous --prd specs/prd.md
    python chicken_hawk.py --mode dry-run --task specs/task-001.yaml
    python chicken_hawk.py --status

Architecture:
    - Time is Irrelevant (measure Tokens + Gates, not hours)
    - Context is a Resource (70% Rule with RLM Distillation)
    - Verification is Absolute (7 ORACLE Gates)
"""

import argparse
import json
import logging
import os
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import yaml

from core.state_manager import StateManager, TaskState
from core.oracle_gates import OracleGatekeeper, GateResult
from core.rlm_distiller import RLMDistiller
from core.visual_evolution import VisualEvolution
from core.token_counter import TokenCounter
from core.opencode_client import OpenCodeClient, OpenCodeConfig
from core.hitl_controller import HITLController, HITLReason, HITLStatus, get_hitl_controller

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

CONFIG_PATH = Path(".chicken-hawk/config.yaml")
DEFAULT_CONFIG = {
    "context": {"distill_threshold": 0.70, "max_window_tokens": 128000},
    "execution": {"max_retries_per_task": 5, "git_auto_commit": True},
}

logger = logging.getLogger("chicken_hawk")


# ═══════════════════════════════════════════════════════════════════════════
# DATA TYPES
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class HarnessConfig:
    """Configuration for the Chicken Hawk harness."""
    mode: str
    distill_threshold: float
    max_window_tokens: int
    max_retries: int
    git_auto_commit: bool
    prd_path: Path
    task_state_path: Path
    ledger_path: Path


@dataclass
class LoopMetrics:
    """Metrics for the current execution loop."""
    tasks_completed: int = 0
    tasks_failed: int = 0
    total_tokens: int = 0
    distillations: int = 0
    retries: int = 0
    gates_passed: int = 0
    gates_failed: int = 0


# ═══════════════════════════════════════════════════════════════════════════
# CHICKEN HAWK ENGINE
# ═══════════════════════════════════════════════════════════════════════════

class ChickenHawk:
    """
    The Autonomous Effort Engine.
    
    Implements the Ralph Wiggum Loop:
    1. Pick next task from PRD
    2. Check context budget (70% rule)
    3. Apply effort (FOSTER → DEVELOP → HONE)
    4. Verify through 7 ORACLE Gates
    5. Commit & evolve or retry
    6. Repeat until PRD complete
    """
    
    def __init__(self, config: HarnessConfig):
        self.config = config
        self.state = StateManager(config.task_state_path)
        self.gatekeeper = OracleGatekeeper()
        self.distiller = RLMDistiller()
        self.visuals = VisualEvolution()
        self.tokens = TokenCounter(config.max_window_tokens)
        self.metrics = LoopMetrics()
        self.agent = None  # Lazy load
        self.opencode = OpenCodeClient()  # Containerized AI agent
        self.hitl = get_hitl_controller()  # Human-in-the-loop controller
        
        self._log_boot()
    
    def _log_boot(self):
        """Log harness initialization to ledger."""
        self._append_ledger(
            task_id="INIT",
            action="HARNESS_BOOT",
            tokens=0,
            gate_status="N/A",
            notes=f"Chicken Hawk v2.1.0 | Mode: {self.config.mode}"
        )
        self.visuals.render_stage("hatchling")
    
    def _append_ledger(
        self,
        task_id: str,
        action: str,
        tokens: int,
        gate_status: str,
        notes: str
    ):
        """Append entry to effort ledger (audit trail)."""
        timestamp = datetime.now(timezone.utc).isoformat()
        entry = f"[{timestamp}] | {task_id} | {action} | {tokens} | {gate_status} | {notes}\n"
        
        with open(self.config.ledger_path, "a", encoding="utf-8") as f:
            f.write(entry)
    
    def run(self) -> bool:
        """
        Execute the Ralph Wiggum Loop with HITL checkpoints.
        
        Returns:
            True if PRD completed successfully, False otherwise
        """
        import asyncio
        
        logger.info("🦅 CHICKEN HAWK ACTIVATED — Ralph Wiggum Loop Starting")
        self.visuals.render_stage("hatchling")
        
        while not self.state.is_complete():
            task = self.state.get_next_task()
            if task is None:
                logger.warning("No tasks available but state not complete")
                break
            
            logger.info(f"━━━ TASK: {task.id} ━━━")
            
            # 0. HITL CHECK - High Risk Detection
            if self.hitl.detect_high_risk(task.description if hasattr(task, 'description') else task.title):
                logger.warning("⚠️ High-risk task detected - requesting HITL approval")
                status = asyncio.get_event_loop().run_until_complete(
                    self.hitl.checkpoint(
                        task_id=task.id,
                        reason=HITLReason.HIGH_RISK,
                        description=f"High-risk task: {task.title}",
                        context={"task": task.__dict__}
                    )
                )
                if status == HITLStatus.REJECTED:
                    logger.info("Task rejected by human - skipping")
                    self.state.mark_skipped(task.id)
                    continue
                elif status == HITLStatus.TIMEOUT:
                    logger.warning("HITL timeout - pausing loop")
                    break
            
            # 1. CONTEXT CHECK (70% Rule)
            if self._should_distill():
                self._perform_distillation()
            
            # 2. EFFORT APPLICATION
            success = self._apply_effort(task)
            
            # 3. VERIFICATION (7 ORACLE Gates)
            if success:
                gate_result = self.gatekeeper.verify_all(task)
                
                if gate_result.passed:
                    self._handle_success(task, gate_result)
                else:
                    self._handle_gate_failure(task, gate_result)
            else:
                self._handle_execution_failure(task)
            
            # 4. SCHEDULED HITL CHECK (every N tasks)
            if self.hitl.should_checkpoint_scheduled():
                progress = self.state.get_progress_percentage()
                asyncio.get_event_loop().run_until_complete(
                    self.hitl.checkpoint(
                        task_id=task.id,
                        reason=HITLReason.SCHEDULED,
                        description=f"Scheduled check-in: {progress:.0f}% complete",
                        blocking=False
                    )
                )
            
            # Update visual evolution based on progress
            self._update_visuals()
        
        self._finalize()
        return self.state.is_complete()
    
    def _should_distill(self) -> bool:
        """Check if context has exceeded 70% threshold."""
        usage = self.tokens.get_usage_ratio()
        threshold = self.config.distill_threshold
        
        if usage > threshold:
            logger.warning(
                f"⚠️ Context at {usage:.1%} (threshold: {threshold:.0%}) — "
                "Triggering RLM Distillation"
            )
            return True
        return False
    
    def _perform_distillation(self):
        """Execute RLM distillation to compress context."""
        logger.info("🧠 RLM DISTILLATION — Compressing context memory")
        
        summary = self.distiller.distill(
            current_context=self.tokens.get_context(),
            standards_path="standards.md",
            current_task=self.state.get_current_task_path()
        )
        
        self.tokens.reset_with_summary(summary)
        self.metrics.distillations += 1
        
        self._append_ledger(
            task_id="RLM",
            action="DISTILLATION",
            tokens=len(summary.split()),
            gate_status="N/A",
            notes=f"Context compressed. Distillation #{self.metrics.distillations}"
        )
    
    def _apply_effort(self, task: TaskState) -> bool:
        """
        Apply FOSTER → DEVELOP → HONE phases to a task using OpenCode.
        
        Returns:
            True if execution succeeded, False otherwise
        """
        try:
            # FOSTER: Frame the task, analyze requirements
            logger.info("  [FOSTER] Framing task...")
            foster_prompt = f"Analyze this task and outline the approach: {task.title}\n{task.description}"
            foster_result = self.opencode.execute_task(foster_prompt)
            
            if not foster_result.success:
                logger.warning(f"  [FOSTER] Analysis failed: {foster_result.error}")
                return False
            
            # DEVELOP: Generate code, implement solution
            logger.info("  [DEVELOP] Generating solution...")
            develop_prompt = f"Implement this task: {task.title}\n{task.description}\n\nApproach: {foster_result.output[:500]}"
            develop_result = self.opencode.execute_task(develop_prompt)
            
            if not develop_result.success:
                logger.warning(f"  [DEVELOP] Implementation failed: {develop_result.error}")
                return False
            
            # Track tokens used
            self.metrics.total_tokens += foster_result.tokens_used + develop_result.tokens_used
            
            # HONE: Refine, optimize, polish
            logger.info("  [HONE] Refining output...")
            hone_prompt = f"Review and refine the implementation for: {task.title}. Fix any issues and optimize."
            hone_result = self.opencode.execute_task(hone_prompt)
            
            if hone_result.success:
                self.metrics.total_tokens += hone_result.tokens_used
            
            return True
            
        except Exception as e:
            logger.error(f"Execution failed: {e}")
            return False
    
    def _handle_success(self, task: TaskState, gate_result: GateResult):
        """Handle successful task completion."""
        logger.info(f"✅ TASK {task.id} PASSED ALL 7 GATES")
        
        self.state.mark_complete(task.id)
        self.metrics.tasks_completed += 1
        self.metrics.gates_passed += 7
        
        self._append_ledger(
            task_id=task.id,
            action="TASK_COMPLETE",
            tokens=gate_result.tokens_used,
            gate_status="7/7 PASSED",
            notes=f"All gates verified. Total retries: {task.retry_count}"
        )
        
        if self.config.git_auto_commit:
            self._git_commit(task)
    
    def _handle_gate_failure(self, task: TaskState, gate_result: GateResult):
        """Handle task that failed one or more gates."""
        failed_gates = [g for g, passed in gate_result.gate_status.items() if not passed]
        logger.warning(f"❌ GATE FAILURE: {', '.join(failed_gates)}")
        
        self.metrics.gates_failed += len(failed_gates)
        
        if task.retry_count < self.config.max_retries:
            self.state.log_retry(task.id, gate_result.failure_reason)
            self.metrics.retries += 1
            
            self._append_ledger(
                task_id=task.id,
                action="GATE_FAILURE",
                tokens=gate_result.tokens_used,
                gate_status=f"{7 - len(failed_gates)}/7",
                notes=f"Failed: {', '.join(failed_gates)}. Retry #{task.retry_count + 1}"
            )
        else:
            self.state.mark_failed(task.id)
            self.metrics.tasks_failed += 1
            logger.error(f"🚨 TASK {task.id} EXCEEDED MAX RETRIES — Marking failed")
    
    def _handle_execution_failure(self, task: TaskState):
        """Handle task execution failure."""
        logger.error(f"🚨 Execution failure for task {task.id}")
        
        if task.retry_count < self.config.max_retries:
            self.state.log_retry(task.id, "Execution exception")
            self.metrics.retries += 1
        else:
            self.state.mark_failed(task.id)
            self.metrics.tasks_failed += 1
    
    def _update_visuals(self):
        """Update visual evolution based on progress."""
        progress = self.state.get_progress_percentage()
        
        if progress < 10:
            self.visuals.render_stage("hatchling")
        elif progress < 80:
            self.visuals.render_stage("hunter", progress)
        else:
            self.visuals.render_stage("powerhouse", progress)
    
    def _git_commit(self, task: TaskState):
        """Commit completed task to git."""
        import subprocess
        
        try:
            message = f"[CHICKEN-HAWK] Complete: {task.id} — {task.title}"
            subprocess.run(
                ["git", "add", "-A"],
                check=True,
                capture_output=True
            )
            subprocess.run(
                ["git", "commit", "-m", message],
                check=True,
                capture_output=True
            )
            logger.info(f"  📦 Git commit: {message[:60]}...")
        except subprocess.CalledProcessError as e:
            logger.warning(f"Git commit failed: {e}")
    
    def _finalize(self):
        """Finalize the execution loop."""
        logger.info("═══════════════════════════════════════════════════")
        logger.info("🦅 CHICKEN HAWK LOOP COMPLETE")
        logger.info(f"  Tasks Completed: {self.metrics.tasks_completed}")
        logger.info(f"  Tasks Failed:    {self.metrics.tasks_failed}")
        logger.info(f"  Total Retries:   {self.metrics.retries}")
        logger.info(f"  Distillations:   {self.metrics.distillations}")
        logger.info(f"  Gates Passed:    {self.metrics.gates_passed}")
        logger.info("═══════════════════════════════════════════════════")
        
        if self.state.is_complete():
            self.visuals.render_stage("powerhouse", 100)
        
        self._append_ledger(
            task_id="FINAL",
            action="LOOP_COMPLETE",
            tokens=self.metrics.total_tokens,
            gate_status=f"{self.metrics.gates_passed} total",
            notes=f"Completed: {self.metrics.tasks_completed}, Failed: {self.metrics.tasks_failed}"
        )


# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION LOADER
# ═══════════════════════════════════════════════════════════════════════════

def load_config(args: argparse.Namespace) -> HarnessConfig:
    """Load configuration from file and CLI args."""
    config_data = DEFAULT_CONFIG.copy()
    
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH, encoding="utf-8") as f:
            file_config = yaml.safe_load(f)
            if file_config:
                config_data = _deep_merge(config_data, file_config)
    
    return HarnessConfig(
        mode=args.mode or config_data.get("harness", {}).get("mode", "autonomous"),
        distill_threshold=config_data["context"]["distill_threshold"],
        max_window_tokens=config_data["context"]["max_window_tokens"],
        max_retries=config_data["execution"]["max_retries_per_task"],
        git_auto_commit=config_data["execution"]["git_auto_commit"],
        prd_path=Path(args.prd) if args.prd else Path("specs/prd.md"),
        task_state_path=Path("specs/task-state.json"),
        ledger_path=Path(".chicken-hawk/ledger.log"),
    )


def _deep_merge(base: dict, override: dict) -> dict:
    """Deep merge two dictionaries."""
    result = base.copy()
    for key, value in override.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = _deep_merge(result[key], value)
        else:
            result[key] = value
    return result


# ═══════════════════════════════════════════════════════════════════════════
# CLI INTERFACE
# ═══════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        prog="chicken_hawk",
        description="CHICKEN HAWK v2.1 — Autonomous Effort Engine"
    )
    parser.add_argument(
        "--mode", "-m",
        choices=["autonomous", "supervised", "dry-run"],
        default="autonomous",
        help="Execution mode"
    )
    parser.add_argument(
        "--prd", "-p",
        type=str,
        default="specs/prd.md",
        help="Path to PRD file"
    )
    parser.add_argument(
        "--task", "-t",
        type=str,
        help="Run a single task file"
    )
    parser.add_argument(
        "--status", "-s",
        action="store_true",
        help="Show current status and exit"
    )
    parser.add_argument(
        "--visuals",
        choices=["retro", "minimal", "off"],
        default="retro",
        help="Visual style for terminal output"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose logging"
    )
    
    args = parser.parse_args()
    
    # Setup logging
    log_level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s | %(levelname)s | %(message)s",
        datefmt="%H:%M:%S"
    )
    
    # Status check
    if args.status:
        show_status()
        return
    
    # Load config and run
    config = load_config(args)
    hawk = ChickenHawk(config)
    
    try:
        success = hawk.run()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        logger.info("\n🛑 Interrupted by user")
        sys.exit(130)


def show_status():
    """Display current harness status."""
    print("\n🦅 CHICKEN HAWK STATUS")
    print("═" * 50)
    
    if Path("specs/task-state.json").exists():
        with open("specs/task-state.json", encoding="utf-8") as f:
            state = json.load(f)
        
        total = len(state.get("tasks", []))
        completed = sum(1 for t in state.get("tasks", []) if t.get("status") == "complete")
        failed = sum(1 for t in state.get("tasks", []) if t.get("status") == "failed")
        pending = total - completed - failed
        
        print(f"  Total Tasks:     {total}")
        print(f"  Completed:       {completed}")
        print(f"  Failed:          {failed}")
        print(f"  Pending:         {pending}")
        print(f"  Progress:        {(completed / total * 100) if total > 0 else 0:.1f}%")
    else:
        print("  No task-state.json found. Run with --prd to initialize.")
    
    print("═" * 50)


if __name__ == "__main__":
    main()
