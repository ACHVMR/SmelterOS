"""Shield persona registry loader + validation for v1.6."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Tuple

YAML_PATH = Path(__file__).resolve().parent.parent / "config" / "shield_personas.yml"
JSON_PATH = Path(__file__).resolve().parent.parent / "config" / "shield_personas.json"
REQUIRED_SQUADS = {"black", "blue", "purple", "white", "gold_platinum"}
EXPECTED_PERSONA_TOTAL = 32


def _load_yaml(path: Path) -> dict:
    try:
        import yaml  # type: ignore
    except ModuleNotFoundError as exc:
        raise RuntimeError("PyYAML is not installed in this runtime.") from exc

    with path.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def load_shield_personas(path: Path | None = None) -> dict:
    """Load shield persona configuration from YAML (preferred) or JSON fallback."""
    if path is not None:
        with path.open("r", encoding="utf-8") as f:
            if path.suffix.lower() == ".json":
                return json.load(f)
        return _load_yaml(path)

    if YAML_PATH.exists():
        try:
            data = _load_yaml(YAML_PATH)
            if isinstance(data, dict):
                return data
        except RuntimeError:
            pass

    with JSON_PATH.open("r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, dict):
        raise ValueError("Shield persona configuration must deserialize to a dictionary.")

    return data


def _iter_personas(config: dict):
    squads = config.get("squads", {})
    for squad_name, squad in squads.items():
        for persona in squad.get("personas", []):
            yield squad_name, persona


def validate_shield_personas(config: dict) -> Dict[str, object]:
    """Validate core invariants from the v1.6 manifest."""
    checks: List[Tuple[str, bool]] = []

    squads = config.get("squads", {})
    checks.append(("required squads present", REQUIRED_SQUADS.issubset(squads.keys())))

    persona_ids = []
    kunyas = []
    squad_constraints = []

    for _, persona in _iter_personas(config):
        persona_ids.append(persona.get("persona_id"))
        kunyas.append(persona.get("kunya"))

    for squad in squads.values():
        squad_constraints.append(bool(squad.get("squad_constraint")))

    checks.append(("exactly 32 personas defined", len(persona_ids) == EXPECTED_PERSONA_TOTAL))
    checks.append(("persona ids are unique", len(set(persona_ids)) == len(persona_ids)))
    checks.append(("kunya names are unique", len(set(kunyas)) == len(kunyas)))
    checks.append(("all persona ids use Lil_*_Hawk pattern", all(pid and pid.startswith("Lil_") and pid.endswith("_Hawk") for pid in persona_ids)))
    checks.append(("every squad has a categorical squad_constraint", all(squad_constraints)))

    return {
        "valid": all(passed for _, passed in checks),
        "checks": [{"rule": rule, "passed": passed} for rule, passed in checks],
        "squad_count": len(squads),
        "persona_count": len(persona_ids),
    }


def load_and_validate_shield_personas(path: Path | None = None) -> Dict[str, object]:
    """Convenience helper for loading + validating v1.6 personas."""
    config = load_shield_personas(path)
    validation = validate_shield_personas(config)
    return {"config": config, "validation": validation}
