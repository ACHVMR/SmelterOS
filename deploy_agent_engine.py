#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
SmelterOS-ORACLE Agent Engine Deployment Script
Deploys ADK-based agents to Vertex AI Reasoning Engines
═══════════════════════════════════════════════════════════════════════════════
"""

import argparse
import os
import sys
import json
from typing import Optional, Dict, Any
from datetime import datetime

# Vertex AI imports
try:
    import vertexai
    from vertexai.preview import reasoning_engines
    from google.cloud import aiplatform
    VERTEX_AVAILABLE = True
except ImportError:
    VERTEX_AVAILABLE = False
    print("⚠️  Vertex AI SDK not installed. Running in simulation mode.")


# =============================================================================
# AGENT CONFIGURATIONS
# =============================================================================

AGENT_CONFIGS: Dict[str, Dict[str, Any]] = {
    "acheevy": {
        "display_name": "acheevy-orchestrator",
        "description": "SmelterOS-ORACLE Prime Orchestrator - Routes queries to specialist agents",
        "model": "gemini-2.0-flash",
        "requirements": [
            "google-cloud-aiplatform>=1.38.0",
            "langchain-google-vertexai>=0.1.0",
            "langchain>=0.1.0",
            "requests>=2.31.0",
        ],
        "capabilities": ["intent-routing", "delegation", "velocity-driver", "budget-ledger"],
        "layer": "nlp",
        "fdh_phase": "all",
        "virtue_weight": 0.30,
    },
    "boomer-cto": {
        "display_name": "boomer-cto-engine",
        "description": "Code review, deployment, CI/CD, architecture",
        "model": "gemini-2.0-flash",
        "requirements": [
            "google-cloud-aiplatform>=1.38.0",
            "requests>=2.31.0",
        ],
        "capabilities": ["code-review", "deployment", "ci-cd", "architecture", "git", "docker"],
        "layer": "execution",
        "fdh_phase": "develop",
        "virtue_weight": 0.20,
    },
    "boomer-cmo": {
        "display_name": "boomer-cmo-engine",
        "description": "Content creation, branding, UI design, palette",
        "model": "gemini-2.0-flash",
        "requirements": [
            "google-cloud-aiplatform>=1.38.0",
            "requests>=2.31.0",
        ],
        "capabilities": ["content-creation", "branding", "campaigns", "ui-design", "palette"],
        "layer": "execution",
        "fdh_phase": "develop",
        "virtue_weight": 0.10,
    },
    "boomer-cfo": {
        "display_name": "boomer-cfo-engine",
        "description": "Budget tracking, forecasting, audit, ethics gate",
        "model": "gemini-2.0-flash",
        "requirements": [
            "google-cloud-aiplatform>=1.38.0",
            "pandas>=2.0.0",
            "requests>=2.31.0",
        ],
        "capabilities": ["budget-tracking", "forecasting", "billing", "audit", "ethics-gate"],
        "layer": "execution",
        "fdh_phase": "hone",
        "virtue_weight": 0.05,
    },
    "boomer-coo": {
        "display_name": "boomer-coo-engine",
        "description": "Workflow automation, process optimization, verification",
        "model": "gemini-2.0-flash",
        "requirements": [
            "google-cloud-aiplatform>=1.38.0",
            "requests>=2.31.0",
        ],
        "capabilities": ["workflow-automation", "process-optimization", "logistics", "reflective-validation"],
        "layer": "orchestration",
        "fdh_phase": "all",
        "virtue_weight": 0.15,
    },
    "boomer-cpo": {
        "display_name": "boomer-cpo-engine",
        "description": "Product specs, user research, feature prioritization",
        "model": "gemini-2.0-flash",
        "requirements": [
            "google-cloud-aiplatform>=1.38.0",
            "requests>=2.31.0",
        ],
        "capabilities": ["product-specs", "user-research", "feature-prioritization", "cot-viz"],
        "layer": "execution",
        "fdh_phase": "develop",
        "virtue_weight": 0.05,
    },
    "rlm-research": {
        "display_name": "rlm-research-engine",
        "description": "Recursive context handling for >128k tokens, deep analysis",
        "model": "gemini-1.5-pro",  # Needs 2M context
        "requirements": [
            "google-cloud-aiplatform>=1.38.0",
            "langchain>=0.1.0",
            "langchain-google-vertexai>=0.1.0",
            "requests>=2.31.0",
        ],
        "capabilities": ["chunking", "aggregation", "deep-analysis", "recursive-reasoning", "10M-context"],
        "layer": "logic",
        "fdh_phase": "foster",
        "virtue_weight": 0.15,
    },
}


# =============================================================================
# AGENT CLASSES
# =============================================================================

class BaseAgent:
    """Base agent class for ADK compatibility."""
    
    def __init__(self, agent_id: str, config: Dict[str, Any]):
        self.agent_id = agent_id
        self.config = config
        self.model = config.get("model", "gemini-2.0-flash")
        self.capabilities = config.get("capabilities", [])
        
    def query(self, input: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Main query method - override in subclasses."""
        return {
            "agent_id": self.agent_id,
            "response": f"[{self.agent_id}] Processed: {input}",
            "model": self.model,
            "timestamp": datetime.utcnow().isoformat(),
        }
    
    def set_model(self, model: str):
        """Set the model to use."""
        self.model = model


class AcheevyAgent(BaseAgent):
    """Prime orchestrator agent."""
    
    def __init__(self):
        super().__init__("acheevy", AGENT_CONFIGS["acheevy"])
        self.delegation_registry: Dict[str, str] = {}
        
    def query(self, input: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        # Intent classification
        intent = self._classify_intent(input)
        
        # Route to appropriate agent
        if intent.get("delegate_to"):
            return self._delegate(intent["delegate_to"], input, context)
        
        return {
            "agent_id": self.agent_id,
            "response": f"[acheevy] Orchestrated: {input}",
            "intent": intent,
            "timestamp": datetime.utcnow().isoformat(),
        }
    
    def _classify_intent(self, input: str) -> Dict[str, Any]:
        """Classify the intent of the input."""
        input_lower = input.lower()
        
        if any(kw in input_lower for kw in ["code", "refactor", "deploy", "ci/cd"]):
            return {"type": "code", "delegate_to": "boomer-cto"}
        elif any(kw in input_lower for kw in ["ui", "brand", "palette", "design"]):
            return {"type": "design", "delegate_to": "boomer-cmo"}
        elif any(kw in input_lower for kw in ["budget", "audit", "cost"]):
            return {"type": "finance", "delegate_to": "boomer-cfo"}
        elif any(kw in input_lower for kw in ["workflow", "ops", "process"]):
            return {"type": "operations", "delegate_to": "boomer-coo"}
        elif any(kw in input_lower for kw in ["spec", "product", "feature"]):
            return {"type": "product", "delegate_to": "boomer-cpo"}
        elif any(kw in input_lower for kw in ["research", "analyze", "deep"]):
            return {"type": "research", "delegate_to": "rlm-research"}
        
        return {"type": "general", "delegate_to": None}
    
    def _delegate(self, agent_id: str, input: str, context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Delegate to another agent."""
        return {
            "agent_id": self.agent_id,
            "delegated_to": agent_id,
            "response": f"[acheevy] Delegated to {agent_id}: {input}",
            "timestamp": datetime.utcnow().isoformat(),
        }


class BoomerAgent(BaseAgent):
    """Boomer C-Suite agent."""
    
    def __init__(self, role: str):
        agent_id = f"boomer-{role}"
        if agent_id not in AGENT_CONFIGS:
            raise ValueError(f"Unknown Boomer role: {role}")
        super().__init__(agent_id, AGENT_CONFIGS[agent_id])
        self.role = role
        
    def query(self, input: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return {
            "agent_id": self.agent_id,
            "role": self.role,
            "response": f"[{self.agent_id}] Executed: {input}",
            "capabilities": self.capabilities,
            "timestamp": datetime.utcnow().isoformat(),
        }


class RLMResearchAgent(BaseAgent):
    """Recursive context research agent."""
    
    def __init__(self):
        super().__init__("rlm-research", AGENT_CONFIGS["rlm-research"])
        
    def query(self, input: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        documents = context.get("documents", []) if context else []
        
        return {
            "agent_id": self.agent_id,
            "response": f"[rlm-research] Analyzed: {input}",
            "documents_processed": len(documents),
            "model": self.model,
            "timestamp": datetime.utcnow().isoformat(),
        }


# =============================================================================
# DEPLOYMENT FUNCTIONS
# =============================================================================

def get_agent_instance(agent_name: str) -> BaseAgent:
    """Get an agent instance by name."""
    if agent_name == "acheevy":
        return AcheevyAgent()
    elif agent_name.startswith("boomer-"):
        role = agent_name.replace("boomer-", "")
        return BoomerAgent(role)
    elif agent_name == "rlm-research":
        return RLMResearchAgent()
    else:
        raise ValueError(f"Unknown agent: {agent_name}")


def deploy_to_agent_engine(
    agent_name: str,
    project_id: str,
    region: str,
    dry_run: bool = False
) -> Optional[str]:
    """Deploy an agent to Vertex AI Agent Engine."""
    
    if agent_name not in AGENT_CONFIGS:
        raise ValueError(f"Unknown agent: {agent_name}. Available: {list(AGENT_CONFIGS.keys())}")
    
    config = AGENT_CONFIGS[agent_name]
    agent_instance = get_agent_instance(agent_name)
    
    print(f"\n{'='*60}")
    print(f"Deploying: {config['display_name']}")
    print(f"{'='*60}")
    print(f"  Project:     {project_id}")
    print(f"  Region:      {region}")
    print(f"  Model:       {config['model']}")
    print(f"  Layer:       {config['layer']}")
    print(f"  FDH Phase:   {config['fdh_phase']}")
    print(f"  Capabilities: {', '.join(config['capabilities'])}")
    print(f"{'='*60}\n")
    
    if dry_run:
        print("🔍 DRY RUN - No actual deployment")
        return f"projects/{project_id}/locations/{region}/reasoningEngines/{config['display_name']}"
    
    if not VERTEX_AVAILABLE:
        print("⚠️  Vertex AI SDK not available - simulating deployment")
        resource_name = f"projects/{project_id}/locations/{region}/reasoningEngines/{config['display_name']}"
        print(f"✅ [SIMULATED] Deployed {config['display_name']}")
        print(f"   Resource: {resource_name}")
        return resource_name
    
    # Initialize Vertex AI
    vertexai.init(project=project_id, location=region)
    
    # Deploy to Reasoning Engine
    try:
        remote_agent = reasoning_engines.ReasoningEngine.create(
            agent_instance,
            requirements=config["requirements"],
            display_name=config["display_name"],
            description=config["description"],
            extra_packages=["./src"],  # Include source code
        )
        
        resource_name = remote_agent.resource_name
        print(f"✅ Deployed {config['display_name']}")
        print(f"   Resource: {resource_name}")
        
        # Save deployment info
        save_deployment_info(agent_name, resource_name, project_id, region)
        
        return resource_name
        
    except Exception as e:
        print(f"❌ Failed to deploy {config['display_name']}: {e}")
        raise


def save_deployment_info(
    agent_name: str,
    resource_name: str,
    project_id: str,
    region: str
) -> None:
    """Save deployment info to a JSON file."""
    deployment_file = "deployments.json"
    
    try:
        with open(deployment_file, "r") as f:
            deployments = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        deployments = {}
    
    deployments[agent_name] = {
        "resource_name": resource_name,
        "project_id": project_id,
        "region": region,
        "deployed_at": datetime.utcnow().isoformat(),
        "config": AGENT_CONFIGS.get(agent_name, {}),
    }
    
    with open(deployment_file, "w") as f:
        json.dump(deployments, f, indent=2)
    
    print(f"   Saved to: {deployment_file}")


def deploy_all_agents(project_id: str, region: str, dry_run: bool = False) -> Dict[str, str]:
    """Deploy all agents."""
    results = {}
    
    for agent_name in AGENT_CONFIGS:
        try:
            resource_name = deploy_to_agent_engine(agent_name, project_id, region, dry_run)
            results[agent_name] = resource_name or "failed"
        except Exception as e:
            results[agent_name] = f"error: {e}"
            print(f"❌ Failed: {agent_name} - {e}")
    
    return results


# =============================================================================
# CLI
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Deploy SmelterOS-ORACLE agents to Vertex AI Agent Engine"
    )
    parser.add_argument(
        "--agent",
        required=True,
        choices=list(AGENT_CONFIGS.keys()) + ["all"],
        help="Agent to deploy (or 'all' for all agents)"
    )
    parser.add_argument(
        "--project",
        required=True,
        help="GCP Project ID"
    )
    parser.add_argument(
        "--region",
        default="us-central1",
        help="GCP Region (default: us-central1)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print deployment info without actually deploying"
    )
    
    args = parser.parse_args()
    
    print("\n" + "═" * 60)
    print("  SmelterOS-ORACLE Agent Engine Deployment")
    print("═" * 60)
    
    if args.agent == "all":
        results = deploy_all_agents(args.project, args.region, args.dry_run)
        print("\n" + "═" * 60)
        print("  Deployment Summary")
        print("═" * 60)
        for agent, status in results.items():
            icon = "✅" if not status.startswith("error") else "❌"
            print(f"  {icon} {agent}: {status[:50]}...")
    else:
        deploy_to_agent_engine(args.agent, args.project, args.region, args.dry_run)
    
    print("\n" + "═" * 60)
    print("  Deployment Complete")
    print("═" * 60 + "\n")


if __name__ == "__main__":
    main()
