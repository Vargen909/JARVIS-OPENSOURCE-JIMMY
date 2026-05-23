"""Adapter for OpenAI and OpenAI-compatible APIs (DeepSeek, Kimi)."""

from __future__ import annotations

from typing import Iterable, List

from ..config import env
from .base import ChatMessage, EngineError, EngineUnavailable


class OpenAICompatibleEngine:
    def __init__(
        self,
        *,
        engine_id: str,
        label: str,
        api_key_env: str,
        default_model: str,
        base_url: str | None = None,
        base_url_env: str | None = None,
    ) -> None:
        self.id = engine_id
        self.label = label
        self.requires_key = True
        self.api_key_env = api_key_env
        self.default_model = default_model
        if base_url_env:
            self.base_url = env(base_url_env, base_url) or base_url
        else:
            self.base_url = base_url

    def _client(self):
        try:
            from openai import OpenAI
        except ImportError as e:
            raise EngineUnavailable("openai package not installed") from e
        api_key = env(self.api_key_env)
        if not api_key:
            raise EngineUnavailable(f"Missing API key ({self.api_key_env})")
        kwargs: dict = {"api_key": api_key}
        if self.base_url:
            kwargs["base_url"] = self.base_url
        return OpenAI(**kwargs)

    def is_available(self) -> bool:
        return bool(env(self.api_key_env))

    def chat(self, messages: List[ChatMessage], *, model=None, system=None, temperature=0.7) -> str:
        client = self._client()
        msgs: list[dict] = []
        if system:
            msgs.append({"role": "system", "content": system})
        msgs.extend({"role": m.role, "content": m.content} for m in messages)
        try:
            r = client.chat.completions.create(
                model=model or self.default_model,
                messages=msgs,
                temperature=temperature,
            )
            return r.choices[0].message.content or ""
        except Exception as e:
            raise EngineError(f"{self.label} error: {e}") from e

    def stream(self, messages: List[ChatMessage], *, model=None, system=None, temperature=0.7) -> Iterable[str]:
        client = self._client()
        msgs: list[dict] = []
        if system:
            msgs.append({"role": "system", "content": system})
        msgs.extend({"role": m.role, "content": m.content} for m in messages)
        try:
            stream = client.chat.completions.create(
                model=model or self.default_model,
                messages=msgs,
                temperature=temperature,
                stream=True,
            )
            for chunk in stream:
                delta = chunk.choices[0].delta
                if delta and delta.content:
                    yield delta.content
        except Exception as e:
            raise EngineError(f"{self.label} stream error: {e}") from e
