"""Engine listing + connection test routes."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, HTTPException

from ..engines import EngineUnavailable, get_engine, list_engines
from ..safety import redact, safe_log_event
from ..schemas import EngineInfo

router = APIRouter(prefix="/engines", tags=["engines"])


@router.get("", response_model=List[EngineInfo])
def list_all_engines():
    return list_engines()


def _humanize_error(message: str) -> str:
    """Make provider errors helpful without leaking secrets."""
    msg = redact(message)
    lowered = msg.lower()
    if "unauthorized" in lowered or "401" in lowered or "invalid api key" in lowered:
        return "Invalid API key — double-check the value you pasted."
    if "not found" in lowered or "404" in lowered:
        return "Endpoint or model not found. Check engine config."
    if "timeout" in lowered or "timed out" in lowered:
        return "Provider timed out. Try again or use a smaller model."
    if "connection" in lowered or "refused" in lowered:
        return "Could not reach provider. Is your network/Ollama running?"
    return msg[:200]


@router.post("/{engine_id}/test")
def test_engine(engine_id: str):
    """Lightweight connectivity test for any engine.

    Returns ``{ok, engine_id, message, available}`` only. No secrets.
    Never raises 5xx for a bad key — that would mask the real diagnosis.
    """
    try:
        engine = get_engine(engine_id)
    except EngineUnavailable:
        raise HTTPException(404, f"Unknown engine: {engine_id}")

    if not engine.is_available():
        return {
            "ok": False,
            "engine_id": engine_id,
            "available": False,
            "message": "Engine is not configured. Add an API key first.",
        }

    try:
        provider = type(engine).__name__
        # Each adapter has a cheap probe path. We avoid sending real chat
        # traffic so a test never costs tokens or hits rate limits.
        if provider == "OllamaEngine":
            models = engine._list_models(force=True)  # type: ignore[attr-defined]
            if not models:
                return {
                    "ok": False,
                    "engine_id": engine_id,
                    "available": False,
                    "message": "Ollama reachable but no models installed. Run: ollama pull llama3.2",
                }
            return {
                "ok": True,
                "engine_id": engine_id,
                "available": True,
                "message": f"OK — {len(models)} model(s) installed.",
            }
        if provider == "AnthropicEngine":
            client = engine._client()  # type: ignore[attr-defined]
            client.models.list(limit=1)
            return {"ok": True, "engine_id": engine_id, "available": True, "message": "OK"}
        if provider == "OpenAICompatibleEngine":
            client = engine._client()  # type: ignore[attr-defined]
            client.models.list()
            return {"ok": True, "engine_id": engine_id, "available": True, "message": "OK"}
        return {"ok": True, "engine_id": engine_id, "available": True, "message": "OK"}
    except Exception as e:
        safe_log_event(
            "engines.test_failed",
            engine_id=engine_id,
            error=str(e),
        )
        return {
            "ok": False,
            "engine_id": engine_id,
            "available": False,
            "message": _humanize_error(str(e)),
        }
