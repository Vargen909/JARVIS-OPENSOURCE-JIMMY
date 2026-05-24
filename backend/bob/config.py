"""Loads the B.O.B assistant config + engine registry from yaml/env."""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict

import yaml
from dotenv import load_dotenv

from ._migrate import migrate_legacy_paths

REPO_ROOT = Path(__file__).resolve().parents[2]

# Run on-disk migration before any other startup code reads from disk.
# Idempotent: only renames legacy jarvis.* files when bob.* don't exist.
_MIGRATED = migrate_legacy_paths(REPO_ROOT)

DATA_DIR = REPO_ROOT / "backend" / "data"
PLUGINS_DIR = REPO_ROOT / "backend" / "plugins"
ENGINES_CONFIG_PATH = REPO_ROOT / "engines.yaml"

load_dotenv(REPO_ROOT / ".env")


def _config_path() -> Path:
    """Resolve the assistant config file. Prefers BOB_*, falls back to legacy.

    Order:
      1. BOB_CONFIG_PATH env var (explicit override)
      2. JARVIS_CONFIG_PATH env var (legacy override, deprecated)
      3. <repo>/bob.config.yaml
      4. <repo>/jarvis.config.yaml (legacy file kept for backwards compat)
    """
    explicit = os.environ.get("BOB_CONFIG_PATH") or os.environ.get("JARVIS_CONFIG_PATH")
    if explicit:
        return Path(explicit)
    new = REPO_ROOT / "bob.config.yaml"
    if new.exists():
        return new
    legacy = REPO_ROOT / "jarvis.config.yaml"
    if legacy.exists():
        return legacy
    return new


# Resolved at import time so callers can introspect / log the path.
BOB_CONFIG_PATH = _config_path()
# Legacy alias for any external code that still imports the old name.
JARVIS_CONFIG_PATH = BOB_CONFIG_PATH


def _read_yaml(path: Path) -> Dict[str, Any]:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


@lru_cache(maxsize=1)
def assistant_config() -> Dict[str, Any]:
    return _read_yaml(BOB_CONFIG_PATH)


@lru_cache(maxsize=1)
def engines_config() -> Dict[str, Any]:
    return _read_yaml(ENGINES_CONFIG_PATH)


def system_prompt() -> str:
    return assistant_config().get("system", "You are B.O.B.")


def assistant_name() -> str:
    return assistant_config().get("name", "B.O.B")


def env(key: str, default: str | None = None) -> str | None:
    val = os.environ.get(key)
    return val if val not in (None, "") else default


def _env_with_legacy(new_key: str, legacy_key: str, default: str | None = None) -> str | None:
    """Read new env var first, fall back to legacy, then default."""
    return env(new_key) or env(legacy_key) or default


def host() -> str:
    return _env_with_legacy("BOB_HOST", "JARVIS_HOST", "127.0.0.1") or "127.0.0.1"


def port() -> int:
    return int(_env_with_legacy("BOB_PORT", "JARVIS_PORT", "8765") or "8765")


DATA_DIR.mkdir(parents=True, exist_ok=True)
PLUGINS_DIR.mkdir(parents=True, exist_ok=True)
