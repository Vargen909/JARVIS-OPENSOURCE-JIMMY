"""Plugin discovery (skeleton).

Plugins live in /plugins/<name>/manifest.json. This endpoint lists available
plugins and their metadata. Activation/deactivation per user is stored in the
user's preferences (future extension).
"""

from __future__ import annotations

import json
from typing import List

from fastapi import APIRouter

from ..config import PLUGINS_DIR

router = APIRouter(prefix="/plugins", tags=["plugins"])


@router.get("")
def list_plugins() -> List[dict]:
    out: list[dict] = []
    if not PLUGINS_DIR.exists():
        return out
    for entry in PLUGINS_DIR.iterdir():
        if not entry.is_dir():
            continue
        manifest = entry / "manifest.json"
        if not manifest.exists():
            continue
        try:
            data = json.loads(manifest.read_text(encoding="utf-8"))
            data["id"] = entry.name
            out.append(data)
        except Exception:
            continue
    return out
