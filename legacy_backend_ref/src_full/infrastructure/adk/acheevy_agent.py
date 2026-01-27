"""
═══════════════════════════════════════════════════════════════════════════════
SmelterOS-ORACLE ADK-Compatible Agent (Python)
For deployment to Vertex AI Agent Engine via Reasoning Engines
═══════════════════════════════════════════════════════════════════════════════

This module provides ADK-compliant agent classes that can be deployed to
Vertex AI Agent Engine. Each agent implements the `query()` method required
by the ReasoningEngine.create() API.

Key Components:
- AcheevyAgent: Prime orchestrator with intent routing
- BoomerAgent: C-Suite execution agents (CTO, CMO, CFO, COO, CPO)
- RLMResearchAgent: Recursive context handling for large documents
- Router integration for House of Alchemist abstraction

Usage:
    from src.infrastructure.adk.acheevy_agent import AcheevyAgent
    
    agent = AcheevyAgent()
    result = agent.query("CTO: Review this deployment plan")
"""

import os
import asyncio
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

# Import Router for House of Alchemist integration
try:
    from src.infrastructure.pipeline.routing import Router, RoutingStrategy, create_router
    ROUTER_AVAILABLE = True
except ImportError:
    ROUTER_AVAILABLE = False


# =============================================================================
# ENUMS & TYPES
# =============================================================================

class ReasoningMode(Enum):
    """Reasoning modes for agents."""
    CHAIN_OF_THOUGHT = "chain-of-thought"
    REACT = "react"
    PLAN_AND_EXECUTE = "plan-and-execute"
    REFLEXION = "reflexion"


class FDHPhase(Enum):
    """Foster-Develop-Hone phases."""
    FOSTER = "foster"
    DEVELOP = "develop"
    HONE = "hone"


class AgentLayer(Enum):
    """ORACLE agent layers."""
    NLP = "nlp"
    LOGIC = "logic"
    ORCHESTRATION = "orchestration"
    EXECUTION = "execution"


@dataclass
class AgentConfig:
    """Configuration for an ADK agent."""
    agent_id: str
    display_name: str
    description: str
    model: str = "gemini-2.0-flash"
    layer: AgentLayer = AgentLayer.EXECUTION
    fdh_phase: FDHPhase = FDHPhase.DEVELOP
    virtue_weight: float = 0.10
    capabilities: List[str] = field(default_factory=list)
    reasoning_mode: ReasoningMode = ReasoningMode.CHAIN_OF_THOUGHT


@dataclass
class QueryResult:
    """Result from an agent query."""
    agent_id: str
    response: str
    model: str
    reasoning_trace: List[str] = field(default_factory=list)
    delegations: List[Dict[str, Any]] = field(default_factory=list)
    elapsed_ms: int = 0
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())


# =============================================================================
# AGENT CONFIGURATIONS
# =============================================================================

AGENT_CONFIGS: Dict[str, AgentConfig] = {
    "acheevy": AgentConfig(
        agent_id="acheevy",
        display_name="acheevy-orchestrator",
        description="SmelterOS-ORACLE Prime Orchestrator",
        model="gemini-2.0-flash",
        layer=AgentLayer.NLP,
        fdh_phase=FDHPhase.FOSTER,
        virtue_weight=0.30,
        capabilities=["intent-routing", "delegation", "velocity-driver", "budget-ledger"],
        reasoning_mode=ReasoningMode.PLAN_AND_EXECUTE,
    ),
    "boomer-cto": AgentConfig(
        agent_id="boomer-cto",
        display_name="boomer-cto-engine",
        description="Code review, deployment, CI/CD, architecture",
        model="gemini-2.0-flash",
        layer=AgentLayer.EXECUTION,
        fdh_phase=FDHPhase.DEVELOP,
        virtue_weight=0.20,
        capabilities=["code-review", "deployment", "ci-cd", "architecture", "git", "docker"],
    ),
    "boomer-cmo": AgentConfig(
        agent_id="boomer-cmo",
        display_name="boomer-cmo-engine",
        description="Content creation, branding, UI design, palette",
        model="gemini-2.0-flash",
        layer=AgentLayer.EXECUTION,
        fdh_phase=FDHPhase.DEVELOP,
        virtue_weight=0.10,
        capabilities=["content-creation", "branding", "campaigns", "ui-design", "palette"],
    ),
    "boomer-cfo": AgentConfig(
        agent_id="boomer-cfo",
        display_name="boomer-cfo-engine",
        description="Budget tracking, forecasting, audit, ethics gate",
        model="gemini-2.0-flash",
        layer=AgentLayer.EXECUTION,
        fdh_phase=FDHPhase.HONE,
        virtue_weight=0.05,
        capabilities=["budget-tracking", "forecasting", "billing", "audit", "ethics-gate"],
    ),
    "boomer-coo": AgentConfig(
        agent_id="boomer-coo",
        display_name="boomer-coo-engine",
        description="Workflow automation, process optimization, verification",
        model="gemini-2.0-flash",
        layer=AgentLayer.ORCHESTRATION,
        fdh_phase=FDHPhase.HONE,
        virtue_weight=0.15,
        capabilities=["workflow-automation", "process-optimization", "logistics", "reflective-validation"],
    ),
    "boomer-cpo": AgentConfig(
        agent_id="boomer-cpo",
        display_name="boomer-cpo-engine",
        description="Product specs, user research, feature prioritization",
        model="gemini-2.0-flash",
        layer=AgentLayer.EXECUTION,
        fdh_phase=FDHPhase.DEVELOP,
        virtue_weight=0.05,
        capabilities=["product-specs", "user-research", "feature-prioritization", "cot-viz"],
    ),
    "rlm-research": AgentConfig(
        agent_id="rlm-research",
        display_name="rlm-research-engine",
        description="Recursive context handling for >128k tokens",
        model="gemini-1.5-pro",
        layer=AgentLayer.LOGIC,
        fdh_phase=FDHPhase.FOSTER,
        virtue_weight=0.15,
        capabilities=["chunking", "aggregation", "deep-analysis", "recursive-reasoning", "10M-context"],
        reasoning_mode=ReasoningMode.REFLEXION,
    ),
}


# =============================================================================
# BASE AGENT CLASS
# =============================================================================

class BaseAgent:
    """
    Base class for ADK-compatible agents.
    Implements the query() method required by Vertex AI Agent Engine.
    """
    
    def __init__(self, config: AgentConfig, router: Optional['Router'] = None):
        self.config = config
        self.agent_id = config.agent_id
        self.model = config.model
        self.capabilities = config.capabilities
        self.reasoning_mode = config.reasoning_mode
        
        # Router for House of Alchemist integration
        self.router = router
        if ROUTER_AVAILABLE and router is None:
            try:
                self.router = create_router()
            except Exception:
                pass
        
        # Reasoning trace
        self._trace: List[str] = []
    
    def set_model(self, model: str):
        """Set the model to use."""
        self.model = model
    
    def _log_trace(self, message: str):
        """Add a message to the reasoning trace."""
        self._trace.append(f"[{datetime.utcnow().isoformat()}] {message}")
    
    def query(self, input: str, config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Main query method - required by Vertex AI Agent Engine.
        
        Args:
            input: The query string
            config: Optional configuration dict
        
        Returns:
            Dict with response, trace, and metadata
        """
        start_time = datetime.utcnow()
        self._trace = []
        
        self._log_trace(f"Query received: {input[:100]}...")
        self._log_trace(f"Agent: {self.agent_id}, Model: {self.model}")
        
        # Process the query (override in subclasses)
        result = self._process(input, config or {})
        
        elapsed_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        
        return {
            "agent_id": self.agent_id,
            "response": result.get("response", ""),
            "model": self.model,
            "reasoning_trace": self._trace,
            "elapsed_ms": elapsed_ms,
            "timestamp": datetime.utcnow().isoformat(),
            **result,
        }
    
    def _process(self, input: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Process the query - override in subclasses."""
        return {"response": f"[{self.agent_id}] {input}"}


# =============================================================================
# ACHEEVY AGENT (ORCHESTRATOR)
# =============================================================================

class AcheevyAgent(BaseAgent):
    """
    Prime orchestrator agent.
    Routes queries to appropriate specialist agents based on intent.
    """
    
    # Intent routing patterns
    INTENT_PATTERNS = {
        "code": {
            "keywords": ["code", "refactor", "deploy", "ci/cd", "git", "docker", "build", "test"],
            "delegate_to": "boomer-cto",
        },
        "design": {
            "keywords": ["ui", "brand", "palette", "design", "color", "style", "logo"],
            "delegate_to": "boomer-cmo",
        },
        "finance": {
            "keywords": ["budget", "audit", "cost", "billing", "forecast", "spend"],
            "delegate_to": "boomer-cfo",
        },
        "operations": {
            "keywords": ["workflow", "ops", "process", "automate", "optimize", "logistics"],
            "delegate_to": "boomer-coo",
        },
        "product": {
            "keywords": ["spec", "product", "feature", "prioritize", "roadmap", "user"],
            "delegate_to": "boomer-cpo",
        },
        "research": {
            "keywords": ["research", "analyze", "deep", "investigate", "study", "context"],
            "delegate_to": "rlm-research",
        },
    }
    
    def __init__(self, router: Optional['Router'] = None):
        super().__init__(AGENT_CONFIGS["acheevy"], router)
        self._delegations: List[Dict[str, Any]] = []
    
    def _classify_intent(self, input: str) -> Tuple[str, Optional[str]]:
        """Classify the intent of the input."""
        input_lower = input.lower()
        
        # Check for explicit C-Suite prefix
        prefixes = {
            "cto:": "boomer-cto",
            "cmo:": "boomer-cmo",
            "cfo:": "boomer-cfo",
            "coo:": "boomer-coo",
            "cpo:": "boomer-cpo",
        }
        for prefix, agent in prefixes.items():
            if input_lower.startswith(prefix):
                return "explicit", agent
        
        # Pattern matching
        for intent_type, config in self.INTENT_PATTERNS.items():
            if any(kw in input_lower for kw in config["keywords"]):
                return intent_type, config["delegate_to"]
        
        return "general", None
    
    def _delegate(self, agent_id: str, input: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Delegate to another agent."""
        self._log_trace(f"Delegating to {agent_id}")
        
        delegation = {
            "from": self.agent_id,
            "to": agent_id,
            "input": input,
            "timestamp": datetime.utcnow().isoformat(),
        }
        self._delegations.append(delegation)
        
        # Use Router if available
        if self.router and ROUTER_AVAILABLE:
            try:
                # Run async route in sync context
                loop = asyncio.new_event_loop()
                result = loop.run_until_complete(
                    self.router.route(input, [agent_id], config)
                )
                loop.close()
                
                return {
                    "response": result.response,
                    "delegated_to": agent_id,
                    "strategy": result.strategy_used.value,
                }
            except Exception as e:
                self._log_trace(f"Router error: {e}, using local delegation")
        
        # Local delegation (simulated)
        agent_class = AGENT_FACTORIES.get(agent_id)
        if agent_class:
            agent = agent_class(self.router)
            return agent.query(input, config)
        
        return {
            "response": f"[{self.agent_id} → {agent_id}] {input}",
            "delegated_to": agent_id,
        }
    
    def _process(self, input: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Process as orchestrator."""
        self._delegations = []
        
        # Classify intent
        intent_type, delegate_to = self._classify_intent(input)
        self._log_trace(f"Intent: {intent_type}, Delegate: {delegate_to or 'self'}")
        
        # Delegate if needed
        if delegate_to:
            result = self._delegate(delegate_to, input, config)
            result["intent"] = intent_type
            result["delegations"] = self._delegations
            return result
        
        # Handle locally
        return {
            "response": f"[acheevy] Orchestrated: {input}",
            "intent": intent_type,
            "delegations": [],
        }


# =============================================================================
# BOOMER AGENTS (C-SUITE)
# =============================================================================

class BoomerAgent(BaseAgent):
    """
    Boomer C-Suite execution agent.
    Specializes in a specific domain (CTO, CMO, CFO, COO, CPO).
    """
    
    def __init__(self, role: str, router: Optional['Router'] = None):
        agent_id = f"boomer-{role}"
        if agent_id not in AGENT_CONFIGS:
            raise ValueError(f"Unknown Boomer role: {role}")
        
        super().__init__(AGENT_CONFIGS[agent_id], router)
        self.role = role
    
    def _process(self, input: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Process as specialist agent."""
        self._log_trace(f"Executing as {self.role}")
        
        # In production, this would invoke the actual LLM
        # For now, return structured response
        return {
            "response": f"[{self.agent_id}] Executed: {input}",
            "role": self.role,
            "capabilities_used": self._match_capabilities(input),
        }
    
    def _match_capabilities(self, input: str) -> List[str]:
        """Match input to relevant capabilities."""
        input_lower = input.lower()
        return [cap for cap in self.capabilities if cap.replace("-", " ") in input_lower or cap in input_lower]


class BoomerCTO(BoomerAgent):
    """CTO agent for code and infrastructure."""
    def __init__(self, router: Optional['Router'] = None):
        super().__init__("cto", router)


class BoomerCMO(BoomerAgent):
    """CMO agent for content and design."""
    def __init__(self, router: Optional['Router'] = None):
        super().__init__("cmo", router)


class BoomerCFO(BoomerAgent):
    """CFO agent for finance and audit."""
    def __init__(self, router: Optional['Router'] = None):
        super().__init__("cfo", router)


class BoomerCOO(BoomerAgent):
    """COO agent for operations."""
    def __init__(self, router: Optional['Router'] = None):
        super().__init__("coo", router)


class BoomerCPO(BoomerAgent):
    """CPO agent for product."""
    def __init__(self, router: Optional['Router'] = None):
        super().__init__("cpo", router)


# =============================================================================
# RLM RESEARCH AGENT
# =============================================================================

class RLMResearchAgent(BaseAgent):
    """
    Recursive context research agent.
    Handles large documents (>128k tokens) with chunking and aggregation.
    """
    
    MAX_CHUNK_SIZE = 100000  # tokens
    
    def __init__(self, router: Optional['Router'] = None):
        super().__init__(AGENT_CONFIGS["rlm-research"], router)
    
    def _process(self, input: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Process with recursive reasoning."""
        documents = config.get("documents", [])
        
        self._log_trace(f"Processing {len(documents)} documents")
        
        # Chunk large documents
        chunks = self._chunk_documents(documents)
        self._log_trace(f"Split into {len(chunks)} chunks")
        
        # Process each chunk (in production, parallel LLM calls)
        chunk_results = []
        for i, chunk in enumerate(chunks):
            self._log_trace(f"Processing chunk {i + 1}/{len(chunks)}")
            chunk_results.append({
                "chunk_id": i,
                "summary": f"Chunk {i} analysis complete",
            })
        
        # Aggregate results
        self._log_trace("Aggregating results")
        
        return {
            "response": f"[rlm-research] Analyzed: {input}",
            "documents_processed": len(documents),
            "chunks_processed": len(chunks),
            "reasoning_mode": self.reasoning_mode.value,
        }
    
    def _chunk_documents(self, documents: List[str]) -> List[str]:
        """Chunk documents for processing."""
        chunks = []
        for doc in documents:
            # Simple chunking by character count (in production, use token count)
            if len(doc) > self.MAX_CHUNK_SIZE:
                for i in range(0, len(doc), self.MAX_CHUNK_SIZE):
                    chunks.append(doc[i:i + self.MAX_CHUNK_SIZE])
            else:
                chunks.append(doc)
        return chunks if chunks else [""]


# =============================================================================
# AGENT FACTORY
# =============================================================================

AGENT_FACTORIES: Dict[str, type] = {
    "acheevy": AcheevyAgent,
    "boomer-cto": BoomerCTO,
    "boomer-cmo": BoomerCMO,
    "boomer-cfo": BoomerCFO,
    "boomer-coo": BoomerCOO,
    "boomer-cpo": BoomerCPO,
    "rlm-research": RLMResearchAgent,
}


def create_agent(agent_id: str, router: Optional['Router'] = None) -> BaseAgent:
    """
    Factory function to create an agent by ID.
    
    Args:
        agent_id: The agent ID (e.g., "acheevy", "boomer-cto")
        router: Optional Router instance for House of Alchemist
    
    Returns:
        Configured agent instance
    """
    if agent_id not in AGENT_FACTORIES:
        raise ValueError(f"Unknown agent: {agent_id}. Available: {list(AGENT_FACTORIES.keys())}")
    
    return AGENT_FACTORIES[agent_id](router)


def get_all_agents(router: Optional['Router'] = None) -> Dict[str, BaseAgent]:
    """Get all agent instances."""
    return {
        agent_id: factory(router)
        for agent_id, factory in AGENT_FACTORIES.items()
    }


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    # Base classes
    "BaseAgent",
    "AgentConfig",
    "QueryResult",
    
    # Agent classes
    "AcheevyAgent",
    "BoomerAgent",
    "BoomerCTO",
    "BoomerCMO",
    "BoomerCFO",
    "BoomerCOO",
    "BoomerCPO",
    "RLMResearchAgent",
    
    # Enums
    "ReasoningMode",
    "FDHPhase",
    "AgentLayer",
    
    # Factory
    "create_agent",
    "get_all_agents",
    "AGENT_CONFIGS",
    "AGENT_FACTORIES",
]
