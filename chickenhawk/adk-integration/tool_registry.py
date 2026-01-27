"""
Chicken Hawk ADK Integration - Tool Registry

Centralized registry for all tools across the 19 II modules.
Provides dynamic capability injection and permission management.
"""

from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass, field
from enum import Enum
import logging

logger = logging.getLogger("chickenhawk.tools")


class ToolCategory(Enum):
    RESEARCH = "research"
    CODE = "code"
    CONTENT = "content"
    DATA = "data"
    SYSTEM = "system"
    PRESENTATION = "presentation"
    LLM = "llm"
    TRAINING = "training"


@dataclass
class ToolPermission:
    """Permission requirements for a tool."""
    requires_auth: bool = False
    requires_approval: bool = False
    allowed_tiers: List[str] = field(default_factory=lambda: ["premium"])
    rate_limit: Optional[int] = None  # requests per minute


@dataclass
class ModuleTool:
    """A tool provided by an II module."""
    name: str
    module: str
    category: ToolCategory
    description: str
    handler: Optional[Callable] = None
    parameters: Dict[str, Any] = field(default_factory=dict)
    returns: str = "Any"
    permissions: ToolPermission = field(default_factory=ToolPermission)
    examples: List[str] = field(default_factory=list)


class ChickenHawkToolRegistry:
    """
    Central registry for all tools across Chicken Hawk modules.
    """
    
    def __init__(self):
        self._tools: Dict[str, ModuleTool] = {}
        self._modules: Dict[str, List[str]] = {}
        self._categories: Dict[ToolCategory, List[str]] = {cat: [] for cat in ToolCategory}
        self._initialize_module_tools()
    
    def _initialize_module_tools(self) -> None:
        """Initialize tools for all 19 II modules."""
        
        # ii-agent tools
        self.register(ModuleTool(
            name="ii_agent.run_task",
            module="ii-agent",
            category=ToolCategory.SYSTEM,
            description="Execute an agentic task with planning and reflection",
            parameters={"task": "str", "context": "dict", "tools": "list"},
            permissions=ToolPermission(allowed_tiers=["data-entry", "premium"]),
        ))
        
        # ii-researcher tools
        self.register(ModuleTool(
            name="ii_researcher.deep_search",
            module="ii-researcher",
            category=ToolCategory.RESEARCH,
            description="Perform deep web research with BAML functions",
            parameters={"query": "str", "depth": "int", "sources": "list"},
            permissions=ToolPermission(allowed_tiers=["free", "data-entry", "premium"]),
        ))
        
        # codex tools
        self.register(ModuleTool(
            name="codex.generate",
            module="codex",
            category=ToolCategory.CODE,
            description="Generate code from natural language prompt",
            parameters={"prompt": "str", "language": "str", "context": "str"},
            permissions=ToolPermission(allowed_tiers=["data-entry", "premium"]),
        ))
        self.register(ModuleTool(
            name="codex.review",
            module="codex",
            category=ToolCategory.CODE,
            description="Review code for issues and improvements",
            parameters={"code": "str", "language": "str"},
            permissions=ToolPermission(allowed_tiers=["data-entry", "premium"]),
        ))
        
        # CommonGround tools
        self.register(ModuleTool(
            name="commonground.create_team",
            module="CommonGround",
            category=ToolCategory.SYSTEM,
            description="Create a team of AI agents for collaboration",
            parameters={"agents": "list", "objective": "str"},
            permissions=ToolPermission(allowed_tiers=["premium"], requires_approval=True),
        ))
        
        # Common_Chronicle tools
        self.register(ModuleTool(
            name="chronicle.structure_context",
            module="Common_Chronicle",
            category=ToolCategory.DATA,
            description="Structure messy context into a sourced timeline",
            parameters={"content": "str", "format": "str"},
            permissions=ToolPermission(allowed_tiers=["premium"]),
        ))
        
        # II-Commons tools
        self.register(ModuleTool(
            name="ii_commons.embed",
            module="II-Commons",
            category=ToolCategory.DATA,
            description="Generate embeddings for text/image datasets",
            parameters={"data": "list", "model": "str"},
            permissions=ToolPermission(allowed_tiers=["premium"]),
        ))
        
        # gemini-cli tools
        self.register(ModuleTool(
            name="gemini_cli.prompt",
            module="gemini-cli",
            category=ToolCategory.LLM,
            description="Direct Gemini API access via terminal",
            parameters={"prompt": "str", "model": "str"},
            permissions=ToolPermission(allowed_tiers=["data-entry", "premium"]),
        ))
        
        # litellm-debugger tools
        self.register(ModuleTool(
            name="litellm.completion",
            module="litellm-debugger",
            category=ToolCategory.LLM,
            description="Unified completion API for 100+ LLMs",
            parameters={"model": "str", "messages": "list", "temperature": "float"},
            permissions=ToolPermission(allowed_tiers=["data-entry", "premium"]),
        ))
        
        # PPTist tools
        self.register(ModuleTool(
            name="pptist.create_slides",
            module="PPTist",
            category=ToolCategory.PRESENTATION,
            description="Create PowerPoint-like presentation slides",
            parameters={"content": "list", "template": "str"},
            permissions=ToolPermission(allowed_tiers=["premium"]),
        ))
        
        # reveal.js tools
        self.register(ModuleTool(
            name="revealjs.export",
            module="reveal.js",
            category=ToolCategory.PRESENTATION,
            description="Export to HTML presentation format",
            parameters={"slides": "list", "theme": "str"},
            permissions=ToolPermission(allowed_tiers=["premium"]),
        ))
        
        # CoT-Lab-Demo tools
        self.register(ModuleTool(
            name="cot_lab.align",
            module="CoT-Lab-Demo",
            category=ToolCategory.TRAINING,
            description="Chain-of-Thought cognitive alignment",
            parameters={"human_trace": "str", "ai_trace": "str"},
            permissions=ToolPermission(allowed_tiers=["premium"], requires_approval=True),
        ))
        
        # ii-thought tools
        self.register(ModuleTool(
            name="ii_thought.generate_rl_data",
            module="ii-thought",
            category=ToolCategory.TRAINING,
            description="Generate RL training dataset",
            parameters={"domain": "str", "samples": "int"},
            permissions=ToolPermission(allowed_tiers=["premium"], requires_approval=True),
        ))
        
        # ii_verl tools
        self.register(ModuleTool(
            name="ii_verl.train",
            module="ii_verl",
            category=ToolCategory.TRAINING,
            description="Volcano Engine RL training for LLMs",
            parameters={"model": "str", "dataset": "str", "config": "dict"},
            permissions=ToolPermission(allowed_tiers=["premium"], requires_approval=True),
        ))
        
        # Agent-Zero tools
        self.register(ModuleTool(
            name="agent_zero.spawn",
            module="agent-zero",
            category=ToolCategory.SYSTEM,
            description="Spawn a sandboxed Agent-Zero instance",
            parameters={"task": "str", "docker_config": "dict"},
            permissions=ToolPermission(allowed_tiers=["premium"], requires_approval=True),
        ))
        
        # codex-as-mcp tools
        self.register(ModuleTool(
            name="codex_mcp.invoke",
            module="codex-as-mcp",
            category=ToolCategory.CODE,
            description="Invoke Codex via MCP protocol",
            parameters={"tool": "str", "args": "dict"},
            permissions=ToolPermission(allowed_tiers=["premium"]),
        ))
        
        # gemini-cli-mcp-openai-bridge tools
        self.register(ModuleTool(
            name="gemini_bridge.translate",
            module="gemini-cli-mcp-openai-bridge",
            category=ToolCategory.LLM,
            description="Bridge between Gemini and OpenAI APIs",
            parameters={"request": "dict", "target_api": "str"},
            permissions=ToolPermission(allowed_tiers=["premium"]),
        ))
        
        logger.info(f"Initialized {len(self._tools)} tools across {len(self._modules)} modules")
    
    def register(self, tool: ModuleTool) -> None:
        """Register a tool in the registry."""
        self._tools[tool.name] = tool
        
        if tool.module not in self._modules:
            self._modules[tool.module] = []
        self._modules[tool.module].append(tool.name)
        
        self._categories[tool.category].append(tool.name)
    
    def get(self, name: str) -> Optional[ModuleTool]:
        """Get a tool by name."""
        return self._tools.get(name)
    
    def get_by_module(self, module: str) -> List[ModuleTool]:
        """Get all tools for a module."""
        tool_names = self._modules.get(module, [])
        return [self._tools[name] for name in tool_names]
    
    def get_by_category(self, category: ToolCategory) -> List[ModuleTool]:
        """Get all tools in a category."""
        tool_names = self._categories.get(category, [])
        return [self._tools[name] for name in tool_names]
    
    def get_for_tier(self, tier: str) -> List[ModuleTool]:
        """Get all tools available for a subscription tier."""
        return [
            tool for tool in self._tools.values()
            if tier in tool.permissions.allowed_tiers
        ]
    
    def list_modules(self) -> List[str]:
        """List all registered modules."""
        return list(self._modules.keys())
    
    def list_tools(self) -> List[str]:
        """List all registered tool names."""
        return list(self._tools.keys())
    
    def to_json(self) -> Dict[str, Any]:
        """Export registry as JSON for API."""
        return {
            "total_tools": len(self._tools),
            "modules": {
                module: [self._tools[name].description for name in tools]
                for module, tools in self._modules.items()
            },
            "categories": {
                cat.value: len(tools) for cat, tools in self._categories.items()
            },
        }
