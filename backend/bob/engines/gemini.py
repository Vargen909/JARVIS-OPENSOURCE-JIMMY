"""Google Gemini engine adapter using the google-generativeai SDK."""

from __future__ import annotations

from typing import Iterable, List

from ..config import env
from .base import ChatMessage, EngineError, EngineUnavailable

DEFAULT_MODEL = "gemini-2.0-flash"


class GeminiEngine:
    id = "gemini"
    label = "Google Gemini"
    requires_key = True

    def __init__(self, default_model: str = DEFAULT_MODEL) -> None:
        self.default_model = default_model

    def _configure(self) -> str:
        """Configure the SDK and return the API key. Raises if missing."""
        try:
            import google.generativeai as genai
        except ImportError as e:
            raise EngineUnavailable("google-generativeai package is not installed") from e

        api_key = env("GOOGLE_API_KEY")
        if not api_key:
            raise EngineUnavailable("Missing GOOGLE_API_KEY")
        genai.configure(api_key=api_key)
        return api_key

    def is_available(self) -> bool:
        return bool(env("GOOGLE_API_KEY"))

    def _model(self, model: str | None, system: str | None):
        import google.generativeai as genai

        self._configure()
        kwargs: dict = {}
        if system:
            kwargs["system_instruction"] = system
        return genai.GenerativeModel(model or self.default_model, **kwargs)

    @staticmethod
    def _to_contents(messages: List[ChatMessage]) -> list[dict]:
        """Convert ChatMessage list to Gemini content format."""
        result = []
        for m in messages:
            # Gemini only accepts 'user' and 'model' roles.
            role = "model" if m.role == "assistant" else "user"
            result.append({"role": role, "parts": [{"text": m.content}]})
        return result

    def chat(
        self,
        messages: List[ChatMessage],
        *,
        model: str | None = None,
        system: str | None = None,
        temperature: float = 0.7,
    ) -> str:
        try:
            m = self._model(model, system)
            contents = self._to_contents(messages)
            config = {"temperature": temperature}
            response = m.generate_content(contents, generation_config=config)
            return response.text or ""
        except EngineUnavailable:
            raise
        except Exception as e:
            raise EngineError(f"Gemini error: {e}") from e

    def stream(
        self,
        messages: List[ChatMessage],
        *,
        model: str | None = None,
        system: str | None = None,
        temperature: float = 0.7,
    ) -> Iterable[str]:
        try:
            m = self._model(model, system)
            contents = self._to_contents(messages)
            config = {"temperature": temperature}
            for chunk in m.generate_content(
                contents,
                generation_config=config,
                stream=True,
            ):
                if chunk.text:
                    yield chunk.text
        except EngineUnavailable:
            raise
        except Exception as e:
            raise EngineError(f"Gemini stream error: {e}") from e
