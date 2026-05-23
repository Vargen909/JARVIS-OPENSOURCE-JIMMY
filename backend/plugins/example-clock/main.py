"""Example plugin entrypoint. Real plugin loader is a future extension."""

from datetime import datetime


def run() -> str:
    return f"It's {datetime.now().isoformat(timespec='seconds')} locally."
