"""SQLite + SQLAlchemy session management."""

from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from .config import DATA_DIR

DB_PATH = DATA_DIR / "jarvis.sqlite"
ENGINE = create_engine(
    f"sqlite:///{DB_PATH}",
    connect_args={"check_same_thread": False},
    future=True,
)
SessionLocal = sessionmaker(bind=ENGINE, autoflush=False, autocommit=False, future=True)


def init_db() -> None:
    from .models import Base
    Base.metadata.create_all(ENGINE)


@contextmanager
def session_scope() -> Iterator[Session]:
    s = SessionLocal()
    try:
        yield s
        s.commit()
    except Exception:
        s.rollback()
        raise
    finally:
        s.close()


def get_db() -> Iterator[Session]:
    """FastAPI dependency."""
    s = SessionLocal()
    try:
        yield s
    finally:
        s.close()
