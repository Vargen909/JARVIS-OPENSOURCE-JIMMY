"""Pydantic request/response schemas for the API."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from .models import OperatingMode, PerformanceMode, SecurityLevel, UserRole


class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    role: UserRole = UserRole.STANDARD
    language: str = "auto"
    security: SecurityLevel = SecurityLevel.BALANCED
    child_age_band: Optional[str] = None
    pin: Optional[str] = None


class ProfileData(BaseModel):
    age: Optional[int] = None
    city: Optional[str] = None
    partner: Optional[str] = None
    children: Optional[List[str]] = None
    work: Optional[str] = None
    goals: Optional[str] = None
    interests: Optional[List[str]] = None
    health: Optional[str] = None
    notes: Optional[str] = None


class UserOut(BaseModel):
    id: int
    name: str
    role: UserRole
    language: str
    security: SecurityLevel
    operating_mode: OperatingMode
    performance_mode: PerformanceMode
    preferred_engine: str
    preferred_model: Optional[str] = None
    child_age_band: Optional[str] = None
    onboarded: bool
    has_pin: bool = False
    profile: Optional[ProfileData] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    language: Optional[str] = None
    security: Optional[SecurityLevel] = None
    operating_mode: Optional[OperatingMode] = None
    performance_mode: Optional[PerformanceMode] = None
    preferred_engine: Optional[str] = None
    preferred_model: Optional[str] = None
    child_age_band: Optional[str] = None
    onboarded: Optional[bool] = None
    profile: Optional[ProfileData] = None


class MemoryIn(BaseModel):
    content: str
    kind: str = "note"


class MemoryOut(BaseModel):
    id: int
    kind: str
    content: str
    created_at: datetime


class ChatRequest(BaseModel):
    user_id: int
    conversation_id: Optional[int] = None
    message: str
    engine: Optional[str] = None
    model: Optional[str] = None
    confidential: bool = False
    operating_mode: Optional[OperatingMode] = None


class MessageOut(BaseModel):
    id: int
    role: str
    content: str
    engine: Optional[str] = None
    model: Optional[str] = None
    created_at: datetime


class SafetyStop(BaseModel):
    stopped: bool = True
    reason: str
    message: str
    summary: Optional[str] = None
    loops: int = 0
    tools: int = 0
    runtime_seconds: float = 0.0


class SafetyConfigOut(BaseModel):
    max_agent_loops: int
    max_tool_calls: int
    max_runtime_seconds: float
    max_identical_errors: int
    max_identical_plans: int


class ChatResponse(BaseModel):
    conversation_id: int
    reply: MessageOut
    engine_used: str
    model_used: str
    safety: Optional[SafetyStop] = None


class ConversationOut(BaseModel):
    id: int
    title: str
    operating_mode: OperatingMode
    confidential: bool
    created_at: datetime
    updated_at: datetime
    messages: List[MessageOut] = []


class ModelInfo(BaseModel):
    id: str
    label: str
    good_for: Optional[str] = None
    installed: bool = True


class EngineInfo(BaseModel):
    id: str
    label: str
    provider: Optional[str] = None
    requires_key: bool
    models: List[ModelInfo] = []
    default_model: Optional[str] = None
    privacy: str = "cloud"
    available: bool
    description: Optional[str] = None
    good_for: Optional[str] = None


class AppInfo(BaseModel):
    name: str
    version: str
    user_count: int
    needs_onboarding: bool
    engines: List[EngineInfo]
