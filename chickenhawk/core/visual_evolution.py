"""
VISUAL EVOLUTION — Terminal Feedback System
═════════════════════════════════════════════════════════════════════════
Renders ASCII art sprites based on effort percentage.
Stages: Hatchling (0-10%) → Hunter (10-80%) → Powerhouse (80-100%)
"""

import os
import logging
from pathlib import Path

logger = logging.getLogger("chicken_hawk.visual_evolution")

SPRITES_PATH = Path(".chicken-hawk/sprites")


class VisualEvolution:
    """Visual feedback system using ASCII art sprites."""
    
    def __init__(self, sprites_path: Path = SPRITES_PATH):
        self.sprites_path = sprites_path
        self.current_stage = "hatchling"
        self.current_progress = 0
    
    def render_stage(self, stage: str, progress: float = 0):
        """Render the appropriate stage sprite."""
        self.current_stage = stage
        self.current_progress = progress
        
        sprite_file = self.sprites_path / f"{stage}.txt"
        
        if sprite_file.exists():
            self._clear_terminal()
            sprite = self._load_sprite(sprite_file, progress)
            print(sprite)
        else:
            self._render_fallback(stage, progress)
    
    def _load_sprite(self, path: Path, progress: float) -> str:
        """Load and customize sprite with progress bar."""
        with open(path, encoding="utf-8") as f:
            sprite = f.read()
        
        # Update progress bar in sprite
        progress_bar = self._generate_progress_bar(progress)
        sprite = sprite.replace("░░░░░░░░░░ 0%", progress_bar)
        sprite = sprite.replace("█████░░░░░ 50%", progress_bar)
        sprite = sprite.replace("██████████ 100%", progress_bar)
        
        return sprite
    
    def _generate_progress_bar(self, progress: float) -> str:
        """Generate a progress bar string."""
        filled = int(progress / 10)
        empty = 10 - filled
        return f"{'█' * filled}{'░' * empty} {progress:.0f}%"
    
    def _render_fallback(self, stage: str, progress: float):
        """Fallback rendering when sprites not available."""
        stages = {
            "hatchling": "🥚",
            "hunter": "🦅",
            "powerhouse": "⚡"
        }
        emoji = stages.get(stage, "🦅")
        bar = self._generate_progress_bar(progress)
        
        print(f"\n{emoji} CHICKEN HAWK v2.1 — {stage.upper()}")
        print(f"   Progress: [{bar}]")
        print()
    
    def _clear_terminal(self):
        """Clear terminal screen."""
        if os.name == "nt":
            os.system("cls")
        else:
            os.system("clear")
    
    def evolve(self, progress: float):
        """Evolve to appropriate stage based on progress."""
        if progress < 10:
            self.render_stage("hatchling", progress)
        elif progress < 80:
            self.render_stage("hunter", progress)
        else:
            self.render_stage("powerhouse", progress)
