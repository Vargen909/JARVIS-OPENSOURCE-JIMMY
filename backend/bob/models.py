"""SQLAlchemy ORM models for users, memory, conversations, settings."""

from __future__ import annotations

import enum
import json
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    STANDARD = "standard"
    CHILD = "child"


class SecurityLevel(str, enum.Enum):
    STRICT = "strict"
    BALANCED = "balanced"
    RELAXED = "relaxed"


class OperatingMode(str, enum.Enum):
    WORK = "work"
    PERSONAL = "personal"
    FAMILY = "family"
    CREATIVE = "creative"
    STUDY = "study"
    CUSTOM = "custom"


class PerformanceMode(str, enum.Enum):
    OPTIMAL = "optimal"
    PERFORMANCE = "performance"
    BALANCED = "balanced"
    ECONOMY = "economy"
    MULTITASK = "multitask"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.STANDARD)
    language: Mapped[str] = mapped_column(String(10), default="auto")
    security: Mapped[SecurityLevel] = mapped_column(Enum(SecurityLevel), default=SecurityLevel.BALANCED)
    operating_mode: Mapped[OperatingMode] = mapped_column(Enum(OperatingMode), default=OperatingMode.PERSONAL)
    performance_mode: Mapped[PerformanceMode] = mapped_column(Enum(PerformanceMode), default=PerformanceMode.OPTIMAL)
    preferred_engine: Mapped[str] = mapped_column(String(40), default="ollama")
    preferred_model: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    child_age_band: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    onboarded: Mapped[bool] = mapped_column(Boolean, default=False)
    pin_hash: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    profile_encrypted: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    memories: Mapped[list["Memory"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    conversations: Mapped[list["Conversation"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    projects: Mapped[list["Project"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Memory(Base):
    __tablename__ = "memories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(40), default="note")
    content_encrypted: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped[User] = relationship(back_populates="memories")


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200), default="New chat")
    operating_mode: Mapped[OperatingMode] = mapped_column(Enum(OperatingMode), default=OperatingMode.PERSONAL)
    confidential: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped[User] = relationship(back_populates="conversations")
    messages: Mapped[list["Message"]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.id",
    )


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    conversation_id: Mapped[int] = mapped_column(ForeignKey("conversations.id", ondelete="CASCADE"), index=True)
    role: Mapped[str] = mapped_column(String(20))
    content: Mapped[str] = mapped_column(Text)
    engine: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    model: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    conversation: Mapped[Conversation] = relationship(back_populates="messages")


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    path: Mapped[str] = mapped_column(Text)
    operating_mode: Mapped[OperatingMode] = mapped_column(Enum(OperatingMode), default=OperatingMode.WORK)
    active: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped[User] = relationship(back_populates="projects")


class AppSetting(Base):
    """Singleton-style global settings (key/value JSON)."""

    __tablename__ = "app_settings"

    key: Mapped[str] = mapped_column(String(80), primary_key=True)
    value_json: Mapped[str] = mapped_column(Text, default="{}")

    def value(self) -> dict:
        try:
            return json.loads(self.value_json)
        except Exception:
            return {}
