#!/usr/bin/env bash
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
OUT="$ROOT/dev-check.out"
: > "$OUT"

{
  echo "=== $(date -Iseconds) ==="
  echo "=== PORTS ==="
  ss -tlnp 2>/dev/null | grep 3001 || true
  ss -tlnp 2>/dev/null | grep 8080 || true
  echo "=== PROCESSES ==="
  pgrep -af "node server" || echo "no api process"
  pgrep -af vite || echo "no vite process"
  echo "=== CURL API ==="
  curl -s --max-time 5 http://127.0.0.1:3001/api/health || echo "API_FAIL"
  echo
  echo "=== CURL VITE 127 ==="
  curl -s -o /dev/null -w "code=%{http_code}\n" --max-time 5 http://127.0.0.1:8080/ || echo "VITE127_FAIL"
  echo "=== CURL VITE localhost ==="
  curl -s -o /dev/null -w "code=%{http_code}\n" --max-time 5 http://localhost:8080/ || echo "VITE_LOCAL_FAIL"
  echo "=== BUILD CHECK ==="
  npm run build 2>&1 | tail -30
  echo "=== SERVER LOG ==="
  tail -20 server-dev.log 2>/dev/null || true
  echo "=== VITE LOG ==="
  tail -20 vite-dev.log 2>/dev/null || true
} >> "$OUT" 2>&1

echo "WROTE $OUT"
