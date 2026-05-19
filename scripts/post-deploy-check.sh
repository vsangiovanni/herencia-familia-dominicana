#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://herenciard.vmsencf.com}"

echo "== Health =="
health="$(curl -fsS "${BASE_URL}/api/health")"
echo "$health"
echo "$health" | grep -q '"ok":true' || {
  echo "FALLO: /api/health no devolvió ok:true"
  exit 1
}

echo ""
echo "== Rutas Sienna =="
for path in \
  /sienna/arbol-genealogico \
  /sienna/explicacion-herederos \
  /sienna/miembros-arbol; do
  code="$(curl -s -o /dev/null -w '%{http_code}' "${BASE_URL}${path}")"
  echo "${path} -> ${code}"
  [[ "$code" == "200" ]] || exit 1
done

echo ""
echo "OK: producción responde correctamente."
