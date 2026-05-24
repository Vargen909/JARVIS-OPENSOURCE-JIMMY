"""Local API key management.

Keys are stored only in the local .env file. The endpoint only accepts
environment variable names declared by engines.yaml so arbitrary env writes are
not possible from the UI.
"""

from __future__ import annotations

import os
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..config import REPO_ROOT, engines_config
from ..runtime import reload_runtime_config
from ..safety import safe_log_event

router = APIRouter(prefix="/api-keys", tags=["api-keys"])

ENV_PATH = REPO_ROOT / ".env"


class ApiKeyIn(BaseModel):
    env_name: str = Field(..., min_length=1)
    value: str = Field(..., min_length=1)


def _allowed_keys() -> dict[str, dict]:
    allowed: dict[str, dict] = {}
    for engine_id, spec in (engines_config().get("engines") or {}).items():
        api_key_env = spec.get("api_key_env")
        if api_key_env:
            allowed[api_key_env] = {
                "engine_id": engine_id,
                "label": spec.get("label", engine_id),
            }
    return allowed


def _read_env_lines() -> list[str]:
    if not ENV_PATH.exists():
        return []
    return ENV_PATH.read_text(encoding="utf-8").splitlines()


def _write_env_value(env_name: str, value: str) -> None:
    lines = _read_env_lines()
    next_line = f"{env_name}={value.strip()}"
    found = False
    out: list[str] = []

    for line in lines:
        if line.startswith(f"{env_name}="):
            out.append(next_line)
            found = True
        else:
            out.append(line)

    if not found:
        if out and out[-1].strip():
            out.append("")
        out.append(next_line)

    ENV_PATH.write_text("\n".join(out) + "\n", encoding="utf-8")
    os.environ[env_name] = value.strip()


def _masked(value: str | None) -> str | None:
    if not value:
        return None
    if len(value) <= 8:
        return "••••"
    return f"{value[:4]}••••{value[-4:]}"


@router.get("")
def list_api_keys():
    allowed = _allowed_keys()
    return [
        {
            "env_name": env_name,
            "engine_id": meta["engine_id"],
            "label": meta["label"],
            "configured": bool(os.environ.get(env_name)),
            "masked": _masked(os.environ.get(env_name)),
        }
        for env_name, meta in allowed.items()
    ]


@router.post("")
def save_api_key(payload: ApiKeyIn):
    allowed = _allowed_keys()
    if payload.env_name not in allowed:
        raise HTTPException(status_code=400, detail="Unsupported API key name")

    _write_env_value(payload.env_name, payload.value)

    reloaded = False
    try:
        reload_runtime_config()
        reloaded = True
    except Exception as e:  # pragma: no cover - defensive
        safe_log_event("api_keys.reload_failed", error=str(e))

    safe_log_event(
        "api_keys.saved",
        env_name=payload.env_name,
        engine_id=allowed[payload.env_name]["engine_id"],
        reloaded=reloaded,
    )

    return {
        "ok": True,
        "env_name": payload.env_name,
        "engine_id": allowed[payload.env_name]["engine_id"],
        "configured": True,
        "masked": _masked(payload.value),
        "reloaded": reloaded,
    }
