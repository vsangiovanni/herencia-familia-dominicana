#!/usr/bin/env bash
# Pipeline completo: build, deploy dist, verificar producción.
# Uso: bash scripts/run-release.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
LOG="$ROOT/release-output.txt"

exec > >(tee "$LOG") 2>&1

echo "=== BRAND ASSETS ==="
bash scripts/copy-brand-assets.sh

echo "=== BUILD ==="
npm run build

echo "=== DEPLOY dist/ (FTP, no toca .env remoto) ==="
python3 scripts/deploy-dist.py

echo "=== CHECK PRODUCCION ==="
bash scripts/post-deploy-check.sh

echo ""
echo "OK: release completado. Log: $LOG"
