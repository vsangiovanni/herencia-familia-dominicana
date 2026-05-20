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

echo "=== SUBIR .env (produccion) ==="
if [ -f "$ROOT/.env.prod.working" ]; then
  python3 scripts/upload-prod-env.py || echo "AVISO: deploy:env fallo; suba .env manualmente"
else
  echo "AVISO: sin .env.prod.working; omitiendo deploy:env"
fi

if [ -f "$ROOT/.env.prod.working" ]; then
  echo "=== MIGRACION GENEALOGIA (produccion) ==="
  ENV_FILE="$ROOT/.env.prod.working" node scripts/migrate-sienna-genealogy.cjs
else
  echo "AVISO: sin .env.prod.working; omitiendo migrate:genealogy:prod"
fi

echo "=== CHECK PRODUCCION ==="
bash scripts/post-deploy-check.sh

echo ""
echo "OK: release completado. Log: $LOG"
