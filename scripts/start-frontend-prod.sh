#!/usr/bin/env bash
# Builds the frontend (unless --skip-build) and serves it with `next start`.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/frontend"

PORT="${JARVIS_FRONTEND_PORT:-3000}"
SKIP_BUILD=0
for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=1 ;;
  esac
done

if [ "$SKIP_BUILD" -eq 0 ]; then
  bash "${ROOT}/scripts/build-frontend.sh"
fi

echo "==> Starting production frontend on port ${PORT}..."
npx next start -p "$PORT"
