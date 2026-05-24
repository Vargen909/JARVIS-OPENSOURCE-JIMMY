#!/usr/bin/env bash
set -u
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Stopping B.O.B backend..."
bash "${ROOT}/scripts/stop-backend.sh" || true

echo "==> Stopping B.O.B frontend..."
bash "${ROOT}/scripts/stop-frontend.sh" || true

echo "Done."
