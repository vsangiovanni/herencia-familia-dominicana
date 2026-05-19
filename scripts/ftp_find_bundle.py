#!/usr/bin/env python3
from __future__ import annotations

import ftplib
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from hostinger_creds import ftp_connection_params, load_credentials

TARGET = "index-BbdxFJDk.js"
SEARCH_DIRS = [
    "domains/vmsencf.com/public_html",
    "domains/vmsencf.com/public_html/herenciard/assets",
    "domains/vmsencf.com/public_html/assets",
    "public_html",
    "public_html/herenciard/assets",
    "public_html/assets",
    "/domains/vmsencf.com/public_html",
    "/public_html",
]
INDEX_ROOTS = [
    "domains/vmsencf.com/public_html",
    "domains/vmsencf.com/public_html/herenciard",
    "public_html",
    "public_html/herenciard",
]


def pwd(ftp):
    try:
        p = ftp.pwd()
    except Exception as exc:
        p = "<error: %s>" % exc
    print("  PWD:", p)
    return p


def nlst_all(ftp, label="NLST"):
    print("  --- %s ---" % label)
    try:
        items = ftp.nlst()
    except Exception as exc:
        print("    NLST failed:", exc)
        return []
    for name in sorted(items, key=str.lower):
        print("   ", name)
    return items


def list_a(ftp):
    print("  --- LIST -a ---")
    lines = []
    try:
        ftp.retrlines("LIST -a", lines.append)
    except Exception as exc:
        print("    LIST -a failed:", exc)
        return lines
    for line in lines[:250]:
        print("   ", line)
    if len(lines) > 250:
        print("    ... (%s lines)" % len(lines))
    return lines


def try_cwd(ftp, path):
    print("\n>> CWD %r" % path)
    pwd(ftp)
    try:
        ftp.cwd(path)
    except ftplib.error_perm as exc:
        print("  CWD FAIL:", exc)
        return False
    print("  CWD OK")
    pwd(ftp)
    return True


def reset_root(ftp):
    for path in ("/", "."):
        try:
            ftp.cwd(path)
            return
        except Exception:
            pass


creds = load_credentials()
host, user, password, default_remote = ftp_connection_params(creds)
print("Connect %s user=%s default_remote=%s" % (host, user, default_remote))

ftp = ftplib.FTP(host, timeout=90)
ftp.login(user, password)

print("\n=== LOGIN (root) ===")
pwd(ftp)
nlst_all(ftp)
list_a(ftp)

for path in [
    "domains/vmsencf.com/public_html",
    "/domains/vmsencf.com/public_html",
    "public_html",
    "/public_html",
]:
    reset_root(ftp)
    if try_cwd(ftp, path):
        print("\n=== first ok public_html ===")
        nlst_all(ftp)
        list_a(ftp)
        break

found = []
print("\n========== SEARCH %s ==========" % TARGET)
for rel in SEARCH_DIRS:
    print("\n--- %s ---" % rel)
    reset_root(ftp)
    if not try_cwd(ftp, rel):
        continue
    items = nlst_all(ftp, "NLST " + rel)
    list_a(ftp)
    hits = [x for x in items if x == TARGET or x.endswith("/" + TARGET)]
    if hits:
        print("  *** HIT:", hits)
        found.append((rel, hits))
    for sub in ("assets", "herenciard", "herenciard/assets"):
        print("\n  >> sub", sub)
        try:
            ftp.cwd(sub)
        except Exception as exc:
            print("    sub fail:", exc)
            continue
        pwd(ftp)
        sub_items = nlst_all(ftp, rel + "/" + sub)
        sh = [x for x in sub_items if TARGET in x or x.rstrip("/").endswith(TARGET)]
        if sh:
            print("  *** FOUND %s/%s: %s" % (rel, sub, sh))
            found.append(("%s/%s" % (rel, sub), sh))
        try:
            ftp.cwd("..")
        except Exception:
            reset_root(ftp)
            try_cwd(ftp, rel)

print("\n========== SUMMARY ==========")
print(found if found else "No %s in listed paths" % TARGET)

out = Path("/tmp/ftp_probe_herencia")
out.mkdir(parents=True, exist_ok=True)
print("\n========== index.html ==========")
for rel in INDEX_ROOTS:
    print("\n--- from %s ---" % rel)
    reset_root(ftp)
    if not try_cwd(ftp, rel):
        continue
    local = out / ("index_" + rel.replace("/", "_") + ".html")
    try:
        with local.open("wb") as handle:
            ftp.retrbinary("RETR index.html", handle.write)
    except Exception as exc:
        print("  RETR fail:", exc)
        continue
    print("  saved", local, local.stat().st_size, "bytes")
    text = local.read_text(encoding="utf-8", errors="ignore")
    if TARGET in text:
        print("  *** references", TARGET)
    bundles = re.findall(r"index-[A-Za-z0-9_-]+\.js", text)
    if bundles:
        print("  bundles:", sorted(set(bundles))[:10])

ftp.quit()
print("Done.")