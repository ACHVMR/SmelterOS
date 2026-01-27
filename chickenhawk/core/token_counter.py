"""
TOKEN COUNTER — Context Budget Tracker
═════════════════════════════════════════════════════════════════════════
Tracks token usage to enforce the 70% context rule.
"""

import logging

logger = logging.getLogger("chicken_hawk.token_counter")


class TokenCounter:
    """Tracks token usage for context budget management."""
    
    def __init__(self, max_tokens: int = 128000):
        self.max_tokens = max_tokens
        self.current_tokens = 0
        self.context_buffer = ""
    
    def add(self, text: str) -> int:
        """Add text to context and return new token count."""
        tokens = self._estimate_tokens(text)
        self.current_tokens += tokens
        self.context_buffer += text
        return self.current_tokens
    
    def get_usage_ratio(self) -> float:
        """Get current usage as ratio of max."""
        return self.current_tokens / self.max_tokens if self.max_tokens > 0 else 0
    
    def get_usage(self) -> int:
        """Get current token count."""
        return self.current_tokens
    
    def get_context(self) -> str:
        """Get current context buffer."""
        return self.context_buffer
    
    def reset(self):
        """Reset token counter."""
        self.current_tokens = 0
        self.context_buffer = ""
    
    def reset_with_summary(self, summary: str):
        """Reset and inject summary."""
        self.reset()
        self.add(summary)
        logger.info(f"Context reset with summary ({self.current_tokens} tokens)")
    
    def _estimate_tokens(self, text: str) -> int:
        """Estimate tokens (roughly 4 chars per token)."""
        return len(text) // 4
    
    def should_distill(self, threshold: float = 0.70) -> bool:
        """Check if distillation should be triggered."""
        return self.get_usage_ratio() > threshold
