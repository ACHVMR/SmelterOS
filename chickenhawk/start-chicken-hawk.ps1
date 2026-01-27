#!/usr/bin/env pwsh
# ═══════════════════════════════════════════════════════════════════════════
# CHICKEN HAWK QUICK START
# ═══════════════════════════════════════════════════════════════════════════
# Run this script to build and start the autonomous system
#
# Prerequisites:
#   - Docker Desktop installed and running
#   - OpenRouter API key (or other LLM provider)
#
# Usage:
#   ./start-chicken-hawk.ps1 -ApiKey "your_openrouter_api_key"
#   ./start-chicken-hawk.ps1 -Mode dry-run
# ═══════════════════════════════════════════════════════════════════════════

param(
    [string]$ApiKey = $env:OPENCODE_API_KEY,
    [string]$Mode = "autonomous",
    [switch]$BuildOnly,
    [switch]$Help
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Banner
Write-Host ""
Write-Host "  🦅 CHICKEN HAWK AUTONOMOUS ENGINE" -ForegroundColor Yellow
Write-Host "  ═══════════════════════════════════════" -ForegroundColor DarkGray
Write-Host ""

if ($Help) {
    Write-Host "Usage: ./start-chicken-hawk.ps1 [options]" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -ApiKey <key>    OpenRouter or LLM provider API key"
    Write-Host "  -Mode <mode>     Execution mode: autonomous | supervised | dry-run"
    Write-Host "  -BuildOnly       Only build container, don't run"
    Write-Host "  -Help            Show this help"
    Write-Host ""
    exit 0
}

# Check Docker
Write-Host "  [1/4] Checking Docker..." -ForegroundColor Cyan
try {
    $dockerVersion = docker --version 2>$null
    Write-Host "        ✓ Docker: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "        ✗ Docker not found. Please install Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check API Key
Write-Host "  [2/4] Validating configuration..." -ForegroundColor Cyan
if (-not $ApiKey) {
    Write-Host "        ⚠ No API key provided. Set OPENCODE_API_KEY or use -ApiKey" -ForegroundColor Yellow
    Write-Host "        Get an API key at: https://openrouter.ai/keys" -ForegroundColor DarkGray
    
    $ApiKey = Read-Host "        Enter API key (or press Enter to skip)"
}

if ($ApiKey) {
    $env:OPENCODE_API_KEY = $ApiKey
    Write-Host "        ✓ API key configured" -ForegroundColor Green
}

# Build container
Write-Host "  [3/4] Building OpenCode container..." -ForegroundColor Cyan
$composeFile = Join-Path $ScriptDir "infra/opencode/docker-compose.yaml"

try {
    Push-Location (Join-Path $ScriptDir "infra/opencode")
    docker-compose build 2>&1 | ForEach-Object { Write-Host "        $_" -ForegroundColor DarkGray }
    Pop-Location
    Write-Host "        ✓ Container built successfully" -ForegroundColor Green
} catch {
    Write-Host "        ✗ Build failed: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}

if ($BuildOnly) {
    Write-Host ""
    Write-Host "  Build complete. Run without -BuildOnly to start." -ForegroundColor Green
    exit 0
}

# Start container
Write-Host "  [4/4] Starting OpenCode container..." -ForegroundColor Cyan
try {
    Push-Location (Join-Path $ScriptDir "infra/opencode")
    docker-compose up -d 2>&1 | ForEach-Object { Write-Host "        $_" -ForegroundColor DarkGray }
    Pop-Location
    Write-Host "        ✓ Container started" -ForegroundColor Green
} catch {
    Write-Host "        ✗ Start failed: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host ""
Write-Host "  ═══════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "  🚀 CHICKEN HAWK READY" -ForegroundColor Green
Write-Host ""
Write-Host "  Run the harness:" -ForegroundColor Cyan
Write-Host "    python chicken_hawk.py --mode $Mode" -ForegroundColor White
Write-Host ""
Write-Host "  Check status:" -ForegroundColor Cyan
Write-Host "    python chicken_hawk.py --status" -ForegroundColor White
Write-Host ""
Write-Host "  Stop container:" -ForegroundColor Cyan
Write-Host "    docker-compose -f infra/opencode/docker-compose.yaml down" -ForegroundColor White
Write-Host ""
