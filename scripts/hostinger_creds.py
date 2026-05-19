"""Credenciales FTP Hostinger para scripts de despliegue."""
from __future__ import annotations

import re
from pathlib import Path

CRED_PATHS = [
    Path("/mnt/c/Users/PC/Desktop/Credenciales Hostinger.txt"),
    Path.home() / "Desktop" / "Credenciales Hostinger.txt",
]

DEFAULT_HOST = "ftp.vmsencf.com"
# herenciard.vmsencf.com apunta al document root del login FTP (raíz), no a subcarpeta herenciard/
DEFAULT_REMOTE_DIR = "."


def _map_label(label: str) -> str | None:
    normalized = label.strip().lower()
    if "ftp" in normalized and "user" in normalized:
        return "USER"
    if "ftp" in normalized and "pass" in normalized:
        return "PASS"
    if "ftp" in normalized and ("host" in normalized or "ip" in normalized or "hostname" in normalized):
        return "HOST"
    if "directorio" in normalized or normalized in {"path", "remote_dir"}:
        return "REMOTE_DIR"
    if normalized in {"host", "hostname", "ftp_host"}:
        return "HOST"
    if normalized in {"user", "username", "ftp_user"}:
        return "USER"
    if normalized in {"pass", "password", "ftp_pass"}:
        return "PASS"
    return None


def _normalize_host(value: str) -> str:
    value = value.strip()
    if value.startswith("ftp://"):
        value = value[6:]
    return value.split("/", 1)[0].strip()


def parse_credentials(text: str) -> dict[str, str]:
    data: dict[str, str] = {}
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line and "\t" not in line:
            key, value = line.split("=", 1)
            data[key.strip().upper()] = value.strip().strip('"').strip("'")
            continue
        if "\t" in line:
            label, value = line.split("\t", 1)
            mapped = _map_label(label)
            if mapped:
                val = value.strip()
                data[mapped] = _normalize_host(val) if mapped == "HOST" else val
            continue
        if ":" in line:
            label, _, value = line.partition(":")
            mapped = _map_label(label)
            if mapped:
                val = value.strip()
                data[mapped] = _normalize_host(val) if mapped == "HOST" else val
            continue
        if re.fullmatch(r"[a-z0-9.-]+\.[a-z]{2,}", line, flags=re.IGNORECASE):
            data.setdefault("HOST", line)
            continue
        if line.startswith("/") and "public_html" in line:
            data.setdefault("REMOTE_DIR", line.lstrip("/"))
            continue
        for pattern, key in [
            (r"(?i)host(?:name)?\s*[:=]\s*(\S+)", "HOST"),
            (r"(?i)usuario|user(?:name)?\s*[:=]\s*(\S+)", "USER"),
            (r"(?i)contraseña|password|ftp\s*pass\w*\s*[:=]\s*(\S+)", "PASS"),
            (r"(?i)directorio|path\s*[:=]\s*(\S+)", "REMOTE_DIR"),
        ]:
            match = re.search(pattern, line)
            if match:
                data[key] = match.group(1)
    if data.get("REMOTE_DIR", "").startswith("/"):
        data["REMOTE_DIR"] = data["REMOTE_DIR"].lstrip("/")
    return data


def load_credentials() -> dict[str, str]:
    for path in CRED_PATHS:
        if path.is_file():
            return parse_credentials(path.read_text(encoding="utf-8", errors="ignore"))
    searched = ", ".join(str(p) for p in CRED_PATHS)
    raise FileNotFoundError(f"No se encontró archivo de credenciales Hostinger. Buscado en: {searched}")


def resolve_remote_dir(creds: dict[str, str]) -> str:
    """Document root real de herenciard.vmsencf.com = raíz del login FTP."""
    raw = (creds.get("REMOTE_DIR") or DEFAULT_REMOTE_DIR).strip()
    if raw in (".", "/", ""):
        return "."
    # Subcarpeta herenciard/ es un deploy paralelo; el subdominio no la sirve
    if "herenciard" in raw.lower():
        return "."
    return raw.lstrip("/")


def cwd_to_remote(ftp, remote_dir: str) -> None:
    if remote_dir in (".", "", "/"):
        return
    for part in remote_dir.strip("/").split("/"):
        if part and part != ".":
            try:
                ftp.cwd(part)
            except Exception:
                ftp.mkd(part)
                ftp.cwd(part)


def ftp_connection_params(creds: dict[str, str]) -> tuple[str, str, str, str]:
    host = creds.get("HOST") or creds.get("FTP_HOST") or DEFAULT_HOST
    user = creds.get("USER") or creds.get("FTP_USER")
    password = creds.get("PASS") or creds.get("FTP_PASS") or creds.get("PASSWORD")
    remote_dir = resolve_remote_dir(creds)
    if not user or not password:
        raise ValueError("Credenciales FTP incompletas (usuario/contraseña)")
    return host, user, password, remote_dir
