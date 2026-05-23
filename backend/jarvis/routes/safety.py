"""Safety configuration endpoint.

Exposes the current AgentGuard limits so a future settings UI or admin
panel can show them. Writes go through environment variables (and the
optional `.env` file) rather than runtime mutation, so the guardrails
remain immutable for the lifetime of any single agent invocation.
"""

from __future__ import annotations

from fastapi import APIRouter

from ..safety import load_safety_config
from ..schemas import SafetyConfigOut

router = APIRouter(tags=["safety"])


@router.get("/safety/config", response_model=SafetyConfigOut)
def get_safety_config() -> SafetyConfigOut:
    cfg = load_safety_config()
    return SafetyConfigOut(**cfg.as_dict())
