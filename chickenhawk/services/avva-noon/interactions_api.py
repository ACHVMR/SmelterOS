"""
Interactions API — Bridge between ACHEEVY, Agent Zero, and AVVA NOON
================================================================
Clean handoff process for the SmelterOS platform.

Flow:
1. User lands on ACHEEVY platform (ii-agent)
2. Task is validated via RTCCF → AVVA NOON governance
3. Execution routed to appropriate agent (Agent Zero, ACHEEVY, or hybrid)
4. Results validated via V.I.B.E. before delivery
5. Charter/Ledger logging throughout

Agents:
- ACHEEVY (ii-agent): Task execution, code generation, file ops
- Agent Zero (AVVA NOON): Complex reasoning, multi-step workflows
- Oracle Gateway: Routing and orchestration
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from enum import Enum
import httpx
import logging
import os
import uuid
from datetime import datetime, timezone

# Import AVVA NOON governance tools
from .charter_ledger import dual_log, log_to_ledger, check_charter_safety
from .vibe_validator import validate_vibe, quick_check
from .forbidden_scanner import scan_for_forbidden, sanitize_for_charter
from .audit_report import generate_audit_report
from .fdh_tracker import FDHTracker
from .rtccf_parser import validate_rtccf, parse_rtccf

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("avva_noon.interactions")

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

# Agent endpoints (from docker-compose network)
AGENT_ZERO_URL = os.getenv("AGENT_ZERO_URL", "http://agent-zero:80")
ACHEEVY_URL = os.getenv("ACHEEVY_URL", "http://ii-agent:8080")
ORACLE_GATEWAY_URL = os.getenv("ORACLE_GATEWAY_URL", "http://oracle-gateway:8080")
OPENCODE_URL = os.getenv("OPENCODE_URL", "http://opencode:8080")

# LLM Configuration (OpenRouter primary - GLM 4.7)
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "glw/glm-4-flash")  # GLM4.7
FALLBACK_MODEL = os.getenv("FALLBACK_MODEL", "google/gemini-3-flash-thinking")

# Governance
VIBE_THRESHOLD = float(os.getenv("VIBE_THRESHOLD", "0.85"))


# ═══════════════════════════════════════════════════════════════════════════
# DATA MODELS
# ═══════════════════════════════════════════════════════════════════════════

class AgentType(str, Enum):
    """Available agents for task routing."""
    ACHEEVY = "acheevy"
    AGENT_ZERO = "agent_zero"
    OPENCODE = "opencode"
    HYBRID = "hybrid"
    AUTO = "auto"


class TaskRequest(BaseModel):
    """Incoming task request."""
    task: str = Field(..., description="Task description or RTCCF formatted input")
    context: Optional[Dict[str, Any]] = Field(default={}, description="Additional context")
    agent: AgentType = Field(default=AgentType.AUTO, description="Target agent")
    tools: Optional[List[str]] = Field(default=[], description="Specific tools to use")
    legacy_estimate_hours: Optional[float] = Field(default=None, description="Legacy time estimate for FDH tracking")
    require_rtccf: bool = Field(default=False, description="Require strict RTCCF format")


class TaskResponse(BaseModel):
    """Task execution response."""
    task_id: str
    status: Literal["success", "pending", "failed", "halted"]
    agent_used: str
    result: Any
    vibe_score: Optional[float] = None
    customer_safe: bool = True
    audit_report_id: Optional[str] = None
    fdh_metrics: Optional[Dict] = None
    logs: List[str] = []


class HandoffRequest(BaseModel):
    """Handoff request between agents."""
    from_agent: AgentType
    to_agent: AgentType
    task_id: str
    context: Dict[str, Any]
    reason: str


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    service: str
    version: str
    agents: Dict[str, str]
    governance: Dict[str, Any]


# ═══════════════════════════════════════════════════════════════════════════
# FASTAPI APP
# ═══════════════════════════════════════════════════════════════════════════

app = FastAPI(
    title="AVVA NOON Interactions API",
    description="Bridge between ACHEEVY, Agent Zero, and AVVA NOON governance",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active task trackers
active_trackers: Dict[str, FDHTracker] = {}


# ═══════════════════════════════════════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/", response_model=HealthResponse)
async def health():
    """Health check with agent status."""
    agent_status = {}
    
    # Check each agent
    async with httpx.AsyncClient(timeout=5.0) as client:
        for name, url in [
            ("acheevy", ACHEEVY_URL),
            ("agent_zero", AGENT_ZERO_URL),
            ("oracle_gateway", ORACLE_GATEWAY_URL)
        ]:
            try:
                resp = await client.get(f"{url}/")
                agent_status[name] = "online" if resp.status_code == 200 else "degraded"
            except Exception:
                agent_status[name] = "offline"
    
    return HealthResponse(
        status="online",
        service="avva-noon-interactions",
        version="1.0.0",
        agents=agent_status,
        governance={
            "vibe_threshold": VIBE_THRESHOLD,
            "default_model": DEFAULT_MODEL,
            "charter_ledger": "active"
        }
    )


@app.post("/execute", response_model=TaskResponse)
async def execute_task(req: TaskRequest, background_tasks: BackgroundTasks):
    """
    Execute a task through the AVVA NOON governance pipeline.
    
    Flow:
    1. Validate RTCCF (if required)
    2. Start FDH tracking
    3. Route to appropriate agent
    4. Validate result via V.I.B.E.
    5. Log to Charter/Ledger
    6. Generate audit report
    """
    task_id = f"TASK-{uuid.uuid4().hex[:8].upper()}"
    logs = []
    
    # ═══ STEP 1: RTCCF Validation ═══
    if req.require_rtccf:
        rtccf_result = validate_rtccf(req.task)
        if rtccf_result["status"] != "VALID":
            log_to_ledger(
                f"RTCCF validation failed for {task_id}",
                context={"missing": rtccf_result["missing_fields"]},
                classification="VALIDATION"
            )
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "RTCCF_REQUIRED",
                    "missing_fields": rtccf_result["missing_fields"],
                    "template": rtccf_result["template"]
                }
            )
        logs.append("✓ RTCCF validated")
    
    # ═══ STEP 2: Start FDH Tracking ═══
    tracker = FDHTracker(
        task_id=task_id,
        legacy_estimate_hours=req.legacy_estimate_hours,
        description=req.task[:100]
    )
    tracker.start_foster()
    active_trackers[task_id] = tracker
    logs.append("✓ FDH tracking started")
    
    # ═══ STEP 3: Determine Agent ═══
    agent = _determine_agent(req)
    logs.append(f"✓ Agent selected: {agent}")
    
    # ═══ STEP 4: Execute Task ═══
    tracker.end_foster()
    tracker.start_develop()
    tracker.start_hone()  # Parallel validation
    
    try:
        if agent == AgentType.ACHEEVY:
            result = await _execute_acheevy(req)
        elif agent == AgentType.AGENT_ZERO:
            result = await _execute_agent_zero(req)
        else:
            result = await _execute_hybrid(req)
        
        logs.append("✓ Execution complete")
    except Exception as e:
        logger.error(f"Execution failed: {e}")
        tracker.end_develop()
        tracker.end_hone()
        
        log_to_ledger(
            f"Task {task_id} failed: {str(e)}",
            classification="ERROR"
        )
        
        raise HTTPException(status_code=500, detail=str(e))
    
    tracker.end_develop()
    
    # ═══ STEP 5: V.I.B.E. Validation ═══
    result_str = str(result)
    vibe_result = validate_vibe(result_str)
    vibe_score = vibe_result["score"]
    logs.append(f"✓ V.I.B.E. score: {vibe_score:.3f}")
    
    if not vibe_result["passes_execution"]:
        logs.append("⚠ V.I.B.E. below threshold - REVIEW required")
    
    # ═══ STEP 6: Forbidden Value Scan ═══
    scan_result = scan_for_forbidden(result_str)
    customer_safe = scan_result["status"] == "CLEAN"
    
    if not customer_safe:
        logs.append("⚠ Sensitive values detected - sanitizing for Charter")
        sanitized = sanitize_for_charter(result_str)
        result["_sanitized"] = sanitized["sanitized_text"]
    
    # ═══ STEP 7: Charter/Ledger Logging ═══
    dual_log(
        f"Task {task_id} completed",
        context={
            "agent": agent.value,
            "vibe_score": vibe_score,
            "customer_safe": customer_safe
        }
    )
    logs.append("✓ Logged to Charter/Ledger")
    
    # ═══ STEP 8: Complete Tracking ═══
    tracker.end_hone()
    fdh_metrics = tracker.complete()
    
    # ═══ STEP 9: Generate Audit Report ═══
    audit_result = generate_audit_report(
        task_id=task_id,
        task_description=req.task[:200],
        vibe_score=vibe_score,
        runtime_hours=fdh_metrics["total_runtime_hours"],
        legacy_estimate_hours=req.legacy_estimate_hours,
        forbidden_violations=scan_result["violation_count"]
    )
    logs.append(f"✓ Audit report: {audit_result['report']['recommendation']['decision']}")
    
    # Cleanup tracker
    del active_trackers[task_id]
    
    return TaskResponse(
        task_id=task_id,
        status="success",
        agent_used=agent.value,
        result=result,
        vibe_score=vibe_score,
        customer_safe=customer_safe,
        audit_report_id=audit_result["report"]["report_id"],
        fdh_metrics=fdh_metrics,
        logs=logs
    )


@app.post("/handoff")
async def agent_handoff(req: HandoffRequest):
    """
    Hand off task between agents mid-execution.
    
    Used when one agent determines another is better suited.
    """
    log_to_ledger(
        f"Handoff: {req.from_agent} → {req.to_agent}",
        context={"task_id": req.task_id, "reason": req.reason},
        classification="HANDOFF"
    )
    
    return {
        "status": "handoff_initiated",
        "from": req.from_agent,
        "to": req.to_agent,
        "task_id": req.task_id
    }


@app.post("/validate")
async def validate_output(content: str):
    """Validate content before delivery to customer."""
    
    # V.I.B.E. check
    vibe_result = validate_vibe(content)
    
    # Forbidden value scan
    scan_result = scan_for_forbidden(content)
    
    # Charter safety check
    charter_safe = check_charter_safety(content)
    
    return {
        "vibe": vibe_result,
        "forbidden_scan": scan_result,
        "charter_safe": charter_safe["safe"],
        "can_deliver": vibe_result["passes_execution"] and charter_safe["safe"]
    }


@app.get("/agents")
async def list_agents():
    """List available agents and their capabilities."""
    return {
        "agents": [
            {
                "id": "acheevy",
                "name": "ACHEEVY (II-Agent)",
                "url": ACHEEVY_URL,
                "capabilities": ["code_execution", "file_ops", "web_search", "task_decomposition"],
                "best_for": "Code generation, file manipulation, structured tasks"
            },
            {
                "id": "agent_zero",
                "name": "Agent Zero (AVVA NOON)",
                "url": AGENT_ZERO_URL,
                "capabilities": ["complex_reasoning", "multi_step", "tool_use", "memory"],
                "best_for": "Complex workflows, research, multi-agent coordination"
            },
            {
                "id": "oracle_gateway",
                "name": "Oracle Gateway",
                "url": ORACLE_GATEWAY_URL,
                "capabilities": ["routing", "orchestration", "load_balancing"],
                "best_for": "Task routing, service coordination"
            }
        ],
        "default": "auto",
        "governance": {
            "avva_noon": "active",
            "vibe_threshold": VIBE_THRESHOLD,
            "charter_ledger": "enabled"
        }
    }


@app.get("/governance/status")
async def governance_status():
    """Get current AVVA NOON governance status."""
    return {
        "framework": "AVVA NOON × SmelterOS",
        "status": "active",
        "thresholds": {
            "vibe_execution": VIBE_THRESHOLD,
            "vibe_governance": 0.995,
            "compression_target": 0.90
        },
        "logging": {
            "charter": "enabled",
            "ledger": "enabled"
        },
        "active_trackers": len(active_trackers)
    }


# ═══════════════════════════════════════════════════════════════════════════
# INTERNAL FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

def _determine_agent(req: TaskRequest) -> AgentType:
    """Determine best agent for task."""
    if req.agent != AgentType.AUTO:
        return req.agent
    
    task_lower = req.task.lower()
    
    # Agent Zero for complex reasoning
    if any(kw in task_lower for kw in ["research", "analyze", "investigate", "complex", "multi-step"]):
        return AgentType.AGENT_ZERO
    
    # ACHEEVY for code tasks
    if any(kw in task_lower for kw in ["code", "implement", "build", "create file", "generate"]):
        return AgentType.ACHEEVY
    
    # Hybrid for mixed tasks
    if any(kw in task_lower for kw in ["and then", "after that", "first", "finally"]):
        return AgentType.HYBRID
    
    # Default to ACHEEVY
    return AgentType.ACHEEVY


async def _execute_acheevy(req: TaskRequest) -> Dict:
    """Execute task via ACHEEVY (ii-agent)."""
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{ACHEEVY_URL}/run",
            json={
                "task": req.task,
                "context": req.context,
                "tools": req.tools
            }
        )
        response.raise_for_status()
        return response.json()


async def _execute_agent_zero(req: TaskRequest) -> Dict:
    """Execute task via Agent Zero."""
    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.post(
            f"{AGENT_ZERO_URL}/api/chat",
            json={
                "message": req.task,
                "context": req.context
            }
        )
        response.raise_for_status()
        return response.json()


async def _execute_hybrid(req: TaskRequest) -> Dict:
    """Execute task using both agents in coordination."""
    # Start with Agent Zero for planning
    async with httpx.AsyncClient(timeout=300.0) as client:
        plan_response = await client.post(
            f"{AGENT_ZERO_URL}/api/chat",
            json={
                "message": f"Create a plan for: {req.task}. Return as JSON with steps.",
                "context": req.context
            }
        )
        plan = plan_response.json()
    
    # Execute with ACHEEVY
    async with httpx.AsyncClient(timeout=120.0) as client:
        exec_response = await client.post(
            f"{ACHEEVY_URL}/run",
            json={
                "task": req.task,
                "context": {**req.context, "plan": plan},
                "tools": req.tools
            }
        )
        result = exec_response.json()
    
    return {
        "plan": plan,
        "execution": result,
        "mode": "hybrid"
    }


# ═══════════════════════════════════════════════════════════════════════════
# STARTUP
# ═══════════════════════════════════════════════════════════════════════════

@app.on_event("startup")
async def startup():
    """Initialize on startup."""
    logger.info("═══ AVVA NOON Interactions API Starting ═══")
    logger.info(f"ACHEEVY URL: {ACHEEVY_URL}")
    logger.info(f"Agent Zero URL: {AGENT_ZERO_URL}")
    logger.info(f"Default Model: {DEFAULT_MODEL}")
    logger.info(f"V.I.B.E. Threshold: {VIBE_THRESHOLD}")
    logger.info("═══════════════════════════════════════════")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
