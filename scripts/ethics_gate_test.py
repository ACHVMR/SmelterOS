#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
SmelterOS-ORACLE Ethics Gate Test
Verifies virtue score >= 0.995 for production deployment
═══════════════════════════════════════════════════════════════════════════════
"""

import argparse
import sys
import json
from typing import Dict, Any, Tuple
import requests
from datetime import datetime


# =============================================================================
# CONFIGURATION
# =============================================================================

DEFAULT_BASE_URL = "https://smelter-workers-132049061623.us-central1.run.app"
VIRTUE_THRESHOLD = 0.995

# Full C-Suite for maximum virtue score
FULL_CSUITE = [
    "acheevy",
    "boomer-cto",
    "boomer-cmo",
    "boomer-cfo",
    "boomer-coo",
    "boomer-cpo",
    "rlm-research",
]

# Test scenarios
TEST_SCENARIOS = [
    {
        "name": "Full C-Suite + Production Context",
        "command": "CTO: Deploy to production with full audit",
        "agents": FULL_CSUITE,
        "context": {
            "env": "production",
            "intent": "verified",
            "fdh_phase": "hone",
            "audit": True,
            "reflective": True,
        },
        "expected_allowed": True,
        "expected_min_score": 0.995,
    },
    {
        "name": "Single Agent (should fail)",
        "command": "Deploy to production",
        "agents": ["boomer-cto"],
        "context": {},
        "expected_allowed": False,
        "expected_min_score": 0.0,
    },
    {
        "name": "C-Suite without context",
        "command": "Deploy to staging",
        "agents": FULL_CSUITE,
        "context": {},
        "expected_allowed": True,  # Base C-Suite should pass
        "expected_min_score": 0.995,
    },
    {
        "name": "Orchestrator + Research + Context",
        "command": "Research and analyze deployment options",
        "agents": ["acheevy", "rlm-research"],
        "context": {
            "env": "development",
            "intent": "research",
            "reflective": True,
        },
        "expected_allowed": False,  # Not enough agents
        "expected_min_score": 0.0,
    },
]


# =============================================================================
# TEST FUNCTIONS
# =============================================================================

def test_ethics_gate(
    base_url: str,
    scenario: Dict[str, Any],
    verbose: bool = False
) -> Tuple[bool, Dict[str, Any]]:
    """Test a single ethics gate scenario."""
    
    url = f"{base_url}/strata/ethics-gate"
    payload = {
        "command": scenario["command"],
        "agents": scenario["agents"],
        "context": scenario.get("context", {}),
    }
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        
        if response.status_code != 200:
            return False, {
                "error": f"HTTP {response.status_code}",
                "response": response.text[:200],
            }
        
        data = response.json()
        
        allowed = data.get("allowed", False)
        virtue_score = data.get("virtue_score", 0)
        
        # Check against expectations
        allowed_match = allowed == scenario["expected_allowed"]
        score_match = virtue_score >= scenario["expected_min_score"]
        
        passed = allowed_match and (score_match or not scenario["expected_allowed"])
        
        result = {
            "scenario": scenario["name"],
            "allowed": allowed,
            "virtue_score": virtue_score,
            "expected_allowed": scenario["expected_allowed"],
            "expected_min_score": scenario["expected_min_score"],
            "allowed_match": allowed_match,
            "score_match": score_match,
            "passed": passed,
            "breakdown": data.get("breakdown", {}),
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        if verbose:
            result["request"] = payload
            result["response"] = data
        
        return passed, result
        
    except requests.exceptions.Timeout:
        return False, {"error": "Timeout", "scenario": scenario["name"]}
    except Exception as e:
        return False, {"error": str(e), "scenario": scenario["name"]}


def run_all_tests(
    base_url: str,
    verbose: bool = False,
    critical_only: bool = False
) -> Tuple[int, int, list]:
    """Run all ethics gate tests."""
    
    print("\n" + "═" * 60)
    print("  SmelterOS-ORACLE Ethics Gate Tests")
    print(f"  Target: {base_url}")
    print(f"  Virtue Threshold: {VIRTUE_THRESHOLD}")
    print("═" * 60 + "\n")
    
    passed = 0
    failed = 0
    results = []
    
    scenarios = TEST_SCENARIOS if not critical_only else [TEST_SCENARIOS[0]]
    
    for scenario in scenarios:
        name = scenario["name"]
        print(f"  Testing: {name}...")
        print(f"    Agents: {len(scenario['agents'])}")
        print(f"    Expected: allowed={scenario['expected_allowed']}, score>={scenario['expected_min_score']}")
        
        success, result = test_ethics_gate(base_url, scenario, verbose)
        
        if success:
            passed += 1
            score = result.get("virtue_score", 0)
            allowed = result.get("allowed", False)
            print(f"    ✅ PASSED - allowed={allowed}, virtue_score={score:.4f}")
        else:
            failed += 1
            if "error" in result:
                print(f"    ❌ FAILED - {result['error']}")
            else:
                score = result.get("virtue_score", 0)
                allowed = result.get("allowed", False)
                print(f"    ❌ FAILED - allowed={allowed}, virtue_score={score:.4f}")
                if not result.get("allowed_match"):
                    print(f"       Expected allowed={scenario['expected_allowed']}")
                if not result.get("score_match") and scenario["expected_allowed"]:
                    print(f"       Score {score:.4f} < threshold {scenario['expected_min_score']}")
        
        results.append(result)
        print()
    
    return passed, failed, results


def production_gate_check(base_url: str) -> bool:
    """
    Single critical check for CI/CD pipeline.
    Returns True if production deployment is approved.
    """
    print("\n" + "═" * 60)
    print("  Production Ethics Gate Check")
    print("═" * 60 + "\n")
    
    scenario = TEST_SCENARIOS[0]  # Full C-Suite + Production Context
    success, result = test_ethics_gate(base_url, scenario, verbose=False)
    
    if success:
        virtue_score = result.get("virtue_score", 0)
        print(f"  ✅ APPROVED")
        print(f"     Virtue Score: {virtue_score:.4f}")
        print(f"     Threshold:    {VIRTUE_THRESHOLD}")
        print(f"     Status:       Production deployment permitted")
        return True
    else:
        virtue_score = result.get("virtue_score", 0)
        print(f"  ❌ DENIED")
        print(f"     Virtue Score: {virtue_score:.4f}")
        print(f"     Threshold:    {VIRTUE_THRESHOLD}")
        print(f"     Status:       Production deployment blocked")
        
        if "breakdown" in result:
            print(f"\n  Breakdown:")
            for key, value in result["breakdown"].items():
                print(f"    {key}: {value}")
        
        return False


# =============================================================================
# CLI
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="SmelterOS-ORACLE Ethics Gate Test"
    )
    parser.add_argument(
        "--url",
        default=DEFAULT_BASE_URL,
        help=f"Base URL to test (default: {DEFAULT_BASE_URL})"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Show detailed output including request/response"
    )
    parser.add_argument(
        "--production",
        action="store_true",
        help="Run only the critical production gate check"
    )
    parser.add_argument(
        "--output", "-o",
        help="Write results to JSON file"
    )
    parser.add_argument(
        "--exit-on-fail",
        action="store_true",
        help="Exit with code 1 if any test fails"
    )
    
    args = parser.parse_args()
    
    if args.production:
        # Production gate check only
        approved = production_gate_check(args.url)
        
        if args.output:
            with open(args.output, "w") as f:
                json.dump({
                    "approved": approved,
                    "timestamp": datetime.utcnow().isoformat(),
                    "threshold": VIRTUE_THRESHOLD,
                }, f, indent=2)
        
        sys.exit(0 if approved else 1)
    
    # Run all tests
    passed, failed, results = run_all_tests(
        args.url,
        verbose=args.verbose,
        critical_only=False
    )
    
    # Summary
    print("═" * 60)
    print("  Summary")
    print("═" * 60)
    print(f"  Total:  {passed + failed}")
    print(f"  Passed: {passed}")
    print(f"  Failed: {failed}")
    print("═" * 60 + "\n")
    
    # Write results to file if requested
    if args.output:
        with open(args.output, "w") as f:
            json.dump({
                "passed": passed,
                "failed": failed,
                "results": results,
                "timestamp": datetime.utcnow().isoformat(),
            }, f, indent=2)
        print(f"Results written to: {args.output}")
    
    # Exit code
    if args.exit_on_fail and failed > 0:
        sys.exit(1)
    
    sys.exit(0)


if __name__ == "__main__":
    main()
