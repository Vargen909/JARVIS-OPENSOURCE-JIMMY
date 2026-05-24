"""Runtime config reload + safe provider reinitialization.

This module is intentionally tiny and side-effect aware: it reloads
``.env``, clears the cached YAML configs, and rebuilds the engine
registry. Existing in-memory user/session state (DB sessions, conversation
rows, JarvisProvider state in the frontend) are untouched.

No secret values are returned anywhere — only ids, labels, and booleans.
"""

from __future__ import annotations

import os
from typing import Any, Dict

from dotenv import load_dotenv

from .config import REPO_ROOT, assistant_config, engines_config
from .engines import registry as _engine_registry
from .safety import safe_log_event


def _safe_summary() -> Dict[str, Any]:
    """Build a status payload that NEVER contains secret values."""
    cfg = engines_config().get("engines") or {}
    engines: list[dict] = []
    for engine_id, spec in cfg.items():
        api_key_env = spec.get("api_key_env")
        configured = bool(os.environ.get(api_key_env)) if api_key_env else True
        engines.append(
            {
                "id": engine_id,
                "label": spec.get("label", engine_id),
                "provider": spec.get("provider"),
                "requires_key": bool(spec.get("requires_key", False)),
                "configured": configured,
            }
        )
    return {
        "ok": True,
        "engines": engines,
        "engine_count": len(engines),
        "configured_count": sum(1 for e in engines if e["configured"]),
    }


def reload_runtime_config() -> Dict[str, Any]:
    """Re-read ``.env`` + ``engines.yaml`` and rebuild engine instances.

    Safe to call repeatedly. Never raises on bad/missing keys; the
    registry's ``is_available()`` simply returns ``False`` for engines
    without a valid configuration.
    """
    env_path = REPO_ROOT / ".env"
    if env_path.exists():
        load_dotenv(env_path, override=True)

    assistant_config.cache_clear()
    engines_config.cache_clear()
    _engine_registry._build.cache_clear()

    summary = _safe_summary()
    safe_log_event(
        "settings.reload",
        engine_count=summary["engine_count"],
        configured_count=summary["configured_count"],
    )
    return summary
