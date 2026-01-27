"""
LLM Configuration — OpenRouter + GCP/Vertex AI Integration
================================================================
Configures LLM providers for AVVA NOON and SmelterOS.

Primary: OpenRouter (GLM4.7 default)
Fallback: GCP Vertex AI (Gemini)
Local: Gemma via Function Calling

Usage:
    from llm_config import get_client, generate, MODELS
    
    response = await generate("Explain quantum computing")
"""

import os
import json
import httpx
from dataclasses import dataclass
from typing import Optional, List, Dict, Any, Literal
from enum import Enum
import logging

logger = logging.getLogger("avva_noon.llm_config")

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

# OpenRouter Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# GCP/Vertex AI Configuration
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", "")
GCP_LOCATION = os.getenv("GCP_LOCATION", "us-central1")
VERTEX_AI_ENDPOINT = f"https://{GCP_LOCATION}-aiplatform.googleapis.com/v1"

# Google AI (Direct)
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

# Default Settings
DEFAULT_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.7"))
DEFAULT_MAX_TOKENS = int(os.getenv("LLM_MAX_TOKENS", "4096"))


# ═══════════════════════════════════════════════════════════════════════════
# MODEL REGISTRY
# ═══════════════════════════════════════════════════════════════════════════

class Provider(str, Enum):
    OPENROUTER = "openrouter"
    VERTEX_AI = "vertex_ai"
    GOOGLE_AI = "google_ai"
    LOCAL = "local"


@dataclass
class ModelConfig:
    """Model configuration."""
    id: str
    provider: Provider
    display_name: str
    context_window: int
    cost_per_1k_input: float
    cost_per_1k_output: float
    supports_functions: bool = True
    supports_vision: bool = False
    max_output_tokens: int = 4096


# Model Registry
MODELS: Dict[str, ModelConfig] = {
    # ═══ OpenRouter Models ═══
    "glm4-flash": ModelConfig(
        id="glw/glm-4-flash",
        provider=Provider.OPENROUTER,
        display_name="GLM-4 Flash (Default)",
        context_window=128000,
        cost_per_1k_input=0.0001,
        cost_per_1k_output=0.0001,
        supports_functions=True,
        max_output_tokens=8192
    ),
    "glm4-plus": ModelConfig(
        id="glw/glm-4-plus",
        provider=Provider.OPENROUTER,
        display_name="GLM-4 Plus",
        context_window=128000,
        cost_per_1k_input=0.0005,
        cost_per_1k_output=0.0005,
        supports_functions=True,
        max_output_tokens=8192
    ),
    "deepseek-r1": ModelConfig(
        id="deepseek/deepseek-r1",
        provider=Provider.OPENROUTER,
        display_name="DeepSeek R1",
        context_window=64000,
        cost_per_1k_input=0.00055,
        cost_per_1k_output=0.00219,
        supports_functions=True,
        max_output_tokens=8192
    ),
    "claude-sonnet": ModelConfig(
        id="anthropic/claude-3.5-sonnet",
        provider=Provider.OPENROUTER,
        display_name="Claude 3.5 Sonnet",
        context_window=200000,
        cost_per_1k_input=0.003,
        cost_per_1k_output=0.015,
        supports_functions=True,
        supports_vision=True,
        max_output_tokens=8192
    ),
    "gpt4o": ModelConfig(
        id="openai/gpt-4o",
        provider=Provider.OPENROUTER,
        display_name="GPT-4o",
        context_window=128000,
        cost_per_1k_input=0.005,
        cost_per_1k_output=0.015,
        supports_functions=True,
        supports_vision=True,
        max_output_tokens=16384
    ),
    
    # ═══ GCP/Vertex AI Models ═══
    "gemini-flash": ModelConfig(
        id="gemini-2.0-flash-001",
        provider=Provider.VERTEX_AI,
        display_name="Gemini 2.0 Flash",
        context_window=1000000,
        cost_per_1k_input=0.000075,
        cost_per_1k_output=0.0003,
        supports_functions=True,
        supports_vision=True,
        max_output_tokens=8192
    ),
    "gemini-pro": ModelConfig(
        id="gemini-1.5-pro-002",
        provider=Provider.VERTEX_AI,
        display_name="Gemini 1.5 Pro",
        context_window=2000000,
        cost_per_1k_input=0.00125,
        cost_per_1k_output=0.005,
        supports_functions=True,
        supports_vision=True,
        max_output_tokens=8192
    ),
    
    # ═══ Google AI Direct ═══
    "gemma-2": ModelConfig(
        id="gemma-2-27b-it",
        provider=Provider.GOOGLE_AI,
        display_name="Gemma 2 27B",
        context_window=8192,
        cost_per_1k_input=0.0,  # Free tier
        cost_per_1k_output=0.0,
        supports_functions=False,
        max_output_tokens=4096
    ),
}

# Default model selection
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "glm4-flash")
FALLBACK_MODEL = os.getenv("FALLBACK_MODEL", "gemini-flash")


# ═══════════════════════════════════════════════════════════════════════════
# LLM CLIENT
# ═══════════════════════════════════════════════════════════════════════════

class LLMClient:
    """Unified LLM client with provider routing and fallback."""
    
    def __init__(
        self,
        default_model: str = DEFAULT_MODEL,
        fallback_model: str = FALLBACK_MODEL
    ):
        self.default_model = default_model
        self.fallback_model = fallback_model
        self._http_client = None
    
    async def _get_client(self) -> httpx.AsyncClient:
        if self._http_client is None or self._http_client.is_closed:
            self._http_client = httpx.AsyncClient(timeout=120.0)
        return self._http_client
    
    async def generate(
        self,
        prompt: str,
        model: Optional[str] = None,
        temperature: float = DEFAULT_TEMPERATURE,
        max_tokens: int = DEFAULT_MAX_TOKENS,
        system_prompt: Optional[str] = None,
        functions: Optional[List[Dict]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate completion from LLM.
        
        Args:
            prompt: User prompt
            model: Model key from MODELS registry
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum output tokens
            system_prompt: Optional system prompt
            functions: Optional function definitions for tool calling
            
        Returns:
            Response with content, tokens used, model info
        """
        model_key = model or self.default_model
        
        if model_key not in MODELS:
            logger.warning(f"Unknown model {model_key}, using default")
            model_key = self.default_model
        
        model_config = MODELS[model_key]
        
        try:
            if model_config.provider == Provider.OPENROUTER:
                return await self._call_openrouter(
                    model_config, prompt, temperature, max_tokens,
                    system_prompt, functions, **kwargs
                )
            elif model_config.provider == Provider.VERTEX_AI:
                return await self._call_vertex_ai(
                    model_config, prompt, temperature, max_tokens,
                    system_prompt, **kwargs
                )
            elif model_config.provider == Provider.GOOGLE_AI:
                return await self._call_google_ai(
                    model_config, prompt, temperature, max_tokens,
                    system_prompt, **kwargs
                )
            else:
                raise ValueError(f"Unknown provider: {model_config.provider}")
                
        except Exception as e:
            logger.error(f"Primary model {model_key} failed: {e}")
            
            if model_key != self.fallback_model:
                logger.info(f"Falling back to {self.fallback_model}")
                return await self.generate(
                    prompt=prompt,
                    model=self.fallback_model,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    system_prompt=system_prompt,
                    **kwargs
                )
            raise
    
    async def _call_openrouter(
        self,
        model: ModelConfig,
        prompt: str,
        temperature: float,
        max_tokens: int,
        system_prompt: Optional[str],
        functions: Optional[List[Dict]],
        **kwargs
    ) -> Dict[str, Any]:
        """Call OpenRouter API."""
        client = await self._get_client()
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": model.id,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": min(max_tokens, model.max_output_tokens),
        }
        
        if functions and model.supports_functions:
            payload["tools"] = [{"type": "function", "function": f} for f in functions]
        
        response = await client.post(
            f"{OPENROUTER_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "HTTP-Referer": "https://smelteros.app",
                "X-Title": "SmelterOS AVVA NOON"
            },
            json=payload
        )
        response.raise_for_status()
        data = response.json()
        
        return {
            "content": data["choices"][0]["message"]["content"],
            "model": model.id,
            "provider": "openrouter",
            "tokens": {
                "input": data.get("usage", {}).get("prompt_tokens", 0),
                "output": data.get("usage", {}).get("completion_tokens", 0)
            },
            "tool_calls": data["choices"][0]["message"].get("tool_calls"),
            "finish_reason": data["choices"][0].get("finish_reason")
        }
    
    async def _call_vertex_ai(
        self,
        model: ModelConfig,
        prompt: str,
        temperature: float,
        max_tokens: int,
        system_prompt: Optional[str],
        **kwargs
    ) -> Dict[str, Any]:
        """Call Vertex AI API."""
        client = await self._get_client()
        
        # Get access token from environment or metadata
        access_token = os.getenv("GCP_ACCESS_TOKEN", "")
        
        endpoint = (
            f"{VERTEX_AI_ENDPOINT}/projects/{GCP_PROJECT_ID}"
            f"/locations/{GCP_LOCATION}/publishers/google/models/{model.id}"
            ":generateContent"
        )
        
        contents = []
        if system_prompt:
            contents.append({
                "role": "user",
                "parts": [{"text": f"System: {system_prompt}"}]
            })
        contents.append({
            "role": "user",
            "parts": [{"text": prompt}]
        })
        
        response = await client.post(
            endpoint,
            headers={"Authorization": f"Bearer {access_token}"},
            json={
                "contents": contents,
                "generationConfig": {
                    "temperature": temperature,
                    "maxOutputTokens": min(max_tokens, model.max_output_tokens),
                }
            }
        )
        response.raise_for_status()
        data = response.json()
        
        return {
            "content": data["candidates"][0]["content"]["parts"][0]["text"],
            "model": model.id,
            "provider": "vertex_ai",
            "tokens": {
                "input": data.get("usageMetadata", {}).get("promptTokenCount", 0),
                "output": data.get("usageMetadata", {}).get("candidatesTokenCount", 0)
            },
            "finish_reason": data["candidates"][0].get("finishReason")
        }
    
    async def _call_google_ai(
        self,
        model: ModelConfig,
        prompt: str,
        temperature: float,
        max_tokens: int,
        system_prompt: Optional[str],
        **kwargs
    ) -> Dict[str, Any]:
        """Call Google AI (Gemma) API."""
        client = await self._get_client()
        
        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        
        response = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model.id}:generateContent",
            params={"key": GOOGLE_API_KEY},
            json={
                "contents": [{"parts": [{"text": full_prompt}]}],
                "generationConfig": {
                    "temperature": temperature,
                    "maxOutputTokens": min(max_tokens, model.max_output_tokens),
                }
            }
        )
        response.raise_for_status()
        data = response.json()
        
        return {
            "content": data["candidates"][0]["content"]["parts"][0]["text"],
            "model": model.id,
            "provider": "google_ai",
            "tokens": {
                "input": data.get("usageMetadata", {}).get("promptTokenCount", 0),
                "output": data.get("usageMetadata", {}).get("candidatesTokenCount", 0)
            }
        }
    
    async def close(self):
        """Close HTTP client."""
        if self._http_client:
            await self._http_client.aclose()


# ═══════════════════════════════════════════════════════════════════════════
# CONVENIENCE FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

# Global client instance
_client: Optional[LLMClient] = None


def get_client() -> LLMClient:
    """Get or create global LLM client."""
    global _client
    if _client is None:
        _client = LLMClient()
    return _client


async def generate(prompt: str, **kwargs) -> Dict[str, Any]:
    """Generate completion using default client."""
    return await get_client().generate(prompt, **kwargs)


def list_models() -> List[Dict]:
    """List all available models."""
    return [
        {
            "key": key,
            "id": config.id,
            "name": config.display_name,
            "provider": config.provider.value,
            "context_window": config.context_window,
            "supports_functions": config.supports_functions,
            "supports_vision": config.supports_vision
        }
        for key, config in MODELS.items()
    ]


def get_model_info(model_key: str) -> Optional[Dict]:
    """Get model information."""
    if model_key in MODELS:
        config = MODELS[model_key]
        return {
            "key": model_key,
            "id": config.id,
            "name": config.display_name,
            "provider": config.provider.value,
            "context_window": config.context_window,
            "cost": {
                "input_per_1k": config.cost_per_1k_input,
                "output_per_1k": config.cost_per_1k_output
            }
        }
    return None


# ═══════════════════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import sys
    import asyncio
    
    if len(sys.argv) < 2:
        print("Usage: python llm_config.py --list")
        print("       python llm_config.py --test 'prompt'")
        print("       python llm_config.py --info model_key")
        sys.exit(1)
    
    if sys.argv[1] == "--list":
        for model in list_models():
            print(f"{model['key']}: {model['name']} ({model['provider']})")
    
    elif sys.argv[1] == "--info":
        info = get_model_info(sys.argv[2])
        print(json.dumps(info, indent=2))
    
    elif sys.argv[1] == "--test":
        async def test():
            result = await generate(sys.argv[2])
            print(f"Model: {result['model']}")
            print(f"Content: {result['content'][:500]}...")
            print(f"Tokens: {result['tokens']}")
        
        asyncio.run(test())
