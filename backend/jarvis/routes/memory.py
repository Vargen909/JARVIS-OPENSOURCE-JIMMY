"""Memory routes (per-user, encrypted at rest)."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Memory, User
from ..schemas import MemoryIn, MemoryOut
from ..security import decrypt, encrypt

router = APIRouter(prefix="/users/{user_id}/memory", tags=["memory"])


def _to_out(m: Memory) -> MemoryOut:
    return MemoryOut(
        id=m.id,
        kind=m.kind,
        content=decrypt(m.content_encrypted),
        created_at=m.created_at,
    )


@router.get("", response_model=List[MemoryOut])
def list_memory(user_id: int, db: Session = Depends(get_db)):
    if not db.get(User, user_id):
        raise HTTPException(404, "User not found")
    rows = (
        db.query(Memory)
        .filter(Memory.user_id == user_id)
        .order_by(Memory.created_at.desc())
        .all()
    )
    return [_to_out(m) for m in rows]


@router.post("", response_model=MemoryOut, status_code=status.HTTP_201_CREATED)
def add_memory(user_id: int, payload: MemoryIn, db: Session = Depends(get_db)):
    if not db.get(User, user_id):
        raise HTTPException(404, "User not found")
    m = Memory(user_id=user_id, kind=payload.kind, content_encrypted=encrypt(payload.content))
    db.add(m)
    db.commit()
    db.refresh(m)
    return _to_out(m)


@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_memory(user_id: int, memory_id: int, db: Session = Depends(get_db)):
    m = db.get(Memory, memory_id)
    if not m or m.user_id != user_id:
        raise HTTPException(404, "Memory not found")
    db.delete(m)
    db.commit()
    return None
