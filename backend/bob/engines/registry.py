"""Engine registry: assembles engine instances from engines.yaml."""

from __future__ import annotations

from functools import lru_cache
from typing import Dict, List

from ..config import engines_config
from .anthropic import AnthropicEngine
from .base import ChatEngine, EngineUnavailable
from .gemini import GeminiEngine
from .ollama import OllamaEngine
from .openai_compat import OpenAICompatibleEngine


@lru_cache(maxsize=1)
def _build() -> Dict[str, ChatEngine]:
    cfg = engines_config()
    engines: Dict[str, ChatEngine] = {}
    for engine_id, spec in (cfg.get("engines") or {}).items():
        provider = spec.get("provider")
        default_model = spec.get("default_model")
        if provider == "ollama":
            engines[engine_id] = OllamaEngine(default_model=default_model or "llama3.2")
        elif provider == "anthropic":
            engines[engine_id] = AnthropicEngine(
                default_model=default_model or "claude-3-5-sonnet-latest"
            )
        elif provider in ("openai", "openai_compatible"):
            engines[engine_id] = OpenAICompatibleEngine(
                engine_id=engine_id,
                label=spec.get("label", engine_id),
                api_key_env=spec.get("api_key_env", ""),
                default_model=default_model or "gpt-4o-mini",
                base_url=spec.get("base_url"),
                base_url_env=spec.get("base_url_env"),
            )
        elif provider == "gemini":
            engines[engine_id] = GeminiEngine(
                default_model=default_model or "gemini-2.0-flash"
            )
    return engines


def get_engine(engine_id: str) -> ChatEngine:
    engines = _build()
    if engine_id not in engines:
        raise EngineUnavailable(f"Unknown engine: {engine_id}")
    return engines[engine_id]


def _normalize_models(spec_models) -> List[dict]:
    """Accept legacy list-of-strings and new list-of-dicts uniformly."""
    out: list[dict] = []
    for m in spec_models or []:
        if isinstance(m, str):
            out.append({"id": m, "label": m, "good_for": None})
        elif isinstance(m, dict) and m.get("id"):
            out.append(
                {
                    "id": m["id"],
                    "label": m.get("label", m["id"]),
                    "good_for": m.get("good_for"),
                }
            )
    return out


def list_engines() -> List[dict]:
    cfg = engines_config()
    out: list[dict] = []
    for engine_id, spec in (cfg.get("engines") or {}).items():
        try:
            engine = get_engine(engine_id)
            available = engine.is_available()
        except Exception:
            available = False

        configured = _normalize_models(spec.get("models"))

        # For Ollama: merge configured presets with locally installed models.
        if spec.get("provider") == "ollama":
            installed_names: set[str] = set()
            try:
                eng = get_engine(engine_id)
                if hasattr(eng, "_list_models"):
                    installed_names = set(eng._list_models())  # type: ignore[attr-defined]
            except Exception:
                installed_names = set()

            merged: list[dict] = []
            seen: set[str] = set()

            # Mark configured ones with installed flag
            for m in configured:
                is_installed = m["id"] in installed_names or any(
                    name.split(":")[0] == m["id"].split(":")[0] for name in installed_names
                )
                merged.append({**m, "installed": is_installed})
                seen.add(m["id"])

            # Append any extra installed models not in the preset list
            for name in sorted(installed_names):
                if name in seen:
                    continue
                base = name.split(":")[0]
                if any(c["id"] == base for c in configured):
                    # Already represented by base preset
                    merged.append(
                        {
                            "id": name,
                            "label": name,
                            "good_for": "Lokalt installerad variant.",
                            "installed": True,
                        }
                    )
                else:
                    merged.append(
                        {
                            "id": name,
                            "label": name,
                            "good_for": "Lokalt installerad modell.",
                            "installed": True,
                        }
                    )
            models_out = merged
        else:
            models_out = [{**m, "installed": True} for m in configured]

        out.append(
            {
                "id": engine_id,
                "label": spec.get("label", engine_id),
                "provider": spec.get("provider"),
                "requires_key": spec.get("requires_key", False),
                "models": models_out,
                "default_model": spec.get("default_model"),
                "privacy": spec.get("privacy", "cloud"),
                "available": available,
                "description": spec.get("description"),
                "good_for": spec.get("good_for"),
            }
        )
    return out


def available_engines() -> List[str]:
    return [e["id"] for e in list_engines() if e["available"]]
