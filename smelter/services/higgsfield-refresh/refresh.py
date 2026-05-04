"""Higgsfield device-auth token refresh daemon.

Rotates access_token + refresh_token for each labeled identity (nemoclaw,
hermes) by POSTing the current refresh_token to /refresh and writing the new
pair atomically to disk + openclaw vault.

Run on VPS2 via systemd timer every 6h. Tokens have 7-day refresh window;
6h cadence keeps a fresh rotation buffer of 6.75 days before any token
becomes unrecoverable.

Usage:
  python refresh.py                  # rotate all labels in CFG_DIR
  python refresh.py --label nemoclaw # rotate one
  python refresh.py --dry-run        # show what would rotate, no calls
"""
from __future__ import annotations

import argparse
import datetime as _dt
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

DEVICE_AUTH = "https://fnf-device-auth.higgsfield.ai"
CFG_DIR = Path(os.environ.get("HIGGSFIELD_CFG_DIR", "/root/.higgsfield"))
LOG_PATH = CFG_DIR / "refresh.log"


def _log(msg: str) -> None:
    ts = _dt.datetime.now(_dt.timezone.utc).isoformat()
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    try:
        CFG_DIR.mkdir(parents=True, exist_ok=True)
        with LOG_PATH.open("a") as f:
            f.write(line + "\n")
    except Exception:
        pass


def _load_token(label: str) -> dict | None:
    p = CFG_DIR / f"token_{label}.json"
    if not p.exists():
        _log(f"[{label}] no token file at {p}")
        return None
    try:
        return json.loads(p.read_text())
    except Exception as e:
        _log(f"[{label}] parse failure: {e}")
        return None


def _save_token(label: str, body: dict) -> None:
    """Atomic write: tmp file + rename."""
    p = CFG_DIR / f"token_{label}.json"
    tmp = p.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(body, indent=2))
    try:
        os.chmod(tmp, 0o600)
    except Exception:
        pass
    os.replace(tmp, p)
    _log(f"[{label}] token saved → {p}")


def _push_to_vault(label: str, access: str, refresh: str) -> None:
    """SSH-pipe the new token pair into the openclaw vault on myclaw-vps.
    Updates HIGGSFIELD_TOKEN_<LABEL> and HIGGSFIELD_REFRESH_<LABEL>.
    """
    upper = label.upper()
    keys = {
        f"HIGGSFIELD_TOKEN_{upper}": access,
        f"HIGGSFIELD_REFRESH_{upper}": refresh,
    }
    # Build a small upsert script that runs on myclaw-vps
    script = "set -e\nENV_FILE=/docker/openclaw-sop5/.env\n"
    for k, v in keys.items():
        # Escape replacement for sed (slashes, ampersands, pipes)
        v_esc = v.replace("\\", "\\\\").replace("|", "\\|").replace("&", "\\&")
        script += (
            f'if grep -qE "^{k}=" $ENV_FILE; then\n'
            f'  sed -i "s|^{k}=.*|{k}={v_esc}|" $ENV_FILE\n'
            f"else\n"
            f'  printf "%s\\n" "{k}={v_esc}" >> $ENV_FILE\n'
            f"fi\n"
        )
    # Recreate openclaw to pick up new env_file values
    script += "cd /docker/openclaw-sop5 && docker compose up -d > /dev/null 2>&1\n"
    try:
        proc = subprocess.run(
            ["ssh", "myclaw-vps", "bash", "-s"],
            input=script.encode(),
            capture_output=True,
            timeout=60,
        )
        if proc.returncode == 0:
            _log(f"[{label}] vault updated (myclaw-vps openclaw-sop5)")
        else:
            _log(f"[{label}] vault update FAILED: {proc.stderr.decode('utf-8', 'replace')[:200]}")
    except subprocess.TimeoutExpired:
        _log(f"[{label}] vault update TIMEOUT")
    except Exception as e:
        _log(f"[{label}] vault update EXC: {e}")


def _refresh_one(label: str, dry_run: bool = False) -> bool:
    tok = _load_token(label)
    if tok is None:
        return False
    refresh_token = tok.get("refresh_token")
    if not refresh_token:
        _log(f"[{label}] no refresh_token in saved file")
        return False
    if dry_run:
        _log(f"[{label}] DRY RUN — would rotate (refresh_token len={len(refresh_token)})")
        return True
    body = json.dumps({"refresh_token": refresh_token}).encode("utf-8")
    req = urllib.request.Request(
        f"{DEVICE_AUTH}/refresh",
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "User-Agent": "higgsfield-refresh-daemon/1.0",
        },
    )
    try:
        resp = urllib.request.urlopen(req, timeout=20)
        new = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8", "replace")[:300]
        _log(f"[{label}] HTTP {e.code} on refresh: {err}")
        return False
    except Exception as e:
        _log(f"[{label}] refresh request failed: {e}")
        return False
    if "access_token" not in new or "refresh_token" not in new:
        _log(f"[{label}] response missing token fields: {list(new.keys())}")
        return False
    _save_token(label, new)
    _push_to_vault(label, new["access_token"], new["refresh_token"])
    _log(
        f"[{label}] OK — access_expires_in={new.get('expires_in')}s, "
        f"refresh_expires_in={new.get('refresh_expires_in')}s"
    )
    return True


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--label", help="single label (default: rotate all in CFG_DIR)")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if args.label:
        labels = [args.label]
    else:
        labels = sorted(
            p.stem.removeprefix("token_")
            for p in CFG_DIR.glob("token_*.json")
        )
    if not labels:
        _log("no token files found in CFG_DIR")
        return 1

    _log(f"rotating {len(labels)} labels: {labels}")
    successes = sum(1 for label in labels if _refresh_one(label, dry_run=args.dry_run))
    _log(f"done: {successes}/{len(labels)} OK")
    return 0 if successes == len(labels) else 2


if __name__ == "__main__":
    sys.exit(main())
