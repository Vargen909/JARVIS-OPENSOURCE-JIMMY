"""Jarvis agent safety layer.

Multi-layer guardrails that protect against runaway agent behavior:
loop count, tool count, runtime, repeated failures, and recursive planning.

Designed to wrap any current or future reasoning/tool loop without coupling
to a specific engine, framework, or workflow.
"""

from .config import SafetyConfig, load_safety_config
from .errors import AgentStopped, StopReason
from .guard import AgentGuard
from .logging import redact, safe_log_event

__all__ = [
    "AgentGuard",
    "AgentStopped",
    "SafetyConfig",
    "StopReason",
    "load_safety_config",
    "redact",
    "safe_log_event",
]
