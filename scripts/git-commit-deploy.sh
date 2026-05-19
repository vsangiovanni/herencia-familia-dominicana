#!/usr/bin/env bash
# Commit y push de documentación y scripts de despliegue.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

git restore --staged scripts/__pycache__ 2>/dev/null || true
git add \
  scripts/ \
  docs/ \
  README.md \
  package.json \
  .gitignore \
  .env.production.example \
  public/favicon.svg
git restore --staged scripts/__pycache__ 2>/dev/null || true

if git diff --cached --quiet; then
  echo "Nada que commitear (cambios ya en HEAD o sin stage)."
  git log -1 --oneline
  exit 0
fi

git commit -m "$(cat <<'EOF'
docs: despliegue Hostinger documentado y scripts FTP centralizados

- scripts/hostinger_creds.py parsea export del panel y KEY=value
- deploy-dist.py y deploy-api-php.py comparten credenciales y FTP
- docs/DEPLOY.md, BRANDING.md; npm run deploy, deploy:api, release
- run-release.sh: build + deploy dist + check prod
- .env.production.example y .gitignore para logs y __pycache__
EOF
)"

git push origin main
git log -1 --oneline
git status --short
