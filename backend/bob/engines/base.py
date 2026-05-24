"""Engine base class and shared types."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List, Protocol


@dataclass
class ChatMessage:
    role: str
    content: str


class EngineError(RuntimeError):
    pass


class EngineUnavailable(EngineError):
    """Raised when the engine isn't usable (missing key, server down, etc.)."""


class ChatEngine(Protocol):
    id: str
    label: str
    requires_key: bool

    def is_available(self) -> bool: ...

    def chat(
        self,
        messages: List[ChatMessage],
        *,
        model: str | None = None,
        system: str | None = None,
        temperature: float = 0.7,
    ) -> str: ...

    def stream(
        self,
        messages: List[ChatMessage],
        *,
        model: str | None = None,
        system: str | None = None,
        temperature: float = 0.7,
    ) -> Iterable[str]: ...
