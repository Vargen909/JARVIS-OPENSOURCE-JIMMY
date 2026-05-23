"""Stop reasons and structured exceptions for the Jarvis safety layer."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class StopReason(str, Enum):
    LOOP_LIMIT = "loop_limit"
    TOOL_LIMIT = "tool_limit"
    RUNTIME_LIMIT = "runtime_limit"
    REPEATED_ERROR = "repeated_error"
    REPEATED_PLAN = "repeated_plan"
    EXTERNAL = "external"


@dataclass
class AgentStopped(Exception):
    """Raised when the AgentGuard halts execution.

    The exception is structured so callers can build a graceful response
    without leaking internal state.
    """

    reason: StopReason
    message: str
    loops: int = 0
    tools: int = 0
    runtime_seconds: float = 0.0
    summary: str = ""

    def __str__(self) -> str:
        return f"[{self.reason.value}] {self.message}"

    def as_response(self) -> dict:
        return {
            "stopped": True,
            "reason": self.reason.value,
            "message": self.message,
            "summary": self.summary,
            "loops": self.loops,
            "tools": self.tools,
            "runtime_seconds": round(self.runtime_seconds, 3),
        }
