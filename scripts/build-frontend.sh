#!/usr/bin/env bash
# Verifies the frontend produces a clean production build.
# Exit 0 on success, non-zero on failure. Does NOT start a server.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/frontend"

SKIP_INSTALL=0
for arg in "$@"; do
  case "$arg" in
    --skip-install) SKIP_INSTALL=1 ;;
  esac
done

if [ "$SKIP_INSTALL" -eq 0 ] && [ ! -d node_modules ]; then
  echo "==> Installing frontend dependencies..."
  npm install
fi

echo "==> Type-checking + building (next build)..."
BUILD_LOG="$ROOT/frontend-build.log"
if ! npm run build 2>&1 | tee "$BUILD_LOG"; then
  echo "Frontend build failed. See ${BUILD_LOG}" >&2
  exit 1
fi

echo
echo "Build OK. Output in frontend/.next/"
echo "Run ./scripts/start-frontend-prod.sh to serve the production build."
