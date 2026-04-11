import os
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import Response
from fastapi.responses import JSONResponse
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field


def _env_flag(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class RouteDefinition:
    key: str
    name: str
    description: str
    default_model: str


@dataclass(frozen=True)
class UpstreamMount:
    key: str
    path: str
    description: str


class GatewayConfig(BaseModel):
    service_name: str = Field(default_factory=lambda: os.getenv("ORACLE_GATEWAY_NAME", "oracle-gateway"))
    openrouter_api_key: str | None = Field(default_factory=lambda: os.getenv("OPENROUTER_API_KEY"))
    openrouter_base_url: str = Field(default_factory=lambda: os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"))
    heygen_api_key: str | None = Field(default_factory=lambda: os.getenv("HEYGEN_API_KEY"))
    heygen_base_url: str = Field(default_factory=lambda: os.getenv("HEYGEN_BASE_URL", "https://api.heygen.com"))
    heygen_v2_base_url: str = Field(default_factory=lambda: os.getenv("HEYGEN_V2_BASE_URL", "https://api.heygen.com/v2"))
    app_url: str = Field(default_factory=lambda: os.getenv("ORACLE_GATEWAY_APP_URL", "https://smelteros.local/oracle-gateway"))
    app_name: str = Field(default_factory=lambda: os.getenv("ORACLE_GATEWAY_APP_NAME", "SmelterOS Oracle Gateway"))
    timeout_seconds: float = Field(default_factory=lambda: float(os.getenv("ORACLE_GATEWAY_TIMEOUT", "90")))
    expose_upstream_paths: bool = Field(default_factory=lambda: _env_flag("ORACLE_GATEWAY_EXPOSE_PATHS", False))
    default_route: str = Field(default_factory=lambda: os.getenv("ORACLE_GATEWAY_DEFAULT_ROUTE", "general"))
    free_model: str = Field(default_factory=lambda: os.getenv("ORACLE_GATEWAY_FREE_MODEL", "google/gemini-3.1-flash"))
    default_model: str = Field(default_factory=lambda: os.getenv("ORACLE_GATEWAY_DEFAULT_MODEL", "google/gemini-3.1-flash"))
    validation_model: str = Field(default_factory=lambda: os.getenv("ORACLE_GATEWAY_VALIDATION_MODEL", "google/gemini-2.0-flash-001"))
    premium_model: str = Field(default_factory=lambda: os.getenv("ORACLE_GATEWAY_PREMIUM_MODEL", "openai/gpt-4.1"))
    presentation_model: str = Field(default_factory=lambda: os.getenv("ORACLE_GATEWAY_PRESENTATION_MODEL", "google/gemini-2.0-flash-001"))
    tool_model: str = Field(default_factory=lambda: os.getenv("ORACLE_GATEWAY_TOOL_MODEL", "anthropic/claude-3.5-sonnet"))


CONFIG = GatewayConfig()

ROUTES: dict[str, RouteDefinition] = {
    "general": RouteDefinition(
        key="general",
        name="General Foundry",
        description="Default route for conversational and orchestration workloads.",
        default_model=CONFIG.default_model,
    ),
    "free": RouteDefinition(
        key="free",
        name="Free Tier",
        description="Low-cost route for demos, internal previews, and free usage.",
        default_model=CONFIG.free_model,
    ),
    "validate": RouteDefinition(
        key="validate",
        name="Validation",
        description="Validation route intended for V.I.B.E and review workflows.",
        default_model=CONFIG.validation_model,
    ),
    "premium": RouteDefinition(
        key="premium",
        name="Premium",
        description="Higher-capability route for paid workflows and critical execution.",
        default_model=CONFIG.premium_model,
    ),
    "presentation": RouteDefinition(
        key="presentation",
        name="Presentation",
        description="PPTist-oriented route for deck generation and presentation drafts.",
        default_model=CONFIG.presentation_model,
    ),
    "tools": RouteDefinition(
        key="tools",
        name="Tool Bridge",
        description="Tool-heavy route for Gemini CLI and adapter-backed tasks.",
        default_model=CONFIG.tool_model,
    ),
}

UPSTREAMS: list[UpstreamMount] = [
    UpstreamMount("litellm", os.getenv("LITELLM_PATH", "/litellm"), "LiteLLM router and debugger mount."),
    UpstreamMount("pptist", os.getenv("PPTIST_PATH", "/pptist"), "Presentation generation assets."),
    UpstreamMount("gemini-cli", os.getenv("GEMINI_CLI_PATH", "/gemini"), "Gemini CLI integration mount."),
    UpstreamMount("ghost-storage", os.getenv("GHOST_STORAGE_PATH", "/storage"), "Ghost GCP storage adapter mount."),
]

app = FastAPI(title="SmelterOS Oracle Gateway", version="0.1.0")


class ChatCompletionRequest(BaseModel):
    model: str | None = None
    messages: list[dict[str, Any]]
    route: str | None = None
    metadata: dict[str, Any] | None = None
    temperature: float | None = None
    max_tokens: int | None = None
    stream: bool | None = None


def _resolve_route(route_hint: str | None) -> RouteDefinition:
    selected_key = route_hint or CONFIG.default_route
    route = ROUTES.get(selected_key)
    if route is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": f"Unknown route '{selected_key}'.",
                "available_routes": sorted(ROUTES.keys()),
            },
        )
    return route


def _resolve_requested_route(request: Request, payload: ChatCompletionRequest) -> RouteDefinition:
    header_hint = request.headers.get("x-smelter-route")
    query_hint = request.query_params.get("route")
    return _resolve_route(payload.route or header_hint or query_hint)


def _upstream_status() -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for upstream in UPSTREAMS:
        path = Path(upstream.path)
        details: dict[str, Any] = {
            "key": upstream.key,
            "description": upstream.description,
            "available": path.exists(),
            "kind": "directory" if path.is_dir() else "file" if path.is_file() else "missing",
        }
        if CONFIG.expose_upstream_paths:
            details["path"] = upstream.path
        items.append(details)
    return items


def _config_summary() -> dict[str, Any]:
    return {
        "service_name": CONFIG.service_name,
        "default_route": CONFIG.default_route,
        "openrouter_configured": bool(CONFIG.openrouter_api_key),
        "heygen_configured": bool(CONFIG.heygen_api_key),
        "routes": {key: asdict(route) for key, route in ROUTES.items()},
    }


def _proxy_headers() -> dict[str, str]:
    if not CONFIG.openrouter_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OPENROUTER_API_KEY is not configured.",
        )
    return {
        "Authorization": f"Bearer {CONFIG.openrouter_api_key}",
        "HTTP-Referer": CONFIG.app_url,
        "X-Title": CONFIG.app_name,
        "Content-Type": "application/json",
    }


def _streaming_headers(content_type: str | None) -> dict[str, str]:
    headers = {
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
    }
    if content_type:
        headers["Content-Type"] = content_type
    return headers


def _heygen_headers() -> dict[str, str]:
    if not CONFIG.heygen_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="HEYGEN_API_KEY is not configured.",
        )
    return {
        "X-Api-Key": CONFIG.heygen_api_key,
        "Content-Type": "application/json",
    }


async def _proxy_json_request(
    url: str,
    headers: dict[str, str],
    method: str = "GET",
    json_body: dict[str, Any] | None = None,
) -> JSONResponse:
    async with httpx.AsyncClient(timeout=CONFIG.timeout_seconds) as client:
        try:
            response = await client.request(method=method, url=url, headers=headers, json=json_body)
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Upstream request failed: {exc}",
            ) from exc

    try:
        response_body = response.json()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Upstream returned a non-JSON response.",
        ) from exc

    return JSONResponse(status_code=response.status_code, content=response_body)


@app.get("/")
async def root() -> dict[str, Any]:
    return {
        "service": CONFIG.service_name,
        "status": "ok",
        "routes_url": "/v1/routes",
        "models_url": "/v1/models",
        "upstreams_url": "/v1/upstreams",
    }


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "openrouter_configured": bool(CONFIG.openrouter_api_key),
        "heygen_configured": bool(CONFIG.heygen_api_key),
        "upstreams": _upstream_status(),
    }


@app.get("/v1/routes")
async def routes() -> dict[str, Any]:
    return {
        "default_route": CONFIG.default_route,
        "routes": [asdict(route) for route in ROUTES.values()],
    }


@app.get("/v1/upstreams")
async def upstreams() -> dict[str, Any]:
    return {"upstreams": _upstream_status()}


@app.get("/v1/models")
async def models() -> dict[str, Any]:
    return _config_summary()


@app.get("/v1/heygen/account")
async def heygen_account() -> JSONResponse:
    return await _proxy_json_request(
        url=f"{CONFIG.heygen_base_url}/v1/user/me",
        headers=_heygen_headers(),
    )


@app.get("/v1/heygen/avatars")
async def heygen_avatars() -> JSONResponse:
    return await _proxy_json_request(
        url=f"{CONFIG.heygen_v2_base_url}/avatars",
        headers=_heygen_headers(),
    )


@app.post("/v1/heygen/video-agent/generate")
async def heygen_video_agent_generate(payload: dict[str, Any]) -> JSONResponse:
    return await _proxy_json_request(
        url=f"{CONFIG.heygen_base_url}/v1/video_agent/generate",
        headers=_heygen_headers(),
        method="POST",
        json_body=payload,
    )


@app.post("/v1/heygen/video-translate/translate")
async def heygen_video_translate(payload: dict[str, Any]) -> JSONResponse:
    return await _proxy_json_request(
        url=f"{CONFIG.heygen_base_url}/v1/video_translate/translate",
        headers=_heygen_headers(),
        method="POST",
        json_body=payload,
    )


@app.post("/v1/heygen/videos")
async def heygen_generate_video(payload: dict[str, Any]) -> JSONResponse:
    return await _proxy_json_request(
        url=f"{CONFIG.heygen_v2_base_url}/videos",
        headers=_heygen_headers(),
        method="POST",
        json_body=payload,
    )


@app.get("/v1/heygen/videos/{video_id}")
async def heygen_video_status(video_id: str) -> JSONResponse:
    return await _proxy_json_request(
        url=f"{CONFIG.heygen_v2_base_url}/videos/{video_id}",
        headers=_heygen_headers(),
    )


@app.post("/v1/chat/completions")
async def chat_completions(payload: ChatCompletionRequest, request: Request) -> JSONResponse:
    route = _resolve_requested_route(request, payload)
    outbound_body = payload.model_dump(exclude_none=True)
    outbound_body["model"] = payload.model or route.default_model
    outbound_body.pop("route", None)

    if payload.stream:
        client = httpx.AsyncClient(timeout=CONFIG.timeout_seconds)
        outbound_request = client.build_request(
            "POST",
            f"{CONFIG.openrouter_base_url}/chat/completions",
            headers=_proxy_headers(),
            json=outbound_body,
        )
        try:
            response = await client.send(outbound_request, stream=True)
        except httpx.HTTPError as exc:
            await client.aclose()
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"OpenRouter request failed: {exc}",
            ) from exc

        if response.is_error:
            error_body = await response.aread()
            await response.aclose()
            await client.aclose()
            return Response(
                content=error_body,
                status_code=response.status_code,
                media_type=response.headers.get("content-type"),
            )

        async def stream_response():
            try:
                async for chunk in response.aiter_bytes():
                    yield chunk
            finally:
                await response.aclose()
                await client.aclose()

        return StreamingResponse(
            stream_response(),
            status_code=response.status_code,
            headers=_streaming_headers(response.headers.get("content-type")),
        )

    async with httpx.AsyncClient(timeout=CONFIG.timeout_seconds) as client:
        try:
            response = await client.post(
                f"{CONFIG.openrouter_base_url}/chat/completions",
                headers=_proxy_headers(),
                json=outbound_body,
            )
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"OpenRouter request failed: {exc}",
            ) from exc

    try:
        response_body = response.json()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="OpenRouter returned a non-JSON response.",
        ) from exc

    if response.is_error:
        return JSONResponse(
            status_code=response.status_code,
            content={
                "gateway": CONFIG.service_name,
                "route": route.key,
                "error": response_body,
            },
        )

    if isinstance(response_body, dict):
        response_body.setdefault("smelter", {})
        if isinstance(response_body["smelter"], dict):
            response_body["smelter"].update(
                {
                    "gateway": CONFIG.service_name,
                    "route": route.key,
                    "resolved_model": outbound_body["model"],
                }
            )

    return JSONResponse(status_code=response.status_code, content=response_body)