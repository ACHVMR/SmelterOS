"""autoresearch-coastal iteration 01 — inject catalog snippet into BRAND_PREAMBLE_OVERRIDE.

Hypothesis: baseline c1 catalog_grounding scored 0.5 because the judge LLM
had no SKU list. Injecting the live catalog (top 8 SKUs) should let the
judge recommend real SKUs and lift c1 toward 1.0.

Run from /root/autoresearch-coastal/ on VPS2.
"""
import json
import re
import urllib.request
from pathlib import Path

CFG_PATH = Path("/root/autoresearch-coastal/config.py")
BACKUP = Path("/root/autoresearch-coastal/config.py.bak-baseline")

# 1. Backup current
if not BACKUP.exists():
    BACKUP.write_text(CFG_PATH.read_text())
    print(f"backup -> {BACKUP}")

# 2. Fetch live catalog snippet
catalog = json.loads(
    urllib.request.urlopen("https://brewing.foai.cloud/api/catalog", timeout=10).read()
)
items = catalog["products"][:8]
lines = ["CATALOG (your only source of truth — only recommend SKUs listed here):"]
for p in items:
    sku = p.get("id", "?")
    name = (p.get("name", "?") or "?")[:40]
    cat = p.get("category", "?")
    msrp = p.get("msrp", "?")
    lines.append(f"  - {sku}: {name} | {cat} | ${msrp}")
catalog_block = "\n".join(lines)
print(f"fetched {len(items)} SKUs")

# 3. Build new override + write to config.py
new_override = (
    catalog_block
    + "\n\nIf a customer asks about a product not in this list, say plainly that you don't "
    + "have that one and offer the closest catalog SKU. Never invent attributes (origin, "
    + "processing, altitude, varietal, certification) for any SKU."
)

content = CFG_PATH.read_text()
new_block = "BRAND_PREAMBLE_OVERRIDE = " + json.dumps(new_override)
content = re.sub(r'BRAND_PREAMBLE_OVERRIDE\s*=\s*""', new_block, content, count=1)
CFG_PATH.write_text(content)
print(f"config.py updated (override len={len(new_override)} chars)")
