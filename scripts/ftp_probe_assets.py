#!/usr/bin/env python3
import ftplib, re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from hostinger_creds import ftp_connection_params, load_credentials

TARGET = "index-BbdxFJDk.js"
PATHS = ["/", "assets", "home", "home/u515809146", "herenciard", "herenciard/assets"]

def pwd(ftp):
    p = ftp.pwd()
    print("  PWD:", p)
    return p

def list_dir(ftp, label):
    print("  --- NLST %s ---" % label)
    items = sorted(ftp.nlst(), key=str.lower)
    for x in items:
        print("   ", x)
    print("  --- LIST -a %s ---" % label)
    lines = []
    ftp.retrlines("LIST -a", lines.append)
    for line in lines[:80]:
        print("   ", line)
    if len(lines) > 80:
        print("    ...", len(lines), "lines")
    return items, lines

def try_cwd(ftp, path):
    print("\n>> CWD", repr(path))
    pwd(ftp)
    try:
        ftp.cwd(path)
        print("  OK")
        pwd(ftp)
        return True
    except ftplib.error_perm as e:
        print("  FAIL", e)
        return False

host, user, password, remote = ftp_connection_params(load_credentials())
print("Connect", host, "default_remote", remote)
ftp = ftplib.FTP(host, timeout=90)
ftp.login(user, password)
print("=== ROOT ===")
pwd(ftp)
items, _ = list_dir(ftp, "root")
hits = [x for x in items if TARGET in x]
if hits:
    print("*** root hit", hits)

for sub in PATHS:
    if sub == "/":
        continue
    print("\n========", sub, "========")
    ftp.cwd("/")
    if not try_cwd(ftp, sub):
        continue
    items, _ = list_dir(ftp, sub)
    h = [x for x in items if TARGET in x or x.rstrip("/").endswith(TARGET)]
    if h:
        print("*** FOUND", sub, h)

ftp.cwd("/")
print("\n=== index.html at / ===")
out = Path("/tmp/ftp_probe_herencia/index_root.html")
out.parent.mkdir(parents=True, exist_ok=True)
with out.open("wb") as f:
    ftp.retrbinary("RETR index.html", f.write)
text = out.read_text(encoding="utf-8", errors="ignore")
print("saved", out, out.stat().st_size)
if TARGET in text:
    print("*** index references", TARGET)
else:
    print("bundles:", sorted(set(re.findall(r"index-[A-Za-z0-9_-]+\.js", text)))[:15])

ftp.cwd("assets")
print("\n=== assets NLST filter index-*.js ===")
for x in sorted(ftp.nlst(), key=str.lower):
    if x.endswith(".js") and "index" in x.lower():
        print(" ", x)
    if x == TARGET:
        print("*** EXACT", x)

ftp.quit()
print("Done.")