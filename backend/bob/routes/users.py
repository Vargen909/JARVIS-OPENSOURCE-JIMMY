"""User profile management routes."""

from __future__ import annotations

import hashlib
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import User, UserRole
from ..schemas import UserCreate, UserOut, UserUpdate
from ..services import get_profile, set_profile

router = APIRouter(prefix="/users", tags=["users"])


def _hash_pin(pin: str) -> str:
    return hashlib.sha256(pin.encode("utf-8")).hexdigest()


def _to_out(user: User) -> UserOut:
    data = UserOut.model_validate(user)
    data.has_pin = bool(user.pin_hash)
    data.profile = get_profile(user)
    return data


@router.get("", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db)):
    return [_to_out(u) for u in db.query(User).order_by(User.created_at).all()]


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Profile name already exists")

    is_first = db.query(User).count() == 0
    role = UserRole.ADMIN if is_first else payload.role

    user = User(
        name=payload.name,
        role=role,
        language=payload.language,
        security=payload.security,
        child_age_band=payload.child_age_band,
        pin_hash=_hash_pin(payload.pin) if payload.pin else None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _to_out(user)


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return _to_out(user)


@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")

    data = payload.model_dump(exclude_none=True, exclude={"profile"})
    for k, v in data.items():
        setattr(user, k, v)

    if payload.profile is not None:
        set_profile(user, payload.profile)

    db.commit()
    db.refresh(user)
    return _to_out(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    db.delete(user)
    db.commit()
    return None
