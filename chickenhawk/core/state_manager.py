"""
STATE MANAGER — The Brain of Chicken Hawk
═══════════════════════════════════════════════════════════════════════════════
Tracks task completion, retries, and overall PRD progress.
Memory lives in files (task-state.json), not in chat history.
"""

import json
import logging
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Literal

import yaml

logger = logging.getLogger("chicken_hawk.state_manager")


# ═══════════════════════════════════════════════════════════════════════════
# DATA TYPES
# ═══════════════════════════════════════════════════════════════════════════

TaskStatus = Literal["pending", "in_progress", "complete", "failed", "blocked"]


@dataclass
class TaskState:
    """State of a single task."""
    id: str
    title: str
    status: TaskStatus = "pending"
    retry_count: int = 0
    last_failure: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    output_path: Optional[str] = None
    spec_path: Optional[str] = None
    tokens_used: int = 0
    
    def to_dict(self) -> dict:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: dict) -> "TaskState":
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})


@dataclass
class PRDState:
    """State of the entire PRD."""
    prd_file: str
    version: str = "1.0"
    tasks: list = field(default_factory=list)
    created_at: str = ""
    updated_at: str = ""
    
    def to_dict(self) -> dict:
        return {
            "prd_file": self.prd_file,
            "version": self.version,
            "tasks": [t.to_dict() if isinstance(t, TaskState) else t for t in self.tasks],
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }


# ═══════════════════════════════════════════════════════════════════════════
# STATE MANAGER
# ═══════════════════════════════════════════════════════════════════════════

class StateManager:
    """
    Manages task state for the Chicken Hawk loop.
    
    Persistence: All state is stored in specs/task-state.json
    This is the "brain" that survives context refreshes.
    """
    
    def __init__(self, state_path: Path):
        self.state_path = Path(state_path)
        self.state: Optional[PRDState] = None
        self._load_or_create()
    
    def _load_or_create(self):
        """Load existing state or create new."""
        if self.state_path.exists():
            self._load()
        else:
            self.state = PRDState(
                prd_file="specs/prd.md",
                created_at=datetime.now(timezone.utc).isoformat(),
                updated_at=datetime.now(timezone.utc).isoformat()
            )
            self._save()
    
    def _load(self):
        """Load state from file."""
        with open(self.state_path, encoding="utf-8") as f:
            data = json.load(f)
        
        tasks = [TaskState.from_dict(t) for t in data.get("tasks", [])]
        self.state = PRDState(
            prd_file=data.get("prd_file", "specs/prd.md"),
            version=data.get("version", "1.0"),
            tasks=tasks,
            created_at=data.get("created_at", ""),
            updated_at=data.get("updated_at", "")
        )
        logger.info(f"Loaded state: {len(tasks)} tasks")
    
    def _save(self):
        """Save state to file."""
        self.state.updated_at = datetime.now(timezone.utc).isoformat()
        
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.state_path, "w", encoding="utf-8") as f:
            json.dump(self.state.to_dict(), f, indent=2)
    
    def initialize_from_prd(self, prd_path: Path):
        """
        Parse PRD and create task list.
        
        Expects PRD format with task headers like:
        ## Task: task-001 — Title
        """
        with open(prd_path, encoding="utf-8") as f:
            content = f.read()
        
        tasks = []
        lines = content.split("\n")
        
        for line in lines:
            # Look for task headers
            if line.startswith("## Task:") or line.startswith("### Task:"):
                # Parse: ## Task: task-001 — Title
                parts = line.split("—")
                if len(parts) >= 2:
                    task_id = parts[0].replace("## Task:", "").replace("### Task:", "").strip()
                    title = parts[1].strip()
                else:
                    task_id = line.replace("## Task:", "").replace("### Task:", "").strip()
                    title = task_id
                
                task_id = task_id.replace(" ", "-").lower()
                
                tasks.append(TaskState(
                    id=task_id,
                    title=title,
                    spec_path=f"specs/{task_id}.yaml"
                ))
        
        self.state = PRDState(
            prd_file=str(prd_path),
            tasks=tasks,
            created_at=datetime.now(timezone.utc).isoformat(),
            updated_at=datetime.now(timezone.utc).isoformat()
        )
        self._save()
        logger.info(f"Initialized {len(tasks)} tasks from PRD")
        
        return tasks
    
    def get_next_task(self) -> Optional[TaskState]:
        """Get next pending task."""
        for task in self.state.tasks:
            if isinstance(task, TaskState) and task.status == "pending":
                task.status = "in_progress"
                task.started_at = datetime.now(timezone.utc).isoformat()
                self._save()
                return task
        return None
    
    def get_task(self, task_id: str) -> Optional[TaskState]:
        """Get a specific task by ID."""
        for task in self.state.tasks:
            if isinstance(task, TaskState) and task.id == task_id:
                return task
        return None
    
    def mark_complete(self, task_id: str):
        """Mark a task as complete."""
        task = self.get_task(task_id)
        if task:
            task.status = "complete"
            task.completed_at = datetime.now(timezone.utc).isoformat()
            self._save()
            logger.info(f"Task {task_id} marked complete")
    
    def mark_failed(self, task_id: str):
        """Mark a task as failed."""
        task = self.get_task(task_id)
        if task:
            task.status = "failed"
            self._save()
            logger.warning(f"Task {task_id} marked failed")
    
    def log_retry(self, task_id: str, reason: str):
        """Log a retry attempt for a task."""
        task = self.get_task(task_id)
        if task:
            task.retry_count += 1
            task.last_failure = reason
            task.status = "pending"  # Reset to pending for retry
            self._save()
            logger.info(f"Task {task_id} retry #{task.retry_count}: {reason}")
    
    def is_complete(self) -> bool:
        """Check if all tasks are complete or failed."""
        if not self.state.tasks:
            return True
        
        for task in self.state.tasks:
            if isinstance(task, TaskState):
                if task.status not in ("complete", "failed"):
                    return False
        return True
    
    def get_progress_percentage(self) -> float:
        """Get completion percentage."""
        if not self.state.tasks:
            return 100.0
        
        completed = sum(
            1 for t in self.state.tasks
            if isinstance(t, TaskState) and t.status == "complete"
        )
        return (completed / len(self.state.tasks)) * 100
    
    def get_current_task_path(self) -> Optional[str]:
        """Get path to current in-progress task spec."""
        for task in self.state.tasks:
            if isinstance(task, TaskState) and task.status == "in_progress":
                return task.spec_path
        return None
    
    def get_summary(self) -> dict:
        """Get summary statistics."""
        total = len(self.state.tasks)
        completed = sum(1 for t in self.state.tasks if isinstance(t, TaskState) and t.status == "complete")
        failed = sum(1 for t in self.state.tasks if isinstance(t, TaskState) and t.status == "failed")
        pending = sum(1 for t in self.state.tasks if isinstance(t, TaskState) and t.status == "pending")
        in_progress = sum(1 for t in self.state.tasks if isinstance(t, TaskState) and t.status == "in_progress")
        
        return {
            "total": total,
            "completed": completed,
            "failed": failed,
            "pending": pending,
            "in_progress": in_progress,
            "progress_pct": self.get_progress_percentage()
        }


# ═══════════════════════════════════════════════════════════════════════════
# STANDALONE USAGE
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import sys
    
    state_path = Path("specs/task-state.json")
    manager = StateManager(state_path)
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "init" and len(sys.argv) > 2:
            prd_path = Path(sys.argv[2])
            tasks = manager.initialize_from_prd(prd_path)
            print(f"Initialized {len(tasks)} tasks")
        elif sys.argv[1] == "status":
            summary = manager.get_summary()
            print(f"\n📊 STATE SUMMARY")
            print("═" * 40)
            for key, value in summary.items():
                print(f"  {key}: {value}")
    else:
        print("Usage:")
        print("  python state_manager.py init <prd.md>")
        print("  python state_manager.py status")
