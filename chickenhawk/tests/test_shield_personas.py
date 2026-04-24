from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "core" / "shield_personas.py"
SPEC = spec_from_file_location("shield_personas", MODULE_PATH)
shield_personas = module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(shield_personas)


def test_shield_persona_registry_is_valid():
    config = shield_personas.load_shield_personas()
    result = shield_personas.validate_shield_personas(config)

    assert result["valid"] is True
    assert result["persona_count"] == 32
    assert result["squad_count"] == 5
