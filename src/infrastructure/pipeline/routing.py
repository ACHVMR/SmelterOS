"""
═══════════════════════════════════════════════════════════════════════════════
SmelterOS-ORACLE Pipeline Router
Abstracts House of Alchemist tool routing via Agent Engine or Garden
═══════════════════════════════════════════════════════════════════════════════

The Router class provides MCP-based routing that:
1. Routes queries to Agent Engine resources when deployed
2. Falls back to Agent Garden tools when Agent Engine is unavailable
3. Maintains the House of Alchemist abstraction layer

Usage:
    from src.infrastructure.pipeline.routing import Router
    
    router = Router(project_id="my-project", region="us-central1")
    result = await router.route("CTO: Review this code", ["boomer-cto"])
"""

import os
import json
import asyncio
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass
from enum import Enum
from datetime import datetime


# =============================================================================
# ENUMS & TYPES
# =============================================================================

class RoutingStrategy(Enum):
    """Routing strategy for tool invocation."""
    AGENT_ENGINE = "agent_engine"  # Route to Vertex AI Agent Engine
    AGENT_GARDEN = "agent_garden"  # Route to Agent Garden tools
    LOCAL = "local"                # Route to local implementation
    FALLBACK = "fallback"          # Auto-select based on availability


class MCPConnectorType(Enum):
    """MCP connector types."""
    FIRESTORE = "firestore"
    BIGQUERY = "bigquery"
    CLOUD_STORAGE = "cloud-storage"
    EXTERNAL_API = "external-api"
    STRIPE = "stripe"


@dataclass
class RoutingResult:
    """Result from a routing operation."""
    success: bool
    agent_id: str
    response: Any
    strategy_used: RoutingStrategy
    elapsed_ms: int
    trace: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


# =============================================================================
# MCP CONNECTOR
# =============================================================================

class MCPConnector:
    """
    MCP (Model Context Protocol) connector for external services.
    """
    
    def __init__(self, connector_type: MCPConnectorType, config: Dict[str, Any] = None):
        self.connector_type = connector_type
        self.config = config or {}
        self._client = None
    
    async def connect(self) -> bool:
        """Initialize the connector."""
        try:
            if self.connector_type == MCPConnectorType.FIRESTORE:
                # Initialize Firestore client
                from google.cloud import firestore
                self._client = firestore.AsyncClient(
                    project=self.config.get("project_id")
                )
            elif self.connector_type == MCPConnectorType.BIGQUERY:
                # Initialize BigQuery client
                from google.cloud import bigquery
                self._client = bigquery.Client(
                    project=self.config.get("project_id")
                )
            elif self.connector_type == MCPConnectorType.CLOUD_STORAGE:
                # Initialize GCS client
                from google.cloud import storage
                self._client = storage.Client(
                    project=self.config.get("project_id")
                )
            return True
        except Exception as e:
            print(f"MCP connector error: {e}")
            return False
    
    async def invoke(self, operation: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Invoke an operation on the connector."""
        if not self._client:
            await self.connect()
        
        return {
            "connector": self.connector_type.value,
            "operation": operation,
            "params": params,
            "status": "executed",
            "timestamp": datetime.utcnow().isoformat(),
        }


# =============================================================================
# AGENT ENGINE CLIENT
# =============================================================================

class AgentEngineClient:
    """
    Client for invoking Vertex AI Agent Engine resources.
    """
    
    def __init__(self, project_id: str, region: str = "us-central1"):
        self.project_id = project_id
        self.region = region
        self._deployments: Dict[str, str] = {}
        self._load_deployments()
    
    def _load_deployments(self):
        """Load deployment info from file."""
        try:
            with open("deployments.json", "r") as f:
                data = json.load(f)
                for agent_id, info in data.items():
                    self._deployments[agent_id] = info.get("resource_name", "")
        except (FileNotFoundError, json.JSONDecodeError):
            pass
    
    def is_deployed(self, agent_id: str) -> bool:
        """Check if an agent is deployed to Agent Engine."""
        return agent_id in self._deployments
    
    async def query(
        self, 
        agent_id: str, 
        input: str, 
        context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Query an Agent Engine resource."""
        
        if not self.is_deployed(agent_id):
            raise ValueError(f"Agent {agent_id} not deployed to Agent Engine")
        
        resource_name = self._deployments[agent_id]
        
        # In production, this would call:
        # from vertexai.preview import reasoning_engines
        # agent = reasoning_engines.ReasoningEngine(resource_name)
        # return agent.query(input=input)
        
        # Simulated response
        return {
            "agent_id": agent_id,
            "resource_name": resource_name,
            "response": f"[AgentEngine:{agent_id}] {input}",
            "strategy": "agent_engine",
            "timestamp": datetime.utcnow().isoformat(),
        }


# =============================================================================
# AGENT GARDEN CLIENT
# =============================================================================

class AgentGardenClient:
    """
    Client for invoking Agent Garden tools directly.
    """
    
    AVAILABLE_MODELS = [
        "gemini-2.0-flash",
        "gemini-1.5-pro",
        "claude-3.5-sonnet",
        "llama-3.1-405b",
    ]
    
    def __init__(self, project_id: str, region: str = "us-central1"):
        self.project_id = project_id
        self.region = region
        self.default_model = "gemini-2.0-flash"
    
    async def invoke(
        self,
        tool_name: str,
        params: Dict[str, Any],
        model: str = None
    ) -> Dict[str, Any]:
        """Invoke an Agent Garden tool."""
        
        model = model or self.default_model
        
        # In production, this would call the Vertex AI Generative AI API
        # with the tool configuration
        
        return {
            "tool": tool_name,
            "model": model,
            "params": params,
            "response": f"[Garden:{tool_name}] Executed with {model}",
            "strategy": "agent_garden",
            "timestamp": datetime.utcnow().isoformat(),
        }


# =============================================================================
# HOUSE OF ALCHEMIST REGISTRY
# =============================================================================

class HouseOfAlchemist:
    """
    Registry of all SmelterOS tools (the "House of Alchemist").
    Abstracts tool routing between Agent Engine, Agent Garden, and local.
    """
    
    # Base tools always available
    BASE_TOOLS = {
        "code-review": {"category": "code", "agent": "boomer-cto"},
        "deploy": {"category": "code", "agent": "boomer-cto"},
        "ci-cd": {"category": "code", "agent": "boomer-cto"},
        "refactor": {"category": "code", "agent": "boomer-cto"},
        "content-create": {"category": "content", "agent": "boomer-cmo"},
        "brand-check": {"category": "content", "agent": "boomer-cmo"},
        "ui-design": {"category": "content", "agent": "boomer-cmo"},
        "palette-generate": {"category": "content", "agent": "boomer-cmo"},
        "budget-track": {"category": "finance", "agent": "boomer-cfo"},
        "audit": {"category": "finance", "agent": "boomer-cfo"},
        "forecast": {"category": "finance", "agent": "boomer-cfo"},
        "workflow-automate": {"category": "ops", "agent": "boomer-coo"},
        "process-optimize": {"category": "ops", "agent": "boomer-coo"},
        "product-spec": {"category": "product", "agent": "boomer-cpo"},
        "feature-prioritize": {"category": "product", "agent": "boomer-cpo"},
        "research-deep": {"category": "research", "agent": "rlm-research"},
        "analyze-context": {"category": "research", "agent": "rlm-research"},
        "chunk-aggregate": {"category": "research", "agent": "rlm-research"},
    }
    
    def __init__(self):
        self._registered_tools: Dict[str, Dict[str, Any]] = {}
        self._tool_handlers: Dict[str, Callable] = {}
    
    def register(self, tool_name: str, config: Dict[str, Any], handler: Callable = None):
        """Register a tool."""
        self._registered_tools[tool_name] = config
        if handler:
            self._tool_handlers[tool_name] = handler
    
    def get_tool(self, tool_name: str) -> Optional[Dict[str, Any]]:
        """Get tool configuration."""
        if tool_name in self.BASE_TOOLS:
            return self.BASE_TOOLS[tool_name]
        return self._registered_tools.get(tool_name)
    
    def get_all_tools(self) -> Dict[str, Dict[str, Any]]:
        """Get all registered tools."""
        return {**self.BASE_TOOLS, **self._registered_tools}
    
    def get_tools_for_agent(self, agent_id: str) -> List[str]:
        """Get all tools for a specific agent."""
        all_tools = self.get_all_tools()
        return [
            name for name, config in all_tools.items()
            if config.get("agent") == agent_id
        ]


# =============================================================================
# ROUTER
# =============================================================================

class Router:
    """
    Main router for SmelterOS-ORACLE.
    Routes queries to the appropriate backend based on availability and strategy.
    """
    
    def __init__(
        self,
        project_id: str,
        region: str = "us-central1",
        strategy: RoutingStrategy = RoutingStrategy.FALLBACK
    ):
        self.project_id = project_id
        self.region = region
        self.strategy = strategy
        
        # Initialize clients
        self.agent_engine = AgentEngineClient(project_id, region)
        self.agent_garden = AgentGardenClient(project_id, region)
        self.alchemist = HouseOfAlchemist()
        
        # MCP connectors
        self.mcp_connectors: Dict[str, MCPConnector] = {}
    
    def register_mcp_connector(
        self,
        name: str,
        connector_type: MCPConnectorType,
        config: Dict[str, Any] = None
    ):
        """Register an MCP connector."""
        self.mcp_connectors[name] = MCPConnector(connector_type, config)
    
    async def route(
        self,
        query: str,
        agents: List[str],
        context: Dict[str, Any] = None,
        strategy: RoutingStrategy = None
    ) -> RoutingResult:
        """
        Route a query to the appropriate agent(s).
        
        Args:
            query: The query/command to execute
            agents: List of agent IDs to route to
            context: Optional context for the query
            strategy: Override the default routing strategy
        """
        strategy = strategy or self.strategy
        start_time = datetime.utcnow()
        
        primary_agent = agents[0] if agents else "acheevy"
        
        try:
            if strategy == RoutingStrategy.AGENT_ENGINE:
                result = await self._route_to_agent_engine(primary_agent, query, context)
            elif strategy == RoutingStrategy.AGENT_GARDEN:
                result = await self._route_to_agent_garden(primary_agent, query, context)
            elif strategy == RoutingStrategy.LOCAL:
                result = await self._route_local(primary_agent, query, context)
            else:
                # Fallback: try Agent Engine first, then Garden
                result = await self._route_fallback(primary_agent, query, context)
            
            elapsed_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            return RoutingResult(
                success=True,
                agent_id=primary_agent,
                response=result,
                strategy_used=strategy,
                elapsed_ms=elapsed_ms,
                trace={"query": query, "agents": agents, "context": context},
            )
            
        except Exception as e:
            elapsed_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            return RoutingResult(
                success=False,
                agent_id=primary_agent,
                response=None,
                strategy_used=strategy,
                elapsed_ms=elapsed_ms,
                error=str(e),
            )
    
    async def _route_to_agent_engine(
        self,
        agent_id: str,
        query: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Route to Agent Engine."""
        return await self.agent_engine.query(agent_id, query, context)
    
    async def _route_to_agent_garden(
        self,
        agent_id: str,
        query: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Route to Agent Garden."""
        tools = self.alchemist.get_tools_for_agent(agent_id)
        
        # Invoke with first matching tool
        tool_name = tools[0] if tools else "general-query"
        return await self.agent_garden.invoke(tool_name, {"query": query, "context": context})
    
    async def _route_local(
        self,
        agent_id: str,
        query: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Route to local implementation."""
        return {
            "agent_id": agent_id,
            "response": f"[Local:{agent_id}] {query}",
            "strategy": "local",
            "timestamp": datetime.utcnow().isoformat(),
        }
    
    async def _route_fallback(
        self,
        agent_id: str,
        query: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Fallback routing: Agent Engine -> Agent Garden -> Local."""
        
        # Try Agent Engine first
        if self.agent_engine.is_deployed(agent_id):
            try:
                return await self._route_to_agent_engine(agent_id, query, context)
            except Exception:
                pass
        
        # Fall back to Agent Garden
        try:
            return await self._route_to_agent_garden(agent_id, query, context)
        except Exception:
            pass
        
        # Last resort: local
        return await self._route_local(agent_id, query, context)
    
    async def invoke_tool(
        self,
        tool_name: str,
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Invoke a House of Alchemist tool directly.
        """
        tool_config = self.alchemist.get_tool(tool_name)
        
        if not tool_config:
            raise ValueError(f"Unknown tool: {tool_name}")
        
        agent_id = tool_config.get("agent", "acheevy")
        
        return await self.route(
            query=f"Execute tool: {tool_name}",
            agents=[agent_id],
            context={"tool": tool_name, "params": params}
        )
    
    async def invoke_mcp(
        self,
        connector_name: str,
        operation: str,
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Invoke an MCP connector operation.
        """
        if connector_name not in self.mcp_connectors:
            raise ValueError(f"Unknown MCP connector: {connector_name}")
        
        connector = self.mcp_connectors[connector_name]
        return await connector.invoke(operation, params)


# =============================================================================
# FACTORY FUNCTION
# =============================================================================

def create_router(
    project_id: str = None,
    region: str = "us-central1",
    strategy: RoutingStrategy = RoutingStrategy.FALLBACK
) -> Router:
    """
    Create a configured Router instance.
    
    Args:
        project_id: GCP project ID (defaults to env var or auto-detect)
        region: GCP region
        strategy: Default routing strategy
    
    Returns:
        Configured Router instance
    """
    project_id = project_id or os.environ.get("GOOGLE_CLOUD_PROJECT", "gen-lang-client-0618301038")
    
    router = Router(project_id, region, strategy)
    
    # Register default MCP connectors
    router.register_mcp_connector(
        "firestore",
        MCPConnectorType.FIRESTORE,
        {"project_id": project_id}
    )
    router.register_mcp_connector(
        "bigquery",
        MCPConnectorType.BIGQUERY,
        {"project_id": project_id}
    )
    router.register_mcp_connector(
        "cloud-storage",
        MCPConnectorType.CLOUD_STORAGE,
        {"project_id": project_id}
    )
    
    return router


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "Router",
    "RoutingStrategy",
    "RoutingResult",
    "MCPConnector",
    "MCPConnectorType",
    "AgentEngineClient",
    "AgentGardenClient",
    "HouseOfAlchemist",
    "create_router",
]
