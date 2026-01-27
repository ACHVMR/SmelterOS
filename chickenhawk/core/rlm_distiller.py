"""
RLM DISTILLER — Context Compression Engine
═════════════════════════════════════════════════════════════════════════
Implements the 70% Context Rule for Chicken Hawk.
"""

import logging
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

logger = logging.getLogger("chicken_hawk.rlm_distiller")


@dataclass
class DistillationResult:
    summary: str
    original_tokens: int
    compressed_tokens: int
    compression_ratio: float


class RLMDistiller:
    """Recursive Language Model Distillation for context compression."""
    
    def __init__(self, output_path: Path = Path("docs/distilled-context.md")):
        self.output_path = output_path
        self.distillation_count = 0
    
    def distill(
        self,
        current_context: str,
        standards_path: str = "standards.md",
        current_task: Optional[str] = None
    ) -> str:
        """Distill context into compressed summary."""
        logger.info("🧠 RLM Distillation starting...")
        
        self.distillation_count += 1
        original_tokens = len(current_context) // 4
        
        decisions = self._extract_decisions(current_context)
        files_modified = self._extract_files(current_context)
        errors = self._extract_errors(current_context)
        
        summary = self._build_summary(decisions, files_modified, errors)
        self._save_distillation(summary)
        
        injection = self._build_injection(summary, standards_path, current_task)
        
        compressed_tokens = len(summary) // 4
        logger.info(f"  Distilled: {original_tokens} → {compressed_tokens} tokens")
        
        return injection
    
    def _extract_decisions(self, context: str) -> list:
        markers = ["decided to", "we chose", "going with", "solution:"]
        decisions = []
        for line in context.split("\n"):
            if any(m in line.lower() for m in markers):
                decisions.append(line.strip()[:200])
        return decisions[:10]
    
    def _extract_files(self, context: str) -> list:
        pattern = r'(?:created|modified|wrote to)\s+[`"]?([^\s`"]+\.[a-z]+)'
        return list(set(re.findall(pattern, context, re.IGNORECASE)))[:20]
    
    def _extract_errors(self, context: str) -> list:
        errors = []
        for line in context.split("\n"):
            if any(m in line.lower() for m in ["error:", "failed:", "❌"]):
                errors.append(line.strip()[:200])
        return errors[:5]
    
    def _build_summary(self, decisions: list, files: list, errors: list) -> str:
        ts = datetime.now(timezone.utc).isoformat()
        s = f"# DISTILLED CONTEXT\n> Distillation #{self.distillation_count} | {ts}\n\n"
        s += "## Decisions\n" + "\n".join(f"- {d}" for d in decisions) + "\n\n"
        s += "## Files Modified\n" + "\n".join(f"- `{f}`" for f in files) + "\n\n"
        s += "## Errors\n" + "\n".join(f"- {e}" for e in errors) + "\n"
        return s
    
    def _save_distillation(self, summary: str):
        self.output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.output_path, "w", encoding="utf-8") as f:
            f.write(summary)
    
    def _build_injection(self, summary: str, standards: str, task: Optional[str]) -> str:
        parts = [summary]
        if Path(standards).exists():
            with open(standards, encoding="utf-8") as f:
                parts.insert(0, f.read())
        if task and Path(task).exists():
            with open(task, encoding="utf-8") as f:
                parts.append(f"# CURRENT TASK\n```yaml\n{f.read()}\n```")
        return "\n\n---\n\n".join(parts)
