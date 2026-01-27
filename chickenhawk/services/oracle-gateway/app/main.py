from fastapi import FastAPI, HTTPException, Request, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
import httpx
import json
import os
import logging

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("oracle-gateway")

app = FastAPI(title="Chickenhawk Oracle Gateway", version="1.0.0")

# Configuration (Load from Env/File)
SERVICE_MAP = {
    "agent-zero": os.getenv("URL_AGENT_ZERO", "http://chickenhawk-agent-zero:8080"),
    "ii-researcher": os.getenv("URL_II_RESEARCHER", "http://chickenhawk-ii-researcher:8000"),
    "ii-agent": os.getenv("URL_II_AGENT", "http://ii-agent:8080"),
    "codex": os.getenv("URL_CODEX", "http://codex:8080"),
    "billing-bridge": os.getenv("URL_BILLING", "http://billing-bridge:8080"),
}

# Load Policy
try:
    with open("policy.json", "r") as f:
        POLICY = json.load(f)
except FileNotFoundError:
    POLICY = {"guards": {}, "routing": {}}
    logger.warning("policy.json not found, running with defaults.")

class OrchestrationRequest(BaseModel):
    intent: str  # 'research', 'code', 'general'
    payload: Dict[str, Any]
    user_id: str
    auth_token: str

@app.get("/")
def health_check():
    return {"status": "online", "role": "oracle-gateway", "services": list(SERVICE_MAP.keys())}

@app.post("/orchestrate")
async def orchestrate(req: OrchestrationRequest):
    """
    Main entry point for SmelterOS to request Chickenhawk actions.
    Enforces policy and routes to the correct internal service.
    """
    # 1. Authenticate (Stub - verify Firebase ID Token in prod)
    if not req.auth_token:
        raise HTTPException(status_code=401, detail="Missing Auth Token")

    # 2. Check Policy / Guardrails
    if req.intent == "forbidden_action":
        raise HTTPException(status_code=403, detail="Policy Violation")

    # 3. Determine Route
    target_service = POLICY.get("routing", {}).get(req.intent, "agent-zero")
    service_url = SERVICE_MAP.get(target_service)

    if not service_url:
        raise HTTPException(status_code=500, detail=f"Service URL not found for {target_service}")

    logger.info(f"Routing request {req.intent} to {target_service} ({service_url})")

    # 4. Forward Request (Service-to-Service)
    async with httpx.AsyncClient() as client:
        try:
            # Map paths based on service contracts
            path = "/"
            if target_service == "ii-researcher":
                path = "/research"
            elif target_service == "ii-agent":
                path = "/run"
            
            # Forward the payload
            resp = await client.post(f"{service_url}{path}", json=req.payload, timeout=60.0)
            return {
                "status": "success",
                "router": "oracle-gateway",
                "target": target_service,
                "response": resp.json()
            }
        except httpx.RequestError as e:
            logger.error(f"Downstream error: {e}")
            raise HTTPException(status_code=503, detail=f"Downstream service {target_service} unavailable")

@app.get("/policy")
def get_policy():
    return POLICY
