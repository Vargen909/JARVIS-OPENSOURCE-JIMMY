"""AgentGuard: bounded execution context for any Jarvis reasoning loop.

Wraps a single agent invocation (chat call, future tool loop, future
multi-agent orchestration) and enforces:

* loop count (reasoning iterations)
* tool count (external side effects: bash, browser, API, file IO)
* wall-clock runtime
* repeated identical errors
* repeated identical plans (recursive replanning protection)

It never raises silently. Every stop is recorded as an :class:`AgentStopped`
with a structured reason. Callers should catch it, return a graceful response,
and let the user pick the next step.

The guard has zero coupling to LLM providers or HTTP frameworks, so it can
be reused by future browser automation, coding agents, or background workers.
"""

from __future__ import annotations

import hashlib
import time
from collections import deque
from contextlib import contextmanager
from typing import Iterator, Optional

from .config import SafetyConfig, load_safety_config
from .errors import AgentStopped, StopReason
from .logging import redact, safe_log_event


def _fingerprint(text: str) -> str:
    norm = " ".join((text or "").strip().lower().split())[:512]
    return hashlib.sha1(norm.encode("utf-8")).hexdigest()


class AgentGuard:
    def __init__(
        self,
        *,
        label: str,
        config: Optional[SafetyConfig] = None,
    ) -> None:
        self.label = label
        self.config = config or load_safety_config()
        self.loops = 0
        self.tools = 0
        self._start = time.monotonic()
        self._stopped = False
        self._stop_reason: Optional[StopReason] = None
        self._stop_message: str = ""
        # Recent error/plan fingerprints. Bounded so memory is constant.
        self._recent_errors: deque[str] = deque(
            maxlen=max(self.config.max_identical_errors, 1)
        )
        self._recent_plans: deque[str] = deque(
            maxlen=max(self.config.max_identical_plans, 1)
        )
        self._completed_steps: list[str] = []

        safe_log_event(
            "agent_guard.start",
            label=self.label,
            limits=self.config.as_dict(),
        )

    @property
    def runtime(self) -> float:
        return time.monotonic() - self._start

    @property
    def stopped(self) -> bool:
        return self._stopped

    def status(self) -> dict:
        return {
            "label": self.label,
            "loops": self.loops,
            "tools": self.tools,
            "runtime_seconds": round(self.runtime, 3),
            "stopped": self._stopped,
            "stop_reason": self._stop_reason.value if self._stop_reason else None,
            "limits": self.config.as_dict(),
            "completed_steps": list(self._completed_steps),
        }

    def _stop(self, reason: StopReason, message: str, summary: str = "") -> AgentStopped:
        self._stopped = True
        self._stop_reason = reason
        self._stop_message = message
        safe_log_event(
            "agent_guard.stop",
            label=self.label,
            reason=reason.value,
            message=redact(message),
            loops=self.loops,
            tools=self.tools,
            runtime_seconds=round(self.runtime, 3),
        )
        return AgentStopped(
            reason=reason,
            message=message,
            loops=self.loops,
            tools=self.tools,
            runtime_seconds=self.runtime,
            summary=summary or self._auto_summary(),
        )

    def _auto_summary(self) -> str:
        if not self._completed_steps:
            return "No partial progress was completed before the stop."
        bullets = "\n".join(f"- {s}" for s in self._completed_steps[-5:])
        return f"Completed steps so far:\n{bullets}"

    def check_runtime(self) -> None:
        if self.runtime > self.config.max_runtime_seconds:
            raise self._stop(
                StopReason.RUNTIME_LIMIT,
                (
                    f"Runtime exceeded {self.config.max_runtime_seconds:.0f}s. "
                    "The agent was stopped to keep the system responsive."
                ),
            )

    def tick_loop(self, label: str = "") -> int:
        self.check_runtime()
        self.loops += 1
        if self.loops > self.config.max_agent_loops:
            raise self._stop(
                StopReason.LOOP_LIMIT,
                (
                    f"Reasoning loop limit reached ({self.config.max_agent_loops}). "
                    "Agent halted to prevent an infinite loop."
                ),
            )
        if label:
            self._completed_steps.append(f"loop {self.loops}: {label}")
        return self.loops

    def tick_tool(self, name: str = "tool") -> int:
        self.check_runtime()
        self.tools += 1
        if self.tools > self.config.max_tool_calls:
            raise self._stop(
                StopReason.TOOL_LIMIT,
                (
                    f"Tool call limit reached ({self.config.max_tool_calls}). "
                    "Agent halted to prevent runaway tool execution."
                ),
            )
        self._completed_steps.append(f"tool {self.tools}: {name}")
        return self.tools

    def register_error(self, kind: str, message: str) -> None:
        fp = _fingerprint(f"{kind}:{message}")
        self._recent_errors.append(fp)
        safe_log_event(
            "agent_guard.error",
            label=self.label,
            kind=kind,
            message=redact(message),
            loops=self.loops,
            tools=self.tools,
        )
        limit = self.config.max_identical_errors
        if (
            len(self._recent_errors) >= limit
            and len(set(list(self._recent_errors)[-limit:])) == 1
        ):
            raise self._stop(
                StopReason.REPEATED_ERROR,
                (
                    f"Same failure happened {limit} times in a row: {kind}. "
                    "The agent stopped to avoid spinning on a broken path. "
                    "Try a different model, smaller input, or a new approach."
                ),
            )

    def register_plan(self, plan: str) -> None:
        fp = _fingerprint(plan)
        self._recent_plans.append(fp)
        limit = self.config.max_identical_plans
        if (
            len(self._recent_plans) >= limit
            and len(set(list(self._recent_plans)[-limit:])) == 1
        ):
            raise self._stop(
                StopReason.REPEATED_PLAN,
                (
                    f"The agent proposed the same plan {limit} times in a row. "
                    "Stopping to prevent recursive replanning."
                ),
            )

    @contextmanager
    def loop_step(self, label: str = "") -> Iterator[int]:
        index = self.tick_loop(label)
        try:
            yield index
        except AgentStopped:
            raise
        except Exception as exc:
            self.register_error(kind=type(exc).__name__, message=str(exc))
            raise

    @contextmanager
    def tool_call(self, name: str) -> Iterator[int]:
        index = self.tick_tool(name)
        try:
            yield index
        except AgentStopped:
            raise
        except Exception as exc:
            self.register_error(kind=f"tool:{name}:{type(exc).__name__}", message=str(exc))
            raise

    def graceful_response(self, stop: AgentStopped) -> dict:
        """Build a safe response payload for a stop event."""
        return {
            **stop.as_response(),
            "label": self.label,
            "next_steps": [
                "Try a smaller or faster model.",
                "Break the request into smaller steps.",
                "Switch engine in the header (OpenAI, Claude, DeepSeek, Kimi, Ollama).",
            ],
        }
