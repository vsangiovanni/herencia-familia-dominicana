# Despliegue en Hostinger

**URL:** https://herenciard.vmsencf.com  
**Directorio remoto (document root):** raíz del login FTP (`/`), **no** la subcarpeta `herenciard/`

El subdominio apunta al mismo directorio que la raíz FTP de la cuenta (`index.html`, `assets/`, `api.php`). Los scripts ignoran `REMOTE_DIR` si apunta a `.../herenciard` y despliegan en `/`.

## Resumen rápido

```sh
pnpm run build
pnpm run deploy          # sube dist/ por FTP
pnpm run check:prod      # verifica health y rutas Sienna
```

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
git add -A
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
3. `npm run migrate:genealogy:prod` — migración de filiación en MySQL de producción (solo cuando el release lo incluya).
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

## Git

`dist/` está en `.gitignore`; el artefacto de producción se sube solo por FTP.

Tras validar local y producción:

```sh
git add -A
git commit -m "descripción del cambio"
git push origin main
```

## Arquitectura en producción

```text
Navegador → herenciard.vmsencf.com
         → Apache + .htaccess (SPA + /api → api.php)
         → MySQL (Hostinger)
```

Desarrollo local usa Node (`server/index.js`) con proxy Vite en `/api`.
