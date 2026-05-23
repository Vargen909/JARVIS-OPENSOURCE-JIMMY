"""Loads the Jarvis assistant config + engine registry from yaml/env."""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict

import yaml
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parents[2]
JARVIS_CONFIG_PATH = REPO_ROOT / "jarvis.config.yaml"
ENGINES_CONFIG_PATH = REPO_ROOT / "engines.yaml"
DATA_DIR = REPO_ROOT / "backend" / "data"
PLUGINS_DIR = REPO_ROOT / "backend" / "plugins"

load_dotenv(REPO_ROOT / ".env")


def _read_yaml(path: Path) -> Dict[str, Any]:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


@lru_cache(maxsize=1)
def assistant_config() -> Dict[str, Any]:
    return _read_yaml(JARVIS_CONFIG_PATH)


@lru_cache(maxsize=1)
def engines_config() -> Dict[str, Any]:
    return _read_yaml(ENGINES_CONFIG_PATH)


def system_prompt() -> str:
    return assistant_config().get("system", "You are Jarvis.")


def assistant_name() -> str:
    return assistant_config().get("name", "Jarvis")


def env(key: str, default: str | None = None) -> str | None:
    val = os.environ.get(key)
    return val if val not in (None, "") else default


def host() -> str:
    return env("JARVIS_HOST", "127.0.0.1") or "127.0.0.1"


def port() -> int:
    return int(env("JARVIS_PORT", "8765") or "8765")


DATA_DIR.mkdir(parents=True, exist_ok=True)
PLUGINS_DIR.mkdir(parents=True, exist_ok=True)
