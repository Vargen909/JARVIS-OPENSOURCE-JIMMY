#!/usr/bin/env bash
# Stops any process listening on the Jarvis backend port. Idempotent.
set -u

PORT="${JARVIS_PORT:-8765}"

pids=""
if command -v lsof >/dev/null 2>&1; then
  pids="$(lsof -ti tcp:"$PORT" 2>/dev/null || true)"
elif command -v fuser >/dev/null 2>&1; then
  pids="$(fuser -n tcp "$PORT" 2>/dev/null | tr -s ' ' '\n' | grep -v '^$' || true)"
fi

if [ -z "${pids}" ]; then
  echo "Backend not running on port ${PORT}."
  exit 0
fi

echo "Stopping backend PIDs on port ${PORT}: ${pids}"
for pid in $pids; do
  kill "$pid" 2>/dev/null || true
done
sleep 1
for pid in $pids; do
  if kill -0 "$pid" 2>/dev/null; then
    kill -9 "$pid" 2>/dev/null || true
  fi
done
echo "Done."
