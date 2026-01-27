"""
Chicken Hawk ADK Integration - Memory Manager

Context tracking and session memory for multi-agent workflows.
Provides short-term, long-term, and semantic memory capabilities.
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
import json
import logging

logger = logging.getLogger("chickenhawk.memory")


@dataclass
class MemoryEntry:
    """A single memory entry."""
    id: str
    content: str
    entry_type: str  # "message", "tool_call", "observation", "plan"
    agent: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.now)
    metadata: Dict[str, Any] = field(default_factory=dict)
    embedding: Optional[List[float]] = None
    importance: float = 0.5  # 0-1 scale


@dataclass
class ConversationContext:
    """Context for a conversation session."""
    session_id: str
    user_id: str
    started_at: datetime
    entries: List[MemoryEntry] = field(default_factory=list)
    summary: Optional[str] = None
    active_agents: List[str] = field(default_factory=list)


class MemoryManager:
    """
    Manages multi-layer memory for Chicken Hawk agents.
    
    Memory Layers:
    1. Working Memory - Current conversation context
    2. Short-Term Memory - Recent interactions (last 50)
    3. Long-Term Memory - Compressed historical knowledge
    4. Semantic Memory - Embedding-based retrieval
    """
    
    def __init__(
        self,
        max_working: int = 20,
        max_short_term: int = 100,
        max_long_term: int = 1000,
    ):
        self.max_working = max_working
        self.max_short_term = max_short_term
        self.max_long_term = max_long_term
        
        self.working_memory: List[MemoryEntry] = []
        self.short_term: List[MemoryEntry] = []
        self.long_term: List[Dict[str, Any]] = []
        
        self._sessions: Dict[str, ConversationContext] = {}
        self._entry_counter = 0
    
    def _generate_id(self) -> str:
        """Generate a unique entry ID."""
        self._entry_counter += 1
        return f"mem_{self._entry_counter:06d}"
    
    def add(
        self,
        content: str,
        entry_type: str = "message",
        agent: Optional[str] = None,
        importance: float = 0.5,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> MemoryEntry:
        """Add an entry to working memory."""
        entry = MemoryEntry(
            id=self._generate_id(),
            content=content,
            entry_type=entry_type,
            agent=agent,
            importance=importance,
            metadata=metadata or {},
        )
        
        self.working_memory.append(entry)
        
        # Overflow to short-term
        if len(self.working_memory) > self.max_working:
            overflow = self.working_memory.pop(0)
            self._promote_to_short_term(overflow)
        
        return entry
    
    def _promote_to_short_term(self, entry: MemoryEntry) -> None:
        """Move entry from working to short-term memory."""
        self.short_term.append(entry)
        
        # Overflow to long-term
        if len(self.short_term) > self.max_short_term:
            overflow = self.short_term.pop(0)
            self._compress_to_long_term(overflow)
    
    def _compress_to_long_term(self, entry: MemoryEntry) -> None:
        """Compress and store entry in long-term memory."""
        compressed = {
            "id": entry.id,
            "summary": entry.content[:200] if len(entry.content) > 200 else entry.content,
            "type": entry.entry_type,
            "agent": entry.agent,
            "timestamp": entry.timestamp.isoformat(),
            "importance": entry.importance,
        }
        
        self.long_term.append(compressed)
        
        # Trim long-term if needed
        if len(self.long_term) > self.max_long_term:
            # Remove least important entries
            self.long_term.sort(key=lambda x: x.get("importance", 0))
            self.long_term = self.long_term[len(self.long_term) - self.max_long_term:]
    
    def get_context(self, max_entries: int = 10, include_short_term: bool = False) -> List[Dict]:
        """Get recent context for agent prompts."""
        entries = list(self.working_memory)
        
        if include_short_term and len(entries) < max_entries:
            needed = max_entries - len(entries)
            entries = self.short_term[-needed:] + entries
        
        return [
            {
                "id": e.id,
                "content": e.content,
                "type": e.entry_type,
                "agent": e.agent,
                "timestamp": e.timestamp.isoformat(),
            }
            for e in entries[-max_entries:]
        ]
    
    def search(self, query: str, top_k: int = 5) -> List[Dict]:
        """
        Search memory for relevant entries.
        
        STUB: In production, use embeddings for semantic search.
        """
        results = []
        query_lower = query.lower()
        
        # Simple keyword search across all memory layers
        all_entries = (
            [(e, "working") for e in self.working_memory] +
            [(e, "short_term") for e in self.short_term]
        )
        
        for entry, layer in all_entries:
            if query_lower in entry.content.lower():
                results.append({
                    "id": entry.id,
                    "content": entry.content,
                    "layer": layer,
                    "relevance": 1.0 if query_lower == entry.content.lower() else 0.5,
                })
        
        # Also search long-term
        for lt_entry in self.long_term:
            if query_lower in lt_entry.get("summary", "").lower():
                results.append({
                    "id": lt_entry["id"],
                    "content": lt_entry["summary"],
                    "layer": "long_term",
                    "relevance": 0.3,
                })
        
        results.sort(key=lambda x: x["relevance"], reverse=True)
        return results[:top_k]
    
    def create_session(self, session_id: str, user_id: str) -> ConversationContext:
        """Create a new conversation session."""
        context = ConversationContext(
            session_id=session_id,
            user_id=user_id,
            started_at=datetime.now(),
        )
        self._sessions[session_id] = context
        return context
    
    def get_session(self, session_id: str) -> Optional[ConversationContext]:
        """Get an existing session."""
        return self._sessions.get(session_id)
    
    def add_to_session(
        self,
        session_id: str,
        content: str,
        entry_type: str = "message",
        agent: Optional[str] = None,
    ) -> Optional[MemoryEntry]:
        """Add an entry to a specific session."""
        session = self._sessions.get(session_id)
        if not session:
            return None
        
        entry = self.add(content, entry_type, agent)
        session.entries.append(entry)
        
        if agent and agent not in session.active_agents:
            session.active_agents.append(agent)
        
        return entry
    
    def summarize_session(self, session_id: str) -> Optional[str]:
        """Generate a summary of a session (stub)."""
        session = self._sessions.get(session_id)
        if not session:
            return None
        
        # STUB: In production, use LLM to generate summary
        entry_count = len(session.entries)
        agents = ", ".join(session.active_agents) or "none"
        
        summary = f"Session with {entry_count} entries. Active agents: {agents}."
        session.summary = summary
        return summary
    
    def clear_working_memory(self) -> None:
        """Clear working memory (moves all to short-term)."""
        for entry in self.working_memory:
            self._promote_to_short_term(entry)
        self.working_memory = []
    
    def get_stats(self) -> Dict[str, Any]:
        """Get memory statistics."""
        return {
            "working_memory": len(self.working_memory),
            "short_term": len(self.short_term),
            "long_term": len(self.long_term),
            "sessions": len(self._sessions),
            "total_entries": self._entry_counter,
        }
    
    def export(self) -> Dict[str, Any]:
        """Export memory state for persistence."""
        return {
            "working_memory": [
                {
                    "id": e.id,
                    "content": e.content,
                    "type": e.entry_type,
                    "agent": e.agent,
                    "timestamp": e.timestamp.isoformat(),
                    "importance": e.importance,
                }
                for e in self.working_memory
            ],
            "short_term": [
                {
                    "id": e.id,
                    "content": e.content,
                    "type": e.entry_type,
                    "agent": e.agent,
                    "timestamp": e.timestamp.isoformat(),
                    "importance": e.importance,
                }
                for e in self.short_term
            ],
            "long_term": self.long_term,
            "stats": self.get_stats(),
        }
