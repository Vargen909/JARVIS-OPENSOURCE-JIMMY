"""Safety configuration for the Jarvis agent guardrails.

Values are read from environment variables with conservative defaults.
A future settings UI can read this via the /safety/config endpoint and
write env values; the dataclass itself stays immutable per request.
"""

from __future__ import annotations

import os
from dataclasses import dataclass


def _int(name: str, default: int) -> int:
    raw = os.environ.get(name)
    if not raw:
        return default
    try:
        value = int(raw)
        return max(1, value)
    except ValueError:
        return default


def _float(name: str, default: float) -> float:
    raw = os.environ.get(name)
    if not raw:
        return default
    try:
        value = float(raw)
        return max(1.0, value)
    except ValueError:
        return default


@dataclass(frozen=True)
class SafetyConfig:
    """Hard limits that bound any single agent invocation."""

    max_agent_loops: int = 10
    max_tool_calls: int = 25
    max_runtime_seconds: float = 120.0
    max_identical_errors: int = 3
    max_identical_plans: int = 3

    def as_dict(self) -> dict:
        return {
            "max_agent_loops": self.max_agent_loops,
            "max_tool_calls": self.max_tool_calls,
            "max_runtime_seconds": self.max_runtime_seconds,
            "max_identical_errors": self.max_identical_errors,
            "max_identical_plans": self.max_identical_plans,
        }


def load_safety_config() -> SafetyConfig:
    """Build a SafetyConfig from environment variables."""
    return SafetyConfig(
        max_agent_loops=_int("JARVIS_MAX_AGENT_LOOPS", 10),
        max_tool_calls=_int("JARVIS_MAX_TOOL_CALLS", 25),
        max_runtime_seconds=_float("JARVIS_MAX_AGENT_RUNTIME_SECONDS", 120.0),
        max_identical_errors=_int("JARVIS_MAX_IDENTICAL_ERRORS", 3),
        max_identical_plans=_int("JARVIS_MAX_IDENTICAL_PLANS", 3),
    )
