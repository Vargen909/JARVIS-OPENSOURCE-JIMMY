"""Local speech-to-text utilities for browser mic fallback."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from tempfile import NamedTemporaryFile

from .config import env


class SpeechUnavailable(RuntimeError):
    """Raised when local STT is not usable."""


def _preferred_model() -> str:
    return env("BOB_STT_MODEL", "tiny") or "tiny"


@lru_cache(maxsize=1)
def _load_model():
    try:
        from faster_whisper import WhisperModel
    except ImportError as e:  # pragma: no cover - dependency/runtime check
        raise SpeechUnavailable("faster-whisper is not installed") from e

    model_name = _preferred_model()
    attempts: list[tuple[str, str]] = [
        ("cpu", "int8"),
        ("cpu", "int8_float32"),
        ("cpu", "float32"),
    ]
    last_error: Exception | None = None
    for device, compute_type in attempts:
        try:
            return WhisperModel(model_name, device=device, compute_type=compute_type)
        except Exception as e:  # pragma: no cover - defensive
            last_error = e
    raise SpeechUnavailable(f"Could not load local STT model '{model_name}': {last_error}")


def _default_language() -> str:
    return env("BOB_STT_LANGUAGE", "sv") or "sv"


def transcribe_bytes(data: bytes, *, suffix: str = ".webm", language: str | None = None) -> str:
    if not data:
        raise SpeechUnavailable("Empty audio payload")
    model = _load_model()
    lang = language or _default_language()
    tmp_path: Path | None = None
    try:
        with NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(data)
            tmp.flush()
            tmp_path = Path(tmp.name)
        segments, _info = model.transcribe(str(tmp_path), language=lang, vad_filter=True)
        text = " ".join((segment.text or "").strip() for segment in segments).strip()
        return text
    finally:
        if tmp_path and tmp_path.exists():
            tmp_path.unlink(missing_ok=True)
