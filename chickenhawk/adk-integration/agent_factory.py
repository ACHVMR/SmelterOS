"""
Chicken Hawk ADK Integration - Agent Factory

Multi-agent orchestration using Google's Agent Development Kit pattern.
Provides model-agnostic agent creation and workflow orchestration.
"""

from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass, field
from enum import Enum
import asyncio
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("chickenhawk.adk")


class AgentCapability(Enum):
    RESEARCH = "research"
    CODE = "code"
    WRITE = "write"
    ANALYZE = "analyze"
    EXECUTE = "execute"
    ORCHESTRATE = "orchestrate"


@dataclass
class Tool:
    """Represents a tool that an agent can use."""
    name: str
    description: str
    handler: Callable
    parameters: Dict[str, Any] = field(default_factory=dict)
    requires_approval: bool = False


@dataclass
class Agent:
    """Represents an AI agent with specific capabilities."""
    name: str
    model: str
    capabilities: List[AgentCapability]
    tools: List[Tool] = field(default_factory=list)
    system_prompt: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 4096


@dataclass
class AgentMessage:
    """Message in an agent conversation."""
    role: str  # "user", "assistant", "system", "tool"
    content: str
    agent_name: Optional[str] = None
    tool_calls: Optional[List[Dict]] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


class ToolRegistry:
    """Central registry for all available tools across modules."""
    
    def __init__(self):
        self._tools: Dict[str, Tool] = {}
        self._module_tools: Dict[str, List[str]] = {}
    
    def register(self, tool: Tool, module: str = "core") -> None:
        self._tools[tool.name] = tool
        if module not in self._module_tools:
            self._module_tools[module] = []
        self._module_tools[module].append(tool.name)
        logger.info(f"Registered tool: {tool.name} (module: {module})")
    
    def get(self, name: str) -> Optional[Tool]:
        return self._tools.get(name)
    
    def get_by_module(self, module: str) -> List[Tool]:
        tool_names = self._module_tools.get(module, [])
        return [self._tools[name] for name in tool_names if name in self._tools]
    
    def list_all(self) -> List[str]:
        return list(self._tools.keys())


class AgentFactory:
    """Factory for creating and configuring agents."""
    
    def __init__(self, tool_registry: ToolRegistry):
        self.tool_registry = tool_registry
        self._agent_templates: Dict[str, Agent] = {}
        self._setup_default_templates()
    
    def _setup_default_templates(self) -> None:
        """Set up default agent templates for common use cases."""
        self._agent_templates["researcher"] = Agent(
            name="researcher",
            model="gemini-2.0-flash",
            capabilities=[AgentCapability.RESEARCH, AgentCapability.ANALYZE],
            system_prompt="You are a research agent specializing in deep web research and analysis.",
            temperature=0.3,
        )
        
        self._agent_templates["coder"] = Agent(
            name="coder",
            model="claude-3-5-sonnet",
            capabilities=[AgentCapability.CODE, AgentCapability.ANALYZE],
            system_prompt="You are a coding agent specializing in software development.",
            temperature=0.2,
        )
        
        self._agent_templates["writer"] = Agent(
            name="writer",
            model="gpt-4o",
            capabilities=[AgentCapability.WRITE],
            system_prompt="You are a writing agent specializing in content creation.",
            temperature=0.7,
        )
        
        self._agent_templates["orchestrator"] = Agent(
            name="orchestrator",
            model="gemini-2.0-flash",
            capabilities=[AgentCapability.ORCHESTRATE],
            system_prompt="You are an orchestrator agent that coordinates other agents.",
            temperature=0.1,
        )
    
    def create_from_template(self, template_name: str, **overrides) -> Agent:
        """Create an agent from a template with optional overrides."""
        if template_name not in self._agent_templates:
            raise ValueError(f"Unknown template: {template_name}")
        
        template = self._agent_templates[template_name]
        agent_dict = {
            "name": template.name,
            "model": template.model,
            "capabilities": template.capabilities.copy(),
            "tools": template.tools.copy(),
            "system_prompt": template.system_prompt,
            "temperature": template.temperature,
            "max_tokens": template.max_tokens,
        }
        agent_dict.update(overrides)
        return Agent(**agent_dict)
    
    def create_custom(self, name: str, model: str, capabilities: List[str], **kwargs) -> Agent:
        """Create a custom agent."""
        caps = [AgentCapability(c) for c in capabilities]
        return Agent(name=name, model=model, capabilities=caps, **kwargs)


class AgentLoop:
    """Manages multi-agent conversation loops and orchestration."""
    
    def __init__(self, agents: Dict[str, Agent], memory_limit: int = 100):
        self.agents = agents
        self.memory: List[AgentMessage] = []
        self.memory_limit = memory_limit
        self._active_agent: Optional[str] = None
    
    async def run(self, user_request: str) -> Dict[str, Any]:
        """Execute a multi-agent workflow for the given request."""
        logger.info(f"Starting agent loop for: {user_request[:50]}...")
        
        # Add user message to memory
        self.memory.append(AgentMessage(role="user", content=user_request))
        
        # Determine which agent should handle this
        primary_agent = self._select_agent(user_request)
        self._active_agent = primary_agent.name
        
        # Execute agent workflow
        result = await self._execute_agent(primary_agent, user_request)
        
        # Trim memory if needed
        if len(self.memory) > self.memory_limit:
            self.memory = self.memory[-self.memory_limit:]
        
        return {
            "success": True,
            "agent": primary_agent.name,
            "result": result,
            "turns": len(self.memory),
        }
    
    def _select_agent(self, request: str) -> Agent:
        """Select the most appropriate agent for the request."""
        request_lower = request.lower()
        
        # Simple keyword-based selection
        if any(kw in request_lower for kw in ["research", "search", "find", "look up"]):
            return self.agents.get("researcher", list(self.agents.values())[0])
        elif any(kw in request_lower for kw in ["code", "program", "build", "fix", "debug"]):
            return self.agents.get("coder", list(self.agents.values())[0])
        elif any(kw in request_lower for kw in ["write", "draft", "compose", "create content"]):
            return self.agents.get("writer", list(self.agents.values())[0])
        
        # Default to orchestrator or first available
        return self.agents.get("orchestrator", list(self.agents.values())[0])
    
    async def _execute_agent(self, agent: Agent, request: str) -> str:
        """Execute an agent's response (stub - would call LLM in production)."""
        # STUB: In production, this would call the actual LLM via LiteLLM
        logger.info(f"Executing agent: {agent.name} with model: {agent.model}")
        
        response = f"[{agent.name}] Processed request with {len(agent.tools)} tools available."
        
        self.memory.append(AgentMessage(
            role="assistant",
            content=response,
            agent_name=agent.name,
        ))
        
        return response
    
    def get_context(self, max_messages: int = 10) -> List[Dict]:
        """Get recent conversation context."""
        recent = self.memory[-max_messages:]
        return [{"role": m.role, "content": m.content, "agent": m.agent_name} for m in recent]


class MemoryManager:
    """Manages long-term and short-term memory for agents."""
    
    def __init__(self, max_short_term: int = 50, max_long_term: int = 1000):
        self.short_term: List[AgentMessage] = []
        self.long_term: List[Dict[str, Any]] = []
        self.max_short_term = max_short_term
        self.max_long_term = max_long_term
    
    def add_to_short_term(self, message: AgentMessage) -> None:
        self.short_term.append(message)
        if len(self.short_term) > self.max_short_term:
            # Move oldest to long-term
            oldest = self.short_term.pop(0)
            self.compress_to_long_term(oldest)
    
    def compress_to_long_term(self, message: AgentMessage) -> None:
        """Compress message for long-term storage."""
        compressed = {
            "timestamp": message.metadata.get("timestamp"),
            "summary": message.content[:200],
            "agent": message.agent_name,
            "role": message.role,
        }
        self.long_term.append(compressed)
        if len(self.long_term) > self.max_long_term:
            self.long_term.pop(0)
    
    def get_relevant_context(self, query: str, top_k: int = 5) -> List[Dict]:
        """Retrieve relevant context from long-term memory."""
        # STUB: Would use embeddings in production
        return self.long_term[-top_k:]


class ChickenHawkOrchestrator:
    """Main orchestrator for Chicken Hawk Mode."""
    
    def __init__(self):
        self.tool_registry = ToolRegistry()
        self.agent_factory = AgentFactory(self.tool_registry)
        self.memory_manager = MemoryManager()
        self._setup_default_agents()
    
    def _setup_default_agents(self) -> None:
        """Set up default agent pool."""
        self.agents = {
            "researcher": self.agent_factory.create_from_template("researcher"),
            "coder": self.agent_factory.create_from_template("coder"),
            "writer": self.agent_factory.create_from_template("writer"),
            "orchestrator": self.agent_factory.create_from_template("orchestrator"),
        }
    
    def register_module_tools(self, module_name: str, tools: List[Tool]) -> None:
        """Register tools from an II module."""
        for tool in tools:
            self.tool_registry.register(tool, module_name)
    
    async def execute_complex_task(self, user_request: str) -> Dict[str, Any]:
        """Execute a complex multi-agent task."""
        loop = AgentLoop(self.agents)
        result = await loop.run(user_request)
        return result
    
    def get_status(self) -> Dict[str, Any]:
        """Get orchestrator status."""
        return {
            "agents": list(self.agents.keys()),
            "tools": self.tool_registry.list_all(),
            "memory": {
                "short_term": len(self.memory_manager.short_term),
                "long_term": len(self.memory_manager.long_term),
            },
        }


# Example usage and tools for II modules
def create_ii_researcher_tools() -> List[Tool]:
    """Create tools for ii-researcher module."""
    return [
        Tool(
            name="web_search",
            description="Search the web for information",
            handler=lambda query: f"Searched for: {query}",
            parameters={"query": "string"},
        ),
        Tool(
            name="deep_research",
            description="Perform deep research on a topic",
            handler=lambda topic: f"Researched: {topic}",
            parameters={"topic": "string", "depth": "int"},
        ),
    ]


def create_codex_tools() -> List[Tool]:
    """Create tools for codex module."""
    return [
        Tool(
            name="generate_code",
            description="Generate code from a prompt",
            handler=lambda prompt, lang: f"Generated {lang} code",
            parameters={"prompt": "string", "language": "string"},
        ),
        Tool(
            name="review_code",
            description="Review code for issues",
            handler=lambda code: f"Reviewed code",
            parameters={"code": "string"},
        ),
    ]
