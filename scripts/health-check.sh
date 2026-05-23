#!/usr/bin/env bash
# Probes the Jarvis backend. Exit 0 on success, 1 on any failure.
set -u

PORT="${JARVIS_PORT:-8765}"
BASE="http://127.0.0.1:${PORT}"
TIMEOUT="${JARVIS_HEALTH_TIMEOUT:-5}"

probe() {
  local path="$1" label="$2"
  local code body
  body="$(curl -sS --max-time "$TIMEOUT" -o /tmp/jarvis_health_body -w '%{http_code}' "${BASE}${path}" 2>/dev/null)" || code="ERR"
  code="${body}"
  if [ "$code" -ge 200 ] 2>/dev/null && [ "$code" -lt 400 ]; then
    printf "  [OK ] %-16s %s\n" "$label" "$code"
    return 0
  fi
  printf "  [FAIL] %-16s %s\n" "$label" "${code:-ERR}"
  if [ -s /tmp/jarvis_health_body ]; then
    head -c 200 /tmp/jarvis_health_body
    echo
  fi
  return 1
}

echo "Jarvis health check -> ${BASE}"
echo

failed=0
probe "/"              "root"          || failed=$((failed+1))
probe "/info"          "info"          || failed=$((failed+1))
probe "/safety/config" "safety/config" || failed=$((failed+1))
probe "/engines"       "engines"       || failed=$((failed+1))

echo
if [ "$failed" -eq 0 ]; then
  if command -v jq >/dev/null 2>&1; then
    info_body="$(curl -sS --max-time "$TIMEOUT" "${BASE}/info" 2>/dev/null || echo '{}')"
    summary="$(echo "$info_body" | jq -r '.engines | map("\(.id)(\(if .available then "ok" else "off" end))") | join(", ")' 2>/dev/null || true)"
    [ -n "$summary" ] && echo "Engines: $summary"
  fi
  echo "All checks passed."
  exit 0
fi

echo "${failed} check(s) failed." >&2
exit 1
