"""Settings reload endpoint.

POST /settings/reload re-reads .env + engines.yaml and rebuilds engine
instances so newly saved API keys / base URLs are picked up without a
backend restart. The response contains only ids, labels, and booleans —
never secret values.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..runtime import reload_runtime_config
from ..safety import redact, safe_log_event

router = APIRouter(prefix="/settings", tags=["settings"])


@router.post("/reload")
def reload_settings():
    try:
        return reload_runtime_config()
    except Exception as e:  # pragma: no cover - defensive
        safe_log_event("settings.reload_failed", error=redact(str(e)))
        raise HTTPException(500, "Reload failed")
