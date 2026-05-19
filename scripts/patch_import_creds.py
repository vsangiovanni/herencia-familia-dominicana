from pathlib import Path

ROOT = Path("/home/pc/.openclaw/workspace-sienna/projects/herencia-familia-dominicana/scripts")
OLD = '''def parse_credentials(text: str) -> dict[str, str]:
    data: dict[str, str] = {}
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            key, value = line.split("=", 1)
            data[key.strip().upper()] = value.strip().strip(\'"\').strip("\'")
            continue
        for pattern, key in [
            (r"(?i)host(?:name)?\\s*[:=]\\s*(\\S+)", "HOST"),
            (r"(?i)usuario|user(?:name)?\\s*[:=]\\s*(\\S+)", "USER"),
            (r"(?i)contraseña|password\\s*[:=]\\s*(\\S+)", "PASS"),
            (r"(?i)directorio|path\\s*[:=]\\s*(\\S+)", "REMOTE_DIR"),
        ]:
            match = re.search(pattern, line)
            if match:
                data[key] = match.group(1)
    return data


'''

for name in ("deploy-dist.py", "deploy-api-php.py"):
    path = ROOT / name
    text = path.read_text(encoding="utf-8")
    if OLD not in text:
        raise SystemExit(f"block missing in {name}")
    text = text.replace(OLD, "")
    needle = "from pathlib import Path"
    insert = needle + "\n\nfrom hostinger_creds import parse_credentials"
    if "from hostinger_creds import parse_credentials" not in text:
        text = text.replace(needle, insert, 1)
    path.write_text(text, encoding="utf-8")
    print("patched", name)
