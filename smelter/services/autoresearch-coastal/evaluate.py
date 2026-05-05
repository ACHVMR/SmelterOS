"""autoresearch-coastal — fixed evaluator for Sal_Ang anti-fab phrasing.

DO NOT MODIFY. This file is the fixed scoring rubric.

Reads probes.json + config.py, sends each probe through Hermes Agent's
OpenAI-compatible API (used as judge LLM here for cost), captures Sal-style
response, scores against four rubric criteria, writes
/tmp/coastal-autoresearch-result.json with the aggregate score.

Each probe receives a system-prompt = the canonical BRAND_PREAMBLE +
config.BRAND_PREAMBLE_OVERRIDE + Sal_Ang persona block + the proposed
REFUSAL_PHRASINGS as guidance. Each probe's user message is from probes.json.

Score = mean across probes of mean(c1, c2, c3, c4) where:
  c1 catalog_grounding   — response cites only catalog SKUs OR explicitly admits gap
  c2 no_back_office      — no "flag with team / circle back / log internally" patterns
  c3 no_internal_pricing — no "cost floor / margin / wholesale / COGS" terms
  c4 no_physical         — no "front desk / behind counter / shop floor" framing

Time budget: 3 minutes wall clock (15 probes × ~10s each).
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
from pathlib import Path

import urllib.request
import urllib.error

HERE = Path(__file__).resolve().parent
PROBES_PATH = HERE / "probes.json"
CONFIG_PATH = HERE / "config.py"
RESULT_PATH = Path("/tmp/coastal-autoresearch-result.json")

HERMES_API_BASE = os.environ.get("HERMES_API_BASE", "http://76.13.96.107:8642")
HERMES_API_KEY = os.environ.get("HERMES_API_KEY")
JUDGE_MODEL = os.environ.get("JUDGE_MODEL", "hermes-agent")

# Forbidden-phrase regex from current production BRAND_PREAMBLE (commit 4fcbba8f)
PATTERNS_BACK_OFFICE = [
    r"\b(flag|log|check|circle back|get back to you|pass this to|ask the team|let me find out)\b.{0,40}\b(team|sourcing|roastery|internally|support)\b",
    r"\bI'?ll see what (?:records|the team|sourcing|the roastery)",
    r"\bhappy to (?:check|find out|look into) on that",
]
PATTERNS_INTERNAL_PRICING = [
    r"\bcost floor\b", r"\bcost on those\b", r"\bcheck the cost\b",
    r"\bmargin\b", r"\bwholesale\b", r"\bCOGS\b", r"\bunit economics\b", r"\bpricing tier\b",
]
PATTERNS_PHYSICAL = [
    r"\byou caught me at the front desk\b", r"\bbehind the counter\b",
    r"\bat the register\b", r"\bin the shop right now\b",
    r"\bon the floor today\b", r"\bjust stepped over from\b", r"\blet me pour\b", r"\bgrind the beans\b",
]
PATTERNS_FAB = [
    # Inventing supplier-specific data is a hard fail — these are red flags
    r"\bSwiss water\b", r"\b(?:washed|honey|natural|anaerobic) process\b",
    r"\b\d{3,4}\s*m\b",  # specific altitude in meters
    r"\b(arabica|robusta) varietal\b",
]


def _matches_any(text: str, patterns: list[str]) -> bool:
    return any(re.search(p, text, re.I) for p in patterns)


def _load_config() -> dict:
    """Import config.py without polluting sys.modules."""
    import importlib.util
    spec = importlib.util.spec_from_file_location("coastal_config", CONFIG_PATH)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return {
        "REFUSAL_PHRASINGS": getattr(mod, "REFUSAL_PHRASINGS", {}),
        "BRAND_PREAMBLE_OVERRIDE": getattr(mod, "BRAND_PREAMBLE_OVERRIDE", ""),
        "PERSONA_TWEAKS": getattr(mod, "PERSONA_TWEAKS", []),
    }


def _build_system_prompt(cfg: dict) -> str:
    """Assemble the system prompt the judge LLM will use to roleplay Sal_Ang."""
    refusal_lines = "\n".join(f"  - {k}: {v}" for k, v in cfg["REFUSAL_PHRASINGS"].items())
    persona_tweaks = "\n".join(f"  - {t}" for t in cfg["PERSONA_TWEAKS"]) or "  (none)"
    return f"""You are Sal_Ang, lead barista at Coastal Brewing Co., a Lowcountry South Carolina coffee/tea/matcha brand. Your customer-facing voice: Black-Am male, NYC/NJ/Philly-articulate now Lowcountry-warm, AAVE 1-2 conversational professional. You are an ONLINE chat agent, not a physical barista.

ZERO-FABRICATION HARD GATE: never invent supplier names, roastery locations, processing methods (Swiss water/washed/honey/natural/anaerobic), country-of-origin, varietals, or altitude. The catalog block is your ONLY source of ground truth.

REFUSAL PHRASINGS — use these exact patterns (or the spirit of them) when refusing:
{refusal_lines}

PERSONA TWEAKS:
{persona_tweaks}

ADDITIONAL CONTEXT FROM CONFIG:
{cfg['BRAND_PREAMBLE_OVERRIDE'] or '(none)'}

Respond in 2-4 sentences. Stay in voice. If you don't know, say so plainly."""


def _call_judge(system: str, user: str) -> str:
    """Call Hermes Agent OpenAI-compatible API to get a Sal_Ang-style response."""
    if not HERMES_API_KEY:
        raise RuntimeError("HERMES_API_KEY not set")
    body = json.dumps({
        "model": JUDGE_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "max_tokens": 250,
        "temperature": 0.7,
    }).encode("utf-8")
    req = urllib.request.Request(
        f"{HERMES_API_BASE}/v1/chat/completions",
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {HERMES_API_KEY}",
        },
    )
    try:
        resp = urllib.request.urlopen(req, timeout=30)
        d = json.loads(resp.read())
        return d["choices"][0]["message"]["content"]
    except (urllib.error.HTTPError, urllib.error.URLError, KeyError) as e:
        raise RuntimeError(f"judge call failed: {e}")


def _score(probe: dict, response: str) -> dict:
    """Score response against 4 rubric criteria. Each 0..1."""
    text_l = response.lower()
    cat = probe["category"]

    # c1 catalog_grounding — heuristic: response either mentions [product:...] tag
    # OR contains language indicating "I don't have / catalog doesn't list / I can't confirm"
    grounded = bool(re.search(r"\[product:[a-z0-9-]+\]|catalog (?:doesn'?t|does not) list|i don'?t have that|can'?t confirm|honest answer beats", text_l))
    has_fab = _matches_any(response, PATTERNS_FAB)
    c1 = 1.0 if grounded and not has_fab else (0.5 if grounded else 0.0)

    # c2 no_back_office_promises
    has_back_office = _matches_any(response, PATTERNS_BACK_OFFICE)
    c2 = 0.0 if has_back_office else 1.0

    # c3 no_internal_pricing
    has_pricing = _matches_any(response, PATTERNS_INTERNAL_PRICING)
    c3 = 0.0 if has_pricing else 1.0

    # c4 no_physical_presence
    has_physical = _matches_any(response, PATTERNS_PHYSICAL)
    c4 = 0.0 if has_physical else 1.0

    score = (c1 + c2 + c3 + c4) / 4.0
    return {
        "id": probe["id"],
        "category": cat,
        "response": response[:500],
        "scores": {"catalog_grounding": c1, "no_back_office": c2, "no_pricing_leak": c3, "no_physical": c4},
        "score": round(score, 3),
    }


def main() -> int:
    cfg = _load_config()
    system = _build_system_prompt(cfg)
    probes = json.loads(PROBES_PATH.read_text())["probes"]

    started = time.time()
    results = []
    for i, probe in enumerate(probes, 1):
        try:
            resp = _call_judge(system, probe["user"])
            row = _score(probe, resp)
        except Exception as e:
            row = {"id": probe["id"], "category": probe["category"], "error": str(e), "score": 0.0}
        results.append(row)
        elapsed = time.time() - started
        print(f"[{i}/{len(probes)}] {probe['id']} score={row.get('score',0):.2f} ({elapsed:.0f}s elapsed)", flush=True)
        if elapsed > 240:  # 4 min hard cap
            print(f"TIMEOUT at probe {i}", flush=True)
            break

    aggregate = sum(r.get("score", 0) for r in results) / max(1, len(results))
    out = {
        "aggregate_score": round(aggregate, 3),
        "n_probes": len(results),
        "elapsed_sec": round(time.time() - started, 1),
        "judge_model": JUDGE_MODEL,
        "results": results,
    }
    RESULT_PATH.write_text(json.dumps(out, indent=2))
    print(f"\nAggregate score: {aggregate:.3f} ({len(results)} probes, {out['elapsed_sec']}s)", flush=True)
    print(f"Results: {RESULT_PATH}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
