"""Anthropic (Claude) engine adapter."""

from __future__ import annotations

from typing import Iterable, List

from ..config import env
from .base import ChatMessage, EngineError, EngineUnavailable


class AnthropicEngine:
    id = "claude"
    label = "Claude (Anthropic)"
    requires_key = True

    MODEL_ALIASES = {
        "claude-3-5-sonnet-latest": "claude-sonnet-4-6",
        "claude-3-5-sonnet-20241022": "claude-sonnet-4-6",
        "claude-3-5-haiku-latest": "claude-haiku-4-5-20251001",
        "claude-3-5-haiku-20241022": "claude-haiku-4-5-20251001",
        "claude-3-opus-latest": "claude-opus-4-7",
        "claude-3-opus-20240229": "claude-opus-4-7",
    }

    def __init__(self, default_model: str = "claude-sonnet-4-6") -> None:
        self.default_model = default_model

    def resolve_model(self, model: str | None) -> str:
        selected = model or self.default_model
        return self.MODEL_ALIASES.get(selected, selected)

    def _client(self):
        try:
            from anthropic import Anthropic
        except ImportError as e:
            raise EngineUnavailable("anthropic package not installed") from e
        api_key = env("ANTHROPIC_API_KEY")
        if not api_key:
            raise EngineUnavailable("Missing ANTHROPIC_API_KEY")
        return Anthropic(api_key=api_key)

    def is_available(self) -> bool:
        return bool(env("ANTHROPIC_API_KEY"))

    def chat(self, messages: List[ChatMessage], *, model=None, system=None, temperature=0.7) -> str:
        client = self._client()
        resolved_model = self.resolve_model(model)
        msgs = [{"role": m.role, "content": m.content} for m in messages if m.role != "system"]
        try:
            r = client.messages.create(
                model=resolved_model,
                max_tokens=2048,
                system=system or "",
                messages=msgs,
                temperature=temperature,
            )
            parts = [b.text for b in r.content if getattr(b, "type", None) == "text"]
            return "".join(parts)
        except Exception as e:
            raise EngineError(f"Anthropic error: {e}") from e

    def stream(self, messages: List[ChatMessage], *, model=None, system=None, temperature=0.7) -> Iterable[str]:
        client = self._client()
        resolved_model = self.resolve_model(model)
        msgs = [{"role": m.role, "content": m.content} for m in messages if m.role != "system"]
        try:
            with client.messages.stream(
                model=resolved_model,
                max_tokens=2048,
                system=system or "",
                messages=msgs,
                temperature=temperature,
            ) as stream:
                for text in stream.text_stream:
                    if text:
                        yield text
        except Exception as e:
            raise EngineError(f"Anthropic stream error: {e}") from e
