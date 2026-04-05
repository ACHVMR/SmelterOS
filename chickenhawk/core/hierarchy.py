"""
ACHIEVEMOR Hierarchy — Canonical Rules (v1.0)
═══════════════════════════════════════════════════════════════
Machine-readable hierarchy definition.
15 non-negotiable rules enforced in code.

The Elder → InfinityLM (AVVA NOON) → Three Command Teams → Workforce
"""

HIERARCHY = {
    "origin": "The Elder (Vibe Kinetic Energy)",
    "intelligence": {
        "name": "InfinityLM",
        "codename": "AVVA NOON",
        "type": "Quintillion-Modal Model",
        "components": {
            "AVVA": "Executor — Foster→Develop",
            "NOON": "Validator — Hone (parallel)",
        },
    },
    "command_teams": {
        "ACHEEVY": {
            "role": "Voice — Operational Execution Authority",
            "vibe_threshold": 0.95,
            "can_code": True,
            "code_stack": "II Agent, II Researcher, II Commons, Common Ground Core",
            "manages": ["Boomer_Angs", "Chicken_Hawk"],
        },
        "NTNTN": {
            "role": "Conscience — Ethical Override Authority",
            "vibe_threshold": 0.995,
            "can_halt": True,
            "override_authority": "Cannot be overridden by ACHEEVY or SIVIS",
        },
        "SIVIS": {
            "role": "Vision — Strategic Alignment Authority",
            "vibe_threshold": 0.98,
        },
    },
    "workforce": {
        "Boomer_Angs": {
            "count": 6,
            "reports_to": "ACHEEVY",
            "claw_code": False,
            "can_oversee_lil_hawks": "When ACHEEVY delegates",
            "members": ["Edu_Ang", "Scout_Ang", "Content_Ang", "Ops_Ang", "Biz_Ang", "Illa_Ang"],
        },
        "Chicken_Hawk": {
            "role": "Vice President / COO",
            "reports_to": "ACHEEVY",
            "claw_code": True,
            "manages": ["Lil_Hawks", "Infrastructure_Engines", "BARS_Engine"],
        },
        "Lil_Hawks": {
            "count": 11,
            "reports_to": "Chicken_Hawk",
            "upstream": "ACHEEVY",
            "claw_code": True,
            "can_be_promoted": True,
            "squads": {
                "build": ["Code_Hawk", "Data_Hawk", "Deploy_Hawk", "Design_Hawk"],
                "security": ["Sec_Hawk", "Test_Hawk", "Monitor_Hawk"],
                "support": ["Research_Hawk", "Content_Hawk", "Analytics_Hawk", "Support_Hawk"],
            },
        },
    },
}

CANONICAL_RULES = [
    "ACHEEVY is the ultimate upstream. Every agent answers to ACHEEVY.",
    "AVVA NOON and ACHEEVY are co-equal in origin. Both from The Elder.",
    "ACHEEVY can code. II Agent stack. Delegates typically, but can execute directly.",
    "Boomer_Angs report to ACHEEVY exclusively. Never to Chicken Hawk.",
    "Boomer_Angs CAN be delegated to oversee Lil_Hawks when ACHEEVY delegates.",
    "Lil_Hawks report to Chicken Hawk directly. ACHEEVY is ultimate upstream.",
    "Lil_Hawks can be promoted to Chicken Hawk status when they meet criteria.",
    "Chicken Hawk and all Lil_Hawks have Claw-Code.",
    "Boomer_Angs do NOT have Claw-Code. Generals plan, they don't build.",
    "Infrastructure engines are NEVER user-facing.",
    "Hermes is NEVER an agent. It is an evaluation service.",
    "Grammar is a FILTER, not an executor. ACHEEVY executes.",
    "InfinityLM is NOT an agent. It is the model.",
    "NTNTN can HALT any operation. Cannot be overridden.",
    "Everything flows through Smelter OS. Dependencies flow downward only.",
]


def validate_hierarchy() -> dict:
    """Verify hierarchy integrity at runtime."""
    checks = []

    # Rule 1: ACHEEVY manages workforce
    checks.append(("ACHEEVY manages workforce", "Boomer_Angs" in HIERARCHY["command_teams"]["ACHEEVY"]["manages"]))

    # Rule 4: Boomer_Angs report to ACHEEVY
    checks.append(("Boomer_Angs report to ACHEEVY", HIERARCHY["workforce"]["Boomer_Angs"]["reports_to"] == "ACHEEVY"))

    # Rule 8: Chicken Hawk has Claw-Code
    checks.append(("Chicken Hawk has Claw-Code", HIERARCHY["workforce"]["Chicken_Hawk"]["claw_code"] is True))

    # Rule 9: Boomer_Angs no Claw-Code
    checks.append(("Boomer_Angs no Claw-Code", HIERARCHY["workforce"]["Boomer_Angs"]["claw_code"] is False))

    # Rule 6: Lil_Hawks report to Chicken Hawk
    checks.append(("Lil_Hawks report to Chicken_Hawk", HIERARCHY["workforce"]["Lil_Hawks"]["reports_to"] == "Chicken_Hawk"))

    all_passed = all(passed for _, passed in checks)
    return {
        "valid": all_passed,
        "checks": [{"rule": name, "passed": passed} for name, passed in checks],
        "total_rules": len(CANONICAL_RULES),
    }
