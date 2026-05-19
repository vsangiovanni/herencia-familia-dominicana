#!/usr/bin/env bash
# Commit (si hay cambios), push a GitHub y despliegue Hostinger.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
LOG="$ROOT/release-output.txt"

exec > >(tee "$LOG") 2>&1

echo "=== GIT STATUS ==="
git status -sb

if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
  git add README.md docs/ package.json scripts/run-release.sh scripts/push-and-release.sh \
    src/components/PageHelp.tsx src/components/BackButton.tsx src/components/DocumentHeader.tsx \
    src/data/screenHelp.ts src/pages/ public/
  git add -u
  git commit -m "$(cat <<'EOF'
feat(ui): ayuda contextual por pantalla y botón Atrás inteligente

Añade PageHelp con textos en screenHelp.ts, integración en DocumentHeader
y documentación en docs/UI.md. BackButton solo visible fuera de rutas raíz.
EOF
)"
fi

echo "=== GIT PUSH ==="
git push origin main

echo "=== RELEASE (build + FTP + check) ==="
bash scripts/run-release.sh

echo ""
echo "OK. Log completo: $LOG"
git log -1 --oneline
