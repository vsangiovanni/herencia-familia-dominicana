# Despliegue en Hostinger

**URL:** https://herenciard.vmsencf.com  
**Directorio remoto (document root):** raíz del login FTP (`/`), **no** la subcarpeta `herenciard/`

## Regla de autorización

No desplegar a Hostinger, producción ni GitHub sin permiso explícito de Víctor para ese despliegue concreto.

Flujo obligatorio:

- Trabajar y validar en local.
- Correr verificación mínima (`php -l public/api.php` cuando cambie PHP y `pnpm run build`).
- Informar resultado.
- Desplegar solo cuando Víctor autorice subir esa versión.
- Si la autorización dice solo frontend/backend, no ejecutar migraciones, no tocar BD, no subir `.env` y no modificar archivos productivos fuera del artefacto desplegado.

El subdominio apunta al mismo directorio que la raíz FTP de la cuenta (`index.html`, `assets/`, `api.php`). Los scripts ignoran `REMOTE_DIR` si apunta a `.../herenciard` y despliegan en `/`.

## Resumen rápido

```sh
pnpm run build
pnpm run deploy          # sube TODO dist/ por FTP (incluye dist/game/, ~180M, puede colgarse)
pnpm run deploy:fast     # sube dist/ EXCEPTO dist/game/ (rápido; usar si no cambió el juego)
pnpm run check:prod      # verifica health y rutas Sienna
```

`deploy:fast` omite `dist/game/` (~175M de media inmutable del Legado, ya en el servidor). Es el
camino recomendado para releases de frontend/backend que no tocan assets del juego; evita que el
FTP completo se cuelgue. Si cambian assets del juego, usar `pnpm run deploy`.

Ejecutar estos comandos solo después de autorización explícita de deploy.

Despliegue alterno por MCP Hostinger (recomendado cuando FTP esté lento o inestable):

1. Compilar y empaquetar **con** `.env` de producción:
   ```sh
   pnpm run build
   python3 scripts/build-prod-deploy-zip.py
   ```
   Genera `herenciard_deploy_full.zip` (`dist/` + `.env` desde `.env.prod.working`).

2. Desplegar con MCP:
   - Tool: `hosting_deployStaticWebsite`
   - Dominio: `herenciard.vmsencf.com`
   - Archivo: `herenciard_deploy_full.zip` (ruta absoluta al zip)

3. Verificar:
   ```sh
   pnpm run check:prod
   ```

**Importante:** un zip **sin** `.env` deja el backend en **503** hasta ejecutar `npm run deploy:env`. Preferir `herenciard_deploy_full.zip` en deploys MCP.

Solo cambió el backend PHP:

```sh
pnpm run build
pnpm run deploy:api
```

Pipeline todo-en-uno (build + FTP + verificación HTTP):

```sh
pnpm run release
# equivalente: bash scripts/run-release.sh
```

Flujo recomendado con Git:

```sh
git status --short
# Staging explícito: no usar git add -A si hay zips, backups, .env, logs o auditorias locales.
git add <archivos_fuente_y_docs_del_release>
git commit -m "descripción del cambio"
git push origin main
pnpm run release
```

## Migración de filiación (uniones + vínculos parentales)

Después de desplegar código con tablas `family_unions` y `member_parent_links`:

1. **Local (opcional, ya hecho en desarrollo):**
   ```sh
   pnpm run migrate:genealogy
   ```
2. **Producción (obligatorio la primera vez):** con credenciales en `.env.prod.working` (no versionar):
   ```sh
   pnpm run migrate:genealogy:prod
   ```
   El script crea tablas si faltan, repuebla uniones y `member_parent_links` desde `parent_id` / `spouse_member_id` sin borrar campos legacy. Marca inconsistencias (p. ej. cónyuge solo en texto).

3. Verificar API autenticada: `GET /api/sienna-family-members` debe incluir `unions` y `parent_links`.

Las tablas también se crean al primer request si `api.php` arranca migraciones embebidas; la **población** de datos históricos requiere el script anterior.

## Checklist manual

1. `pnpm run build` — genera `dist/` (HTML, assets, `api.php`, `.htaccess`, favicon).
2. `python3 scripts/deploy-dist.py` — sube todo `dist/` por FTP **sin** sobrescribir `.env` remoto.
3. `pnpm run migrate:genealogy:prod` — migración de filiación en MySQL de producción (solo cuando el release lo incluya y Víctor autorice tocar BD).
4. `bash scripts/post-deploy-check.sh` — health + rutas Sienna en HTTP 200.

Si usas MCP para static deploy:

4. Verificar inmediatamente `GET /api/health` y login.
5. Confirmar que `.env` del servidor siga presente y válido (DB/JWT), porque un deploy estático mal empaquetado puede romper backend.

## Scripts

| Script | Función |
|--------|---------|
| `scripts/hostinger_creds.py` | Lee y parsea credenciales FTP (export del panel o formato `KEY=value`) |
| `scripts/deploy-dist.py` | Sube recursivamente `dist/` |
| `scripts/deploy-api-php.py` | Sube solo `dist/api.php` y verifica URLs |
| `scripts/post-deploy-check.sh` | `curl` a health y rutas Sienna |
| `scripts/build-prod-deploy-zip.py` | Genera `herenciard_deploy_full.zip` (dist + `.env` prod) para MCP |
| `scripts/upload-prod-env.py` | Sube `.env.prod.working` como `.env` remoto (FTP) |

| `scripts/run-release.sh` | Build + deploy-dist + check |

El pipeline usa `pnpm` para build/release; mantener `npm` solo si un entorno externo lo exige.

Los scripts de deploy **nunca** suben ni sobrescriben `.env` en el servidor vía FTP.
El despliegue estático por MCP depende de lo que vaya dentro del zip; use `build-prod-deploy-zip.py` para incluir credenciales.

## Variables en servidor

Archivo `public_html/herenciard/.env` (no versionar). Plantilla: [`.env.production.example`](../.env.production.example).

| Variable | Uso |
|----------|-----|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | MySQL |
| `JWT_SECRET` | Sesiones API |

Sin `.env`, `GET /api/health` responde **503** con mensaje claro.

## Credenciales FTP

Archivo local (no versionar), buscado en este orden:

1. `/mnt/c/Users/PC/Desktop/Credenciales Hostinger.txt` (WSL → Windows)
2. `~/Desktop/Credenciales Hostinger.txt`

### Formatos soportados

**Export del panel Hostinger** (tabulador o dos puntos):

```text
FTP IP	ftp.vmsencf.com
FTP username	u123456789
FTP pass: tu_contraseña
/home/u123456789/domains/vmsencf.com/public_html/herenciard
```

**Formato clave=valor:**

```text
HOST=ftp.vmsencf.com
USER=u123456789
PASS=contraseña
REMOTE_DIR=.
```

`REMOTE_DIR` con `herenciard` en la ruta se trata como raíz `/` (deploy histórico en subcarpeta no servía el subdominio).

## Vista previa en WhatsApp / redes

WhatsApp usa `og:image` en **PNG/JPG**, URL **absoluta** (`https://herenciard.vmsencf.com/og-image.png`). No usa SVG.

Tras desplegar, si sigue el icono antiguo:

1. Purga caché en hPanel → Hostinger → **Clear cache**
2. [Depurador de Facebook](https://developers.facebook.com/tools/debug/) → pegar la URL → **Scrape Again**
3. Reenviar el enlace en WhatsApp (la vista previa se cachea por URL)

## Verificación

```sh
curl --max-time 20 -s https://herenciard.vmsencf.com/api/health
# {"ok":true,"storage":"mysql","runtime":"php"}
```

Rutas Sienna deben devolver HTTP 200 (SPA):

- `/sienna/arbol-genealogico`
- `/sienna/explicacion-herederos`
- `/sienna/miembros-arbol`

## Incidente de assets Vite - 2026-05-27

Produccion quedo en pantalla negra despues de un deploy porque el navegador pidio chunks viejos bajo `/assets/*.js` y Apache/Hostinger devolvio `index.html` con `content-type: text/html`. El error visible en consola fue:

```text
Expected a JavaScript-or-Wasm module script but the server responded with MIME type "text/html"
Failed to fetch dynamically imported module
```

Correccion aplicada:

- `public/.htaccess`: si un archivo bajo `/assets/` no existe, responder 404 en vez de aplicar fallback SPA a `index.html`.
- `public/sw.js`: subir `CACHE_VERSION` a `legado-sangiovanni-v4` y no cachear respuestas HTML como si fueran JS.
- `src/main.tsx`: escuchar `vite:preloadError` y ejecutar una recarga unica para recuperar navegadores con `index.html` viejo y chunks nuevos.

Validacion ejecutada tras deploy:

- `/api/health` respondio `{"ok":true,"storage":"mysql","runtime":"php"}`.
- Rutas Sienna principales respondieron 200.
- Assets principales respondieron `200 application/x-javascript`.
- CSS respondio `200 text/css`.
- Asset inexistente bajo `/assets/*.js` respondio 404, no `index.html`.

Nota operativa: el FTP completo puede colgarse con media pesada del juego. En urgencias, usar deploy quirurgico de `.htaccess`, `index.html`, `sw.js`, `api.php`, manifest y `dist/assets/*`; luego validar HTTP antes de reportar cierre.

## Git

`dist/` está en `.gitignore`; el artefacto de producción se sube solo por FTP.

Tras validar local y producción:

```sh
git status --short
git add <archivos_fuente_y_docs_del_release>
git commit -m "descripción del cambio"
git push origin main
```

No versionar ni subir: `.env*`, zips de deploy, backups, logs, salidas de auditoría, builds locales ni archivos temporales.

## Arquitectura en producción

```text
Navegador → herenciard.vmsencf.com
         → Apache + .htaccess (SPA + /api → api.php)
         → MySQL (Hostinger)
```

Desarrollo local usa Node (`server/index.js`) con proxy Vite en `/api`.
