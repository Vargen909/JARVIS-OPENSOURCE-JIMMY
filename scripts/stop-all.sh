#!/usr/bin/env bash
set -u
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Stopping Jarvis backend..."
bash "${ROOT}/scripts/stop-backend.sh" || true

echo "==> Stopping Jarvis frontend..."
bash "${ROOT}/scripts/stop-frontend.sh" || true

echo "Done."
