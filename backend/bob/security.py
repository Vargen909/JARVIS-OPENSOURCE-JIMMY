"""Local encryption helper for per-user memory.

Derives a Fernet key from BOB_SECRET (with JARVIS_SECRET fallback) or a
generated key file at .bob_key. Used to encrypt sensitive memory fields
stored in SQLite.

Migration: at startup _migrate.py renames .jarvis_key -> .bob_key when
the old file exists and the new one does not, preserving the bytes so
previously encrypted memory keeps decrypting correctly.
"""

from __future__ import annotations

import base64
import hashlib
import os
from pathlib import Path

from cryptography.fernet import Fernet

from .config import REPO_ROOT, env

_KEY_FILE = REPO_ROOT / ".bob_key"
_LEGACY_KEY_FILE = REPO_ROOT / ".jarvis_key"


def _load_or_create_key() -> bytes:
    secret = env("BOB_SECRET") or env("JARVIS_SECRET")
    if secret:
        digest = hashlib.sha256(secret.encode("utf-8")).digest()
        return base64.urlsafe_b64encode(digest)

    # Defensive: if migration somehow didn't run, still pick up the legacy
    # file rather than generating a fresh key (which would lock out memory).
    if _KEY_FILE.exists():
        return _KEY_FILE.read_bytes().strip()
    if _LEGACY_KEY_FILE.exists():
        try:
            _LEGACY_KEY_FILE.rename(_KEY_FILE)
        except OSError:
            return _LEGACY_KEY_FILE.read_bytes().strip()
        return _KEY_FILE.read_bytes().strip()

    key = Fernet.generate_key()
    _KEY_FILE.write_bytes(key)
    try:
        os.chmod(_KEY_FILE, 0o600)
    except OSError:
        pass
    return key


_FERNET = Fernet(_load_or_create_key())


def encrypt(plaintext: str) -> str:
    return _FERNET.encrypt(plaintext.encode("utf-8")).decode("utf-8")


def decrypt(token: str) -> str:
    if not token:
        return ""
    return _FERNET.decrypt(token.encode("utf-8")).decode("utf-8")
