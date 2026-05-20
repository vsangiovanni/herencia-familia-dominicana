#!/usr/bin/env python3
"""Sube .env.prod.working al servidor como .env (FTP). No imprime contraseñas."""
from __future__ import annotations

import sys
from ftplib import FTP
from io import BytesIO
from pathlib import Path

from hostinger_creds import cwd_to_remote, ftp_connection_params, load_credentials

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / ".env.prod.working"
REMOTE_NAME = ".env"


def upload_env() -> None:
    if not SOURCE.is_file():
        raise FileNotFoundError(
            f"No existe {SOURCE}. Cree el archivo con credenciales de produccion (no versionar)."
        )

    content = SOURCE.read_bytes()
    host, user, password, remote_dir = ftp_connection_params(load_credentials())
    ftp = FTP(host, timeout=300)
    ftp.login(user, password)
    cwd_to_remote(ftp, remote_dir)
    print(f"PWD: {ftp.pwd()}")
    ftp.storbinary(f"STOR {REMOTE_NAME}", BytesIO(content))
    ftp.quit()
    print(f"OK: {REMOTE_NAME} subido ({len(content)} bytes) desde .env.prod.working")


def main() -> int:
    try:
        upload_env()
        return 0
    except Exception as error:  # noqa: BLE001
        print(f"ERROR: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
