#!/usr/bin/env bash
# Start backend (detached via nohup) + frontend (foreground).
# Pass --production to build frontend first and run next start.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PRODUCTION=0
for arg in "$@"; do
  case "$arg" in
    --production|--prod) PRODUCTION=1 ;;
  esac
done

BACKEND_PORT="${JARVIS_PORT:-8765}"

echo "==> Stopping any previous Jarvis processes..."
bash "${ROOT}/scripts/stop-all.sh" || true

echo "==> Starting backend (detached)..."
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate
python -m pip install --upgrade pip >/dev/null
pip install -q -r backend/requirements.txt
export PYTHONPATH="${ROOT}/backend"
nohup python -m jarvis.main >"${ROOT}/jarvis.log" 2>"${ROOT}/jarvis.log.err" &
BACKEND_PID=$!
echo "Backend PID: ${BACKEND_PID} (log: ${ROOT}/jarvis.log)"

echo "==> Waiting for backend to become healthy..."
ready=0
for _ in $(seq 1 20); do
  sleep 0.5
  if curl -sf "http://127.0.0.1:${BACKEND_PORT}/" >/dev/null 2>&1; then
    ready=1
    break
  fi
done
if [ "$ready" -eq 1 ]; then
  echo "Backend healthy at http://127.0.0.1:${BACKEND_PORT}"
else
  echo "WARNING: backend did not respond at http://127.0.0.1:${BACKEND_PORT} within 10s. Check jarvis.log." >&2
fi

echo "==> Starting frontend..."
if [ "$PRODUCTION" -eq 1 ]; then
  bash "${ROOT}/scripts/start-frontend-prod.sh"
else
  bash "${ROOT}/scripts/start-frontend.sh"
fi
