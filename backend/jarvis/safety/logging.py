"""Structured, secret-aware safety logging.

Every safety event is logged via the standard logging module under the
``jarvis.safety`` logger. Secrets and obvious credentials are redacted
before they are written so logs are safe to ship to disk or aggregators.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

logger = logging.getLogger("jarvis.safety")
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s"))
    logger.addHandler(handler)
logger.setLevel(logging.INFO)
logger.propagate = False


_SECRET_TOKEN_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"sk-[A-Za-z0-9_\-]{16,}"),
    re.compile(r"sk-ant-[A-Za-z0-9_\-]{20,}"),
    re.compile(r"AIza[0-9A-Za-z_\-]{20,}"),
    re.compile(r"ghp_[A-Za-z0-9]{20,}"),
    re.compile(r"AKIA[0-9A-Z]{16}"),
)

_SECRET_KEY_NAMES = re.compile(
    r"(api[_-]?key|access[_-]?key|secret|token|password|bearer)\s*[:=]\s*([^\s,;]+)",
    re.IGNORECASE,
)

_REDACTED = "***redacted***"


def redact(value: Any) -> Any:
    """Mask known secret patterns inside any string-like value."""
    if not isinstance(value, str):
        return value
    cleaned = value
    for pattern in _SECRET_TOKEN_PATTERNS:
        cleaned = pattern.sub(_REDACTED, cleaned)
    cleaned = _SECRET_KEY_NAMES.sub(lambda m: f"{m.group(1)}={_REDACTED}", cleaned)
    return cleaned


def _sanitize(fields: dict) -> dict:
    safe: dict[str, Any] = {}
    for key, val in fields.items():
        lowered = key.lower()
        if any(s in lowered for s in ("api_key", "secret", "token", "password")):
            safe[key] = _REDACTED
        elif isinstance(val, str):
            safe[key] = redact(val)
        else:
            safe[key] = val
    return safe


def safe_log_event(event: str, level: int = logging.INFO, **fields: Any) -> None:
    """Log a structured safety event with secrets redacted."""
    payload = {"event": event, **_sanitize(fields)}
    try:
        message = json.dumps(payload, default=str, ensure_ascii=False)
    except Exception:
        message = f"event={event}"
    logger.log(level, message)
