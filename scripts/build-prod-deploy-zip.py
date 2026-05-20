#!/usr/bin/env python3
"""Genera zip de dist/ + .env de produccion para deploy MCP (restaura sitio y credenciales)."""
from __future__ import annotations

import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
ENV_SOURCE = ROOT / ".env.prod.working"
OUTPUT = ROOT / "herenciard_deploy_full.zip"


def main() -> int:
    if not DIST.is_dir():
        print("ERROR: falta dist/. Ejecute npm run build", file=sys.stderr)
        return 1
    if not ENV_SOURCE.is_file():
        print("ERROR: falta .env.prod.working", file=sys.stderr)
        return 1

    if OUTPUT.is_file():
        OUTPUT.unlink()

    with zipfile.ZipFile(OUTPUT, "w", zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(DIST.rglob("*")):
            if path.is_dir():
                continue
            archive.write(path, path.relative_to(DIST).as_posix())
        archive.write(ENV_SOURCE, ".env")

    print(f"OK: {OUTPUT} ({OUTPUT.stat().st_size} bytes)")
    print("Incluye dist/ completo y .env (desde .env.prod.working).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
