"""Ollama (local) engine adapter."""

from __future__ import annotations

import json
import time
from typing import Iterable, List

import httpx

from ..config import env
from .base import ChatMessage, EngineError, EngineUnavailable

_CACHE_TTL = 10.0  # seconds


class OllamaEngine:
    id = "ollama"
    label = "Ollama (Local)"
    requires_key = False

    def __init__(self, default_model: str = "llama3.2") -> None:
        self.base_url = env("OLLAMA_BASE_URL", "http://localhost:11434") or "http://localhost:11434"
        self.default_model = default_model
        self._models_cache: tuple[float, list[str]] | None = None

    def _list_models(self, force: bool = False) -> list[str]:
        now = time.monotonic()
        if not force and self._models_cache and (now - self._models_cache[0]) < _CACHE_TTL:
            return self._models_cache[1]
        try:
            r = httpx.get(f"{self.base_url}/api/tags", timeout=2.0)
            r.raise_for_status()
            data = r.json()
            names: list[str] = []
            for m in data.get("models") or []:
                name = m.get("name") or m.get("model")
                if name and "embed" not in name.lower():
                    names.append(name)
            self._models_cache = (now, names)
            return names
        except Exception:
            self._models_cache = (now, [])
            return []

    def resolve_model(self, requested: str | None) -> str:
        """Pick requested model, or first installed match, or first available."""
        installed = self._list_models()
        if not installed:
            raise EngineUnavailable(
                "Ollama has no chat models. Run: ollama pull llama3.2"
            )

        want = (requested or self.default_model).strip()
        if want in installed:
            return want

        # Partial match (e.g. llama3.2 -> llama3.2:3b)
        want_base = want.split(":")[0]
        for name in installed:
            if name == want or name.split(":")[0] == want_base:
                return name

        # Fall back to first installed model
        return installed[0]

    def is_available(self) -> bool:
        return len(self._list_models()) > 0

    def _payload(
        self,
        messages: List[ChatMessage],
        model: str,
        system: str | None,
        temperature: float,
    ) -> dict:
        msgs: list[dict] = []
        if system:
            msgs.append({"role": "system", "content": system})
        msgs.extend({"role": m.role, "content": m.content} for m in messages)
        return {
            "model": model,
            "messages": msgs,
            "options": {
                "temperature": temperature,
                # Keep local responses responsive on CPU-bound machines.
                "num_predict": 384,
                "num_ctx": 2048,
            },
            "keep_alive": "10m",
        }

    def _parse_error(self, response: httpx.Response) -> str:
        try:
            body = response.json()
            if isinstance(body, dict) and body.get("error"):
                err = str(body["error"])
                if "not found" in err.lower():
                    installed = self._list_models()
                    hint = ", ".join(installed[:5]) if installed else "none"
                    return (
                        f"{err}. Installed models: {hint}. "
                        f"Run `ollama pull {self.default_model}` or pick another model in Settings."
                    )
                return err
        except Exception:
            pass
        return f"HTTP {response.status_code}"

    def chat(self, messages, *, model=None, system=None, temperature=0.7) -> str:
        if not self.is_available():
            raise EngineUnavailable(
                "Ollama server not reachable or no models installed. "
                "Start with `ollama serve` and run `ollama pull llama3.2`."
            )
        resolved = self.resolve_model(model)
        payload = self._payload(messages, resolved, system, temperature)
        payload["stream"] = False
        try:
            r = httpx.post(f"{self.base_url}/api/chat", json=payload, timeout=45)
            if r.status_code >= 400:
                raise EngineError(f"Ollama error: {self._parse_error(r)}")
            data = r.json()
            return (data.get("message") or {}).get("content", "")
        except EngineError:
            raise
        except httpx.TimeoutException as e:
            raise EngineError(
                "Ollama timeout: the local model did not answer within 45 seconds. "
                "Try a smaller model, close other heavy apps, or restart Ollama."
            ) from e
        except httpx.HTTPError as e:
            raise EngineError(f"Ollama error: {e}") from e

    def stream(self, messages, *, model=None, system=None, temperature=0.7) -> Iterable[str]:
        if not self.is_available():
            raise EngineUnavailable("Ollama server not reachable.")
        resolved = self.resolve_model(model)
        payload = self._payload(messages, resolved, system, temperature)
        payload["stream"] = True
        with httpx.stream("POST", f"{self.base_url}/api/chat", json=payload, timeout=None) as r:
            if r.status_code >= 400:
                raise EngineError(f"Ollama stream error: {self._parse_error(r)}")
            r.raise_for_status()
            for line in r.iter_lines():
                if not line:
                    continue
                try:
                    chunk = json.loads(line)
                except Exception:
                    continue
                msg = chunk.get("message") or {}
                piece = msg.get("content")
                if piece:
                    yield piece
                if chunk.get("done"):
                    break
