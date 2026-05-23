"""Daily briefing route - per-user, simple text composition for now."""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..engines import ChatMessage, EngineUnavailable, get_engine
from ..models import User
from ..services import build_system_prompt, select_engine

router = APIRouter(prefix="/users/{user_id}/briefing", tags=["briefing"])


@router.get("")
def daily_briefing(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")

    today = datetime.now().strftime("%A %d %B %Y")
    prompt = (
        f"It's {today}. Generate a short, friendly daily briefing for {user.name}. "
        "Cover: highlights of the day, top 3 tasks based on what you know, "
        "a goal nudge, and a single proactive suggestion. Keep it under 200 words."
    )

    try:
        engine_id, model = select_engine(user, None)
    except EngineUnavailable as e:
        raise HTTPException(503, str(e))

    engine = get_engine(engine_id)
    text = engine.chat(
        [ChatMessage(role="user", content=prompt)],
        model=model,
        system=build_system_prompt(user, db, engine_id=engine_id, model=model),
    )
    return {"briefing": text, "engine": engine_id, "model": model, "date": today}
