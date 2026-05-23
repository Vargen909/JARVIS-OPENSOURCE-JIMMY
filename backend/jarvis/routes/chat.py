"""Chat routes - the heart of Jarvis."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..engines import ChatMessage, EngineError, EngineUnavailable, get_engine
from ..models import Conversation, Message, User
from ..safety import AgentGuard, AgentStopped
from ..schemas import (
    ChatRequest,
    ChatResponse,
    ConversationOut,
    MessageOut,
    SafetyStop,
)
from ..services import (
    add_message,
    build_system_prompt,
    history_for,
    select_engine,
)

router = APIRouter(tags=["chat"])


def _fallback_reply(user: User, message: str, error: Exception) -> str:
    """Make sure Jarvis always answers even if the selected engine stalls."""
    return (
        f"Jag kan skriva med dig, {user.name}. Just nu svarade den valda AI-motorn inte i tid.\n\n"
        f"Tekniskt fel: {error}\n\n"
        "Det du skrev var:\n"
        f"“{message}”\n\n"
        "Snabb fix: om du kör Ollama lokalt, testa att starta om Ollama eller välj en mindre/snabbare modell. "
        "Du kan också lägga in en API-nyckel i Settings → API Keys och välja OpenAI, Claude, DeepSeek eller Kimi."
    )


def _safety_reply(user: User, stop: AgentStopped) -> str:
    """Compose a graceful, user-facing message for a safety-induced stop."""
    headline = {
        "loop_limit": "Jag stoppade mig själv för att undvika en oändlig loop.",
        "tool_limit": "Jag stoppade mig själv för att undvika att köra för många verktyg i rad.",
        "runtime_limit": "Jag stoppade körningen för att den tog för lång tid.",
        "repeated_error": "Jag stoppade körningen efter att samma fel återkommit flera gånger.",
        "repeated_plan": "Jag stoppade mig själv för att jag fastnade i en upprepad plan.",
        "external": "Körningen avbröts.",
    }.get(stop.reason.value, "Körningen avbröts.")
    return (
        f"{user.name}, {headline}\n\n"
        f"Anledning: {stop.message}\n\n"
        f"{stop.summary}\n\n"
        "Förslag på nästa steg:\n"
        "• Testa en mindre/snabbare modell (t.ex. Ollama llama3.2:3b).\n"
        "• Dela upp uppgiften i mindre steg.\n"
        "• Byt motor i headern (OpenAI, Claude, DeepSeek, Kimi)."
    )


def _msg_out(m: Message) -> MessageOut:
    return MessageOut(
        id=m.id,
        role=m.role,
        content=m.content,
        engine=m.engine,
        model=m.model,
        created_at=m.created_at,
    )


def _conv_out(c: Conversation) -> ConversationOut:
    return ConversationOut(
        id=c.id,
        title=c.title,
        operating_mode=c.operating_mode,
        confidential=c.confidential,
        created_at=c.created_at,
        updated_at=c.updated_at,
        messages=[_msg_out(m) for m in c.messages],
    )


@router.get("/users/{user_id}/conversations", response_model=List[ConversationOut])
def list_conversations(user_id: int, db: Session = Depends(get_db)):
    if not db.get(User, user_id):
        raise HTTPException(404, "User not found")
    rows = (
        db.query(Conversation)
        .filter(Conversation.user_id == user_id, Conversation.confidential.is_(False))
        .order_by(Conversation.updated_at.desc())
        .all()
    )
    return [_conv_out(c) for c in rows]


@router.get("/conversations/{conversation_id}", response_model=ConversationOut)
def get_conversation(conversation_id: int, db: Session = Depends(get_db)):
    c = db.get(Conversation, conversation_id)
    if not c:
        raise HTTPException(404, "Conversation not found")
    return _conv_out(c)


@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest, db: Session = Depends(get_db)):
    user = db.get(User, payload.user_id)
    if not user:
        raise HTTPException(404, "User not found")

    if payload.confidential and user.role.value == "child":
        raise HTTPException(403, "Confidential mode is not available for child profiles")

    if payload.conversation_id:
        conv = db.get(Conversation, payload.conversation_id)
        if not conv or conv.user_id != user.id:
            raise HTTPException(404, "Conversation not found")
    else:
        conv = Conversation(
            user_id=user.id,
            title=payload.message[:60] or "New chat",
            operating_mode=payload.operating_mode or user.operating_mode,
            confidential=payload.confidential,
        )
        db.add(conv)
        db.flush()

    try:
        engine_id, model = select_engine(user, payload.engine)
    except EngineUnavailable as e:
        raise HTTPException(503, str(e))

    engine = get_engine(engine_id)
    sys_prompt = build_system_prompt(user, db, engine_id=engine_id, model=model)

    history: List[ChatMessage] = history_for(conv) if not conv.confidential else []
    history.append(ChatMessage(role="user", content=payload.message))

    guard = AgentGuard(label=f"chat:user={user.id}:engine={engine_id}")
    safety_stop: AgentStopped | None = None

    try:
        with guard.loop_step("chat reasoning"):
            with guard.tool_call(f"engine.{engine_id}.chat"):
                reply_text = engine.chat(history, model=model, system=sys_prompt)
    except AgentStopped as stop:
        safety_stop = stop
        reply_text = _safety_reply(user, stop)
    except EngineUnavailable as e:
        guard.register_error("EngineUnavailable", str(e))
        raise HTTPException(503, str(e))
    except EngineError as e:
        try:
            guard.register_error("EngineError", str(e))
        except AgentStopped as stop:
            safety_stop = stop
            reply_text = _safety_reply(user, stop)
        else:
            if engine_id == "ollama":
                reply_text = _fallback_reply(user, payload.message, e)
            else:
                raise HTTPException(500, f"Engine error: {e}")
    except Exception as e:  # pragma: no cover - defensive net
        try:
            guard.register_error(type(e).__name__, str(e))
        except AgentStopped as stop:
            safety_stop = stop
            reply_text = _safety_reply(user, stop)
        else:
            if engine_id == "ollama":
                reply_text = _fallback_reply(user, payload.message, e)
            else:
                raise HTTPException(500, f"Engine error: {e}")

    safety_payload = (
        SafetyStop(
            reason=safety_stop.reason.value,
            message=safety_stop.message,
            summary=safety_stop.summary,
            loops=safety_stop.loops,
            tools=safety_stop.tools,
            runtime_seconds=round(safety_stop.runtime_seconds, 3),
        )
        if safety_stop
        else None
    )

    if not conv.confidential:
        add_message(conv, "user", payload.message)
        reply_msg = add_message(conv, "assistant", reply_text, engine=engine_id, model=model)
        if not user.onboarded:
            user.onboarded = True
        db.commit()
        db.refresh(reply_msg)
        return ChatResponse(
            conversation_id=conv.id,
            reply=_msg_out(reply_msg),
            engine_used=engine_id,
            model_used=model,
            safety=safety_payload,
        )

    db.commit()
    from datetime import datetime
    return ChatResponse(
        conversation_id=conv.id,
        reply=MessageOut(
            id=0,
            role="assistant",
            content=reply_text,
            engine=engine_id,
            model=model,
            created_at=datetime.utcnow(),
        ),
        engine_used=engine_id,
        model_used=model,
        safety=safety_payload,
    )


@router.delete("/conversations/{conversation_id}", status_code=204)
def delete_conversation(conversation_id: int, db: Session = Depends(get_db)):
    c = db.get(Conversation, conversation_id)
    if not c:
        raise HTTPException(404, "Conversation not found")
    db.delete(c)
    db.commit()
    return None
