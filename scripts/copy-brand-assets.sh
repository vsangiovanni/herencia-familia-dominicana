#!/usr/bin/env bash
# Copia y optimiza PNG de marca a public/ (WhatsApp requiere og:image JPG/PNG < ~1 MB)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUB="$ROOT/public"
ASSETS_WIN="/mnt/c/Users/PC/.cursor/projects/wsl-localhost-Ubuntu-home-pc-openclaw-workspace-sienna-projects-herencia-familia-dominicana/assets"
ASSETS_LOCAL="$ROOT/assets"

mkdir -p "$PUB"
SRC=""
if [[ -f "$ASSETS_WIN/og-image.png" ]]; then
  SRC="$ASSETS_WIN"
elif [[ -f "$ASSETS_LOCAL/og-image.png" ]]; then
  SRC="$ASSETS_LOCAL"
else
  echo "ERROR: No se encontró og-image.png en assets/"
  exit 1
fi

python3 <<PY
from pathlib import Path
try:
    from PIL import Image
except ImportError:
    import shutil
    src = Path("$SRC")
    pub = Path("$PUB")
    for name in ("og-image.png", "icon-512.png"):
        shutil.copy2(src / name, pub / name)
    shutil.copy2(pub / "icon-512.png", pub / "apple-touch-icon.png")
    shutil.copy2(pub / "icon-512.png", pub / "favicon-192.png")
    shutil.copy2(pub / "icon-512.png", pub / "favicon.ico")
    print("WARN: Pillow no instalado; PNG sin optimizar")
    raise SystemExit(0)

src = Path("$SRC")
pub = Path("$PUB")

og = Image.open(src / "og-image.png").convert("RGB")
og = og.resize((1200, 630), Image.Resampling.LANCZOS)
og.save(pub / "og-image.png", "PNG", optimize=True)

icon = Image.open(src / "icon-512.png").convert("RGBA")
icon512 = icon.resize((512, 512), Image.Resampling.LANCZOS)
icon512.save(pub / "apple-touch-icon.png", "PNG", optimize=True)
icon192 = icon.resize((192, 192), Image.Resampling.LANCZOS)
icon192.save(pub / "favicon-192.png", "PNG", optimize=True)
icon32 = icon.resize((32, 32), Image.Resampling.LANCZOS)
icon32.save(pub / "favicon.ico", format="ICO", sizes=[(32, 32)])

print("OK: assets optimizados en public/")
for f in ("og-image.png", "apple-touch-icon.png", "favicon-192.png", "favicon.ico"):
    p = pub / f
    print(f"  {f}: {p.stat().st_size // 1024} KB")
PY

# Eliminar restos Lovable en public/
rm -rf "$PUB/lovable-uploads"
rm -f "$PUB/placeholder.svg"

echo "OK: eliminado lovable-uploads y placeholder.svg de public/"
