"""On-disk migration helper.

Runs once at startup before any module touches encryption keys, the SQLite
database, or the assistant config. Renames legacy "jarvis.*" files to their
new "bob.*" names, preserving all data (encryption key bytes, conversation
history, learned memory) so existing users keep their setup after the
rebrand to B.O.B.

Idempotent: a second run is a no-op once the new names exist.
"""

from __future__ import annotations

from pathlib import Path


_RENAMES: tuple[tuple[str, str], ...] = (
    (".jarvis_key", ".bob_key"),
    ("jarvis.config.yaml", "bob.config.yaml"),
    ("backend/data/jarvis.sqlite", "backend/data/bob.sqlite"),
    ("jarvis.log", "bob.log"),
    ("jarvis.log.err", "bob.log.err"),
    ("jarvis.err.log", "bob.err.log"),
)


def migrate_legacy_paths(repo_root: Path) -> list[str]:
    """Rename legacy jarvis.* files at repo_root to bob.* in place.

    Returns the list of paths that were actually renamed (useful for
    startup logs).
    """
    moved: list[str] = []
    for old, new in _RENAMES:
        old_p = repo_root / old
        new_p = repo_root / new
        try:
            if old_p.exists() and not new_p.exists():
                new_p.parent.mkdir(parents=True, exist_ok=True)
                old_p.rename(new_p)
                moved.append(f"{old} -> {new}")
        except OSError:
            # Best-effort: don't crash the app if a rename fails (e.g. file
            # locked). The new code paths will fall back to legacy reads.
            continue
    return moved
