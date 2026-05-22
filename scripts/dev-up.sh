#!/usr/bin/env bash
# Levanta API (3001) + Vite (8080) y deja registro en dev-status.log
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
STATUS="$ROOT/dev-status.log"

{
  echo "=== START $(date -Iseconds) ==="
  test -f .env || cp .env.example .env

  fuser -k 3001/tcp 8080/tcp 2>/dev/null || true
  sleep 1

  nohup node server/index.js >> server-dev.log 2>&1 &
  echo "API_PID=$!"

  sleep 2
  curl -fsS http://127.0.0.1:3001/api/health && echo " API_OK" || { echo " API_FAIL"; tail -10 server-dev.log; exit 1; }

  nohup pnpm run dev -- --host 0.0.0.0 --port 8080 >> vite-dev.log 2>&1 &
  echo "VITE_PID=$!"

  sleep 5
  curl -fsS -o /dev/null http://127.0.0.1:8080/ && echo "VITE_OK" || { echo "VITE_FAIL"; tail -10 vite-dev.log; exit 1; }

  WSL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
  echo "URLs:"
  echo "  http://localhost:8080/"
  echo "  http://127.0.0.1:8080/"
  if [ -n "${WSL_IP:-}" ]; then
    echo "  http://${WSL_IP}:8080/  (si localhost no responde en Windows)"
  fi
  ss -tlnp 2>/dev/null | grep -E '3001|8080' || true
  echo "=== DONE ==="
} 2>&1 | tee -a "$STATUS"
