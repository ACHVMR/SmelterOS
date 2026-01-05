#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
SmelterOS-ORACLE Health Check Script
Verifies Cloud Run service and Agent Engine endpoints
═══════════════════════════════════════════════════════════════════════════════
"""

import argparse
import sys
import time
from typing import Dict, Any, List, Tuple
import requests
from datetime import datetime


# =============================================================================
# CONFIGURATION
# =============================================================================

DEFAULT_BASE_URL = "https://smelter-workers-132049061623.us-central1.run.app"

HEALTH_ENDPOINTS = [
    ("/health", "GET", None, ["status"]),
    ("/oracle/agents", "GET", None, ["agents"]),
    ("/strata/tools", "GET", None, ["tools"]),
    ("/adk/garden/catalog", "GET", None, ["models", "tools"]),
    ("/alchemist/tools", "GET", None, ["tools", "count"]),
]

CRITICAL_FIELDS = {
    "/health": {"status": "ok"},
    "/oracle/agents": {"count": 7},  # Expect at least 7 agents
    "/strata/tools": {"count": 10},  # Expect at least 10 STRATA tools
    "/adk/garden/catalog": {"models_count": 4},  # Expect 4 models
    "/alchemist/tools": {"count": 300},  # Expect 300+ tools
}


# =============================================================================
# HEALTH CHECK FUNCTIONS
# =============================================================================

def check_endpoint(
    base_url: str,
    path: str,
    method: str = "GET",
    payload: Dict = None,
    expected_fields: List[str] = None,
    timeout: int = 30
) -> Tuple[bool, Dict[str, Any]]:
    """Check a single endpoint."""
    url = f"{base_url}{path}"
    
    try:
        start_time = time.time()
        
        if method == "GET":
            response = requests.get(url, timeout=timeout)
        elif method == "POST":
            response = requests.post(url, json=payload, timeout=timeout)
        else:
            return False, {"error": f"Unsupported method: {method}"}
        
        elapsed_ms = int((time.time() - start_time) * 1000)
        
        result = {
            "url": url,
            "status_code": response.status_code,
            "elapsed_ms": elapsed_ms,
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        if response.status_code != 200:
            result["error"] = f"HTTP {response.status_code}"
            return False, result
        
        try:
            data = response.json()
            result["data"] = data
            
            # Check expected fields
            if expected_fields:
                missing = [f for f in expected_fields if f not in data]
                if missing:
                    result["warning"] = f"Missing fields: {missing}"
            
            # Check critical values
            critical = CRITICAL_FIELDS.get(path, {})
            for key, expected in critical.items():
                actual = data.get(key)
                if key == "count" and isinstance(actual, int):
                    if actual < expected:
                        result["warning"] = f"{key}={actual}, expected >={expected}"
                elif actual != expected:
                    result["warning"] = f"{key}={actual}, expected={expected}"
            
            return True, result
            
        except Exception as e:
            result["parse_error"] = str(e)
            result["raw"] = response.text[:200]
            return True, result  # Still successful if HTTP 200
            
    except requests.exceptions.Timeout:
        return False, {"url": url, "error": "Timeout"}
    except requests.exceptions.ConnectionError:
        return False, {"url": url, "error": "Connection failed"}
    except Exception as e:
        return False, {"url": url, "error": str(e)}


def run_health_checks(
    base_url: str,
    verbose: bool = False
) -> Tuple[int, int, List[Dict[str, Any]]]:
    """Run all health checks."""
    passed = 0
    failed = 0
    results = []
    
    print("\n" + "═" * 60)
    print("  SmelterOS-ORACLE Health Check")
    print(f"  Target: {base_url}")
    print("═" * 60 + "\n")
    
    for path, method, payload, expected_fields in HEALTH_ENDPOINTS:
        print(f"  Checking {path}... ", end="", flush=True)
        
        success, result = check_endpoint(
            base_url, path, method, payload, expected_fields
        )
        
        if success:
            passed += 1
            elapsed = result.get("elapsed_ms", "?")
            print(f"✅ OK ({elapsed}ms)")
            
            if verbose:
                data = result.get("data", {})
                if "status" in data:
                    print(f"      status: {data['status']}")
                if "count" in data:
                    print(f"      count: {data['count']}")
                if "agents" in data:
                    print(f"      agents: {len(data['agents'])}")
                if "tools" in data:
                    print(f"      tools: {len(data['tools'])}")
                if "models" in data:
                    print(f"      models: {len(data['models'])}")
            
            if "warning" in result:
                print(f"      ⚠️  {result['warning']}")
        else:
            failed += 1
            error = result.get("error", "Unknown error")
            print(f"❌ FAILED - {error}")
        
        results.append({"path": path, "success": success, **result})
    
    return passed, failed, results


def test_ethics_gate(base_url: str, verbose: bool = False) -> Tuple[bool, Dict[str, Any]]:
    """Test the ethics gate endpoint."""
    print("\n" + "─" * 60)
    print("  Ethics Gate Test")
    print("─" * 60 + "\n")
    
    payload = {
        "command": "CTO: Deploy to production",
        "agents": [
            "acheevy",
            "boomer-cto",
            "boomer-cfo",
            "boomer-coo",
            "boomer-cmo",
            "boomer-cpo",
            "rlm-research"
        ],
        "context": {
            "env": "production",
            "intent": "verified",
            "fdh_phase": "hone"
        }
    }
    
    print(f"  Testing with full C-Suite + context...")
    
    success, result = check_endpoint(
        base_url,
        "/strata/ethics-gate",
        "POST",
        payload,
        ["allowed", "virtue_score"]
    )
    
    if success:
        data = result.get("data", {})
        allowed = data.get("allowed", False)
        virtue_score = data.get("virtue_score", 0)
        
        if allowed and virtue_score >= 0.995:
            print(f"  ✅ PASSED - virtue_score: {virtue_score:.3f} >= 0.995")
            return True, result
        else:
            print(f"  ❌ FAILED - allowed={allowed}, virtue_score={virtue_score:.3f}")
            return False, result
    else:
        print(f"  ❌ FAILED - {result.get('error', 'Unknown')}")
        return False, result


# =============================================================================
# CLI
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="SmelterOS-ORACLE Health Check"
    )
    parser.add_argument(
        "--url",
        default=DEFAULT_BASE_URL,
        help=f"Base URL to check (default: {DEFAULT_BASE_URL})"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Show detailed output"
    )
    parser.add_argument(
        "--ethics",
        action="store_true",
        help="Also test the ethics gate"
    )
    parser.add_argument(
        "--exit-on-fail",
        action="store_true",
        help="Exit with code 1 if any check fails"
    )
    
    args = parser.parse_args()
    
    # Run health checks
    passed, failed, results = run_health_checks(args.url, args.verbose)
    
    # Run ethics gate test if requested
    ethics_passed = True
    if args.ethics:
        ethics_passed, ethics_result = test_ethics_gate(args.url, args.verbose)
    
    # Summary
    print("\n" + "═" * 60)
    print("  Summary")
    print("═" * 60)
    print(f"  Health Checks: {passed}/{passed + failed} passed")
    if args.ethics:
        ethics_icon = "✅" if ethics_passed else "❌"
        print(f"  Ethics Gate:   {ethics_icon} {'PASSED' if ethics_passed else 'FAILED'}")
    print("═" * 60 + "\n")
    
    # Exit code
    if args.exit_on_fail and (failed > 0 or (args.ethics and not ethics_passed)):
        sys.exit(1)
    
    sys.exit(0)


if __name__ == "__main__":
    main()
