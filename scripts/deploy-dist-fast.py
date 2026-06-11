#!/usr/bin/env python3
"""Deploy rapido: sube todo dist/ EXCEPTO la media pesada del juego (dist/game/).

Identico a deploy-dist.py (no toca .env remoto, sube index.html al final, limpia bundles
legacy de Lovable) pero omite dist/game/ (~175M de imagenes/video/audio del Legado), que ya
esta en el servidor sin cambios. Asi el deploy de frontend + api.php no se cuelga por FTP.

Usar para releases que NO cambian assets del juego. Si cambia dist/game/, usar `pnpm run deploy`.
"""
from __future__ import annotations

import sys
from ftplib import FTP, error_perm
from pathlib import Path

from hostinger_creds import cwd_to_remote, ftp_connection_params, load_credentials

ROOT = Path(__file__).resolve().parents[1]
DIST_DIR = ROOT / "dist"
SKIP_REMOTE = {".env"}
# Carpetas en la raiz de dist/ que NO se suben en el deploy rapido (media pesada inmutable).
SKIP_TOP_DIRS = {"game"}

LEGACY_REMOTE_ENTRIES = (
    "lovable-uploads",
    "placeholder.svg",
)
LEGACY_ASSET_PREFIXES = ("index-BbdxFJDk", "index-NhyVeqOY")


def ftp_delete_tree(ftp: FTP, name: str) -> None:
    try:
        ftp.cwd(name)
    except error_perm:
        return
    for entry in ftp.nlst():
        if entry in (".", ".."):
            continue
        try:
            ftp.delete(entry)
            print(f"DEL file: {name}/{entry}")
        except error_perm:
            ftp_delete_tree(ftp, entry)
    ftp.cwd("..")
    try:
        ftp.rmd(name)
        print(f"DEL dir: {name}/")
    except error_perm:
        pass


def remove_legacy_assets(ftp: FTP) -> None:
    try:
        ftp.cwd("assets")
    except error_perm:
        return
    for name in ftp.nlst():
        if any(name.startswith(prefix) for prefix in LEGACY_ASSET_PREFIXES):
            try:
                ftp.delete(name)
                print(f"DEL legacy asset: assets/{name}")
            except error_perm:
                pass
    ftp.cwd("..")


def remove_legacy_remote(ftp: FTP) -> None:
    for entry in LEGACY_REMOTE_ENTRIES:
        try:
            ftp.delete(entry)
            print(f"DEL legacy: {entry}")
        except error_perm:
            ftp_delete_tree(ftp, entry)
    remove_legacy_assets(ftp)


def upload_file(ftp: FTP, item: Path) -> None:
    with item.open("rb") as handle:
        ftp.storbinary(f"STOR {item.name}", handle)
    print(f"OK: {item.relative_to(DIST_DIR)}")


def upload_tree(ftp: FTP, local_dir: Path) -> int:
    uploaded = 0
    for item in sorted(local_dir.iterdir()):
        if item.name in SKIP_REMOTE:
            print(f"SKIP (local): {item.name}")
            continue
        if local_dir == DIST_DIR and item.name == "index.html":
            print("DEFER: index.html (se sube al final para evitar chunks faltantes)")
            continue
        if item.is_dir():
            if item.name in LEGACY_REMOTE_ENTRIES:
                print(f"SKIP (local legacy): {item.name}")
                continue
            if local_dir == DIST_DIR and item.name in SKIP_TOP_DIRS:
                print(f"SKIP (media juego, no cambia): {item.name}/")
                continue
            try:
                ftp.cwd(item.name)
            except error_perm:
                ftp.mkd(item.name)
                ftp.cwd(item.name)
            uploaded += upload_tree(ftp, item)
            ftp.cwd("..")
            continue
        upload_file(ftp, item)
        uploaded += 1
    return uploaded


def upload_dist() -> int:
    if not DIST_DIR.is_dir():
        raise FileNotFoundError(f"Falta {DIST_DIR}. Ejecute pnpm run build primero.")

    host, user, password, remote_dir = ftp_connection_params(load_credentials())
    ftp = FTP(host, timeout=300)
    ftp.login(user, password)
    cwd_to_remote(ftp, remote_dir)
    print(f"PWD deploy: {ftp.pwd()}")

    remove_legacy_remote(ftp)
    count = upload_tree(ftp, DIST_DIR)
    index_file = DIST_DIR / "index.html"
    if index_file.exists():
        upload_file(ftp, index_file)
        count += 1
    ftp.quit()
    print(f"Listo: {count} archivo(s) subidos a {remote_dir}/ (sin .env, sin dist/game/)")
    return count


def main() -> int:
    try:
        upload_dist()
        return 0
    except Exception as error:  # noqa: BLE001
        print(f"ERROR: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
