#!/usr/bin/env python3
"""Sube dist/api.php a Hostinger sin tocar .env remoto."""
from __future__ import annotations

import json
import sys
import urllib.request
from ftplib import FTP
from pathlib import Path

from hostinger_creds import cwd_to_remote, ftp_connection_params, load_credentials

ROOT = Path(__file__).resolve().parents[1]
API_FILE = ROOT / "dist" / "api.php"
PROD_BASE = "https://herenciard.vmsencf.com"


def upload_api() -> None:
    if not API_FILE.is_file():
        raise FileNotFoundError(f"Falta {API_FILE}. Ejecute npm run build primero.")

    host, user, password, remote_dir = ftp_connection_params(load_credentials())
    ftp = FTP(host, timeout=60)
    ftp.login(user, password)
    cwd_to_remote(ftp, remote_dir)
    with API_FILE.open("rb") as handle:
        ftp.storbinary("STOR api.php", handle)
    ftp.quit()
    print(f"OK: subido {API_FILE} -> {remote_dir}/api.php")


def check_urls() -> dict[str, object]:
    results: dict[str, object] = {}
    health_url = f"{PROD_BASE}/api/health"
    with urllib.request.urlopen(health_url, timeout=30) as response:
        body = response.read().decode("utf-8")
        results["health_status"] = response.status
        results["health_body"] = json.loads(body) if body.startswith("{") else body

    for path in [
        "/sienna/arbol-genealogico",
        "/sienna/explicacion-herederos",
        "/sienna/miembros-arbol",
    ]:
        url = f"{PROD_BASE}{path}"
        with urllib.request.urlopen(url, timeout=30) as response:
            results[path] = response.status
    return results


def main() -> int:
    try:
        upload_api()
        print(json.dumps(check_urls(), indent=2, ensure_ascii=False))
        return 0
    except Exception as error:  # noqa: BLE001
        print(f"ERROR: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
