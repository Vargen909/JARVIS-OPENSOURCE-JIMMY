"""Service layer: assembles prompts, applies modes, talks to engines."""

from __future__ import annotations

import json
from typing import List

from sqlalchemy.orm import Session

from .config import assistant_name, system_prompt
from .engines import ChatMessage, EngineUnavailable, get_engine
from .model_rules import model_rule_prompt
from .models import (
    Conversation,
    Memory,
    Message,
    OperatingMode,
    User,
    UserRole,
)
from .schemas import ProfileData
from .security import decrypt, encrypt


MODE_HINTS: dict[OperatingMode, str] = {
    OperatingMode.WORK: "Mode: Work 💼. Focus on productivity, structured answers, and concrete next actions.",
    OperatingMode.PERSONAL: "Mode: Personal 🏠. Friendly, supportive, conversational tone.",
    OperatingMode.FAMILY: "Mode: Family 👨‍👩‍👧. Warm and inclusive. Respect family routines and shared notes.",
    OperatingMode.CREATIVE: "Mode: Creative 🎨. Be playful, expansive, brainstorm freely.",
    OperatingMode.STUDY: "Mode: Study 📚. Explain step-by-step. Quiz and reinforce learning.",
    OperatingMode.CUSTOM: "Mode: Custom. Adapt to the user's specified style.",
}

CHILD_GUARD = (
    "CHILD MODE ACTIVE. Use simple, age-appropriate language. "
    "Never produce adult content, violence, politics, or sensitive news. "
    "Refuse system/file/process actions and politely redirect."
)


def _profile_dict(user: User) -> dict:
    if not user.profile_encrypted:
        return {}
    try:
        return json.loads(decrypt(user.profile_encrypted))
    except Exception:
        return {}


def set_profile(user: User, profile: ProfileData) -> None:
    user.profile_encrypted = encrypt(json.dumps(profile.model_dump(exclude_none=True)))


def get_profile(user: User) -> ProfileData:
    return ProfileData(**_profile_dict(user))


SWEDISH_PERSONA = (
    "Du är {name}, en intelligent svensk AI-medvetenhet. "
    "Du svarar alltid naturligt på svenska om användaren inte uttryckligen byter språk. "
    "Var koncis, varm och intelligent. Undvik onödig utfyllnad."
)


def build_system_prompt(
    user: User,
    db: Session,
    *,
    engine_id: str | None = None,
    model: str | None = None,
) -> str:
    name = assistant_name()
    persona = SWEDISH_PERSONA.format(name=name)

    # Small local models can time out if we send the full B.O.B operating
    # contract every request. Keep Ollama prompts compact and practical.
    if (engine_id or "").lower() == "ollama":
        base = (
            f"{persona} "
            "Var hjälpsam, ärlig och praktisk. Om du är osäker, säg det och erbjud ett nästa steg."
        )
        parts: list[str] = [
            base,
            (
                "Aktiv modellroll: Snabb lokal assistent. Föredra korta, "
                "konkreta svar och undvik onödig teori."
            ),
        ]
    else:
        # Substitute both new and legacy brand placeholders to whatever the
        # user has configured as the assistant name in YAML.
        base = (
            persona + "\n\n" +
            system_prompt()
            .replace("B.O.B", name)
            .replace("Jarvis", name)
        )
        parts = [base, model_rule_prompt(engine_id, model)]

    parts.append(f"\n\nAktiv användare: namn={user.name}, roll={user.role.value}, språk={user.language}.")
    parts.append(f"Driftläge: {user.operating_mode.value}. Säkerhetsnivå: {user.security.value}.")
    if user.role == UserRole.CHILD:
        band = user.child_age_band or "8-12"
        parts.append(f"\n{CHILD_GUARD} Age band: {band}.")

    parts.append("\n" + MODE_HINTS.get(user.operating_mode, ""))

    profile = _profile_dict(user)
    if profile:
        compact = ", ".join(f"{k}={v}" for k, v in profile.items() if v not in (None, "", []))
        if compact:
            parts.append(f"\nKnown about user: {compact}.")

    notes: List[str] = []
    for m in db.query(Memory).filter(Memory.user_id == user.id).order_by(Memory.created_at.desc()).limit(20):
        try:
            notes.append(f"- ({m.kind}) {decrypt(m.content_encrypted)}")
        except Exception:
            continue
    if notes:
        parts.append("\nMemory notes (most recent first):\n" + "\n".join(notes))

    if not user.onboarded:
        parts.append(
            "\nThis is the user's first session. Begin with onboarding before answering, "
            "as instructed in FIRST MESSAGE BEHAVIOR."
        )

    return "\n".join(parts)


def select_engine(
    user: User,
    requested: str | None,
    *,
    intent: str = "chat",
) -> tuple[str, str]:
    """
    Hybrid engine routing:
      intent="action"  → prefer Claude Sonnet (better tool-use), fallback Ollama.
      intent="chat"    → prefer Ollama (fast, free, private), fallback Claude.
    User's explicit `requested` always takes priority.
    """
    if requested:
        engine_id = requested
    elif intent == "action":
        # Prefer Claude, then Gemini, then user's preferred, then Ollama.
        for candidate in ("claude", "gemini", user.preferred_engine or "ollama", "ollama"):
            try:
                e = get_engine(candidate)
                if e.is_available():
                    engine_id = candidate
                    break
            except Exception:
                continue
        else:
            engine_id = user.preferred_engine or "ollama"
    else:
        # Prefer Ollama for regular chat.
        for candidate in (user.preferred_engine or "ollama", "ollama", "claude"):
            try:
                e = get_engine(candidate)
                if e.is_available():
                    engine_id = candidate
                    break
            except Exception:
                continue
        else:
            engine_id = user.preferred_engine or "ollama"

    engine = get_engine(engine_id)
    if not engine.is_available():
        raise EngineUnavailable(
            f"Motorn '{engine_id}' är inte tillgänglig. "
            "Kontrollera API-nycklar i Inställningar → API-nycklar, "
            "eller starta Ollama och installera en modell."
        )
    model = user.preferred_model or engine.default_model
    return engine_id, model


def history_for(conversation: Conversation, limit: int = 30) -> List[ChatMessage]:
    msgs = conversation.messages[-limit:]
    return [ChatMessage(role=m.role, content=m.content) for m in msgs]


def add_message(conversation: Conversation, role: str, content: str, *, engine: str | None = None, model: str | None = None) -> Message:
    m = Message(conversation_id=conversation.id, role=role, content=content, engine=engine, model=model)
    conversation.messages.append(m)
    return m
