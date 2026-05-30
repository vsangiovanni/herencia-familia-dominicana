# HerenciaRD Handoff - 2026-05-30

## Estado actual

- Proyecto estable en produccion despues de la ronda de fotos/miembros del 2026-05-29.
- GitHub esta alineado: `main`, `origin/main` y `origin/HEAD` apuntan al ultimo commit conocido.
- Ultimo commit verificado: `33e6cae Use backend member photos only`.
- Produccion Hostinger fue validada despues del deploy.
- No se tocaron `.env`, migraciones ni base de datos de produccion durante el deploy de artefactos.

## Verificacion de produccion

- `https://herenciard.vmsencf.com/api/health` responde:
  - `ok: true`
  - `storage: mysql`
  - `runtime: php`
- Rutas verificadas con `scripts/post-deploy-check.sh`:
  - `/sienna/arbol-genealogico -> 200`
  - `/sienna/explicacion-herederos -> 200`
  - `/sienna/miembros-arbol -> 200`
- Produccion esta arriba en:
  - `https://herenciard.vmsencf.com/sienna/arbol-genealogico`

## Cambios cerrados en esta ronda

- Se ajusto el flujo de fotos de miembros para que el frontend use las fotos resueltas por backend/API.
- Se elimino dependencia de fallbacks estaticos del frontend para miembros en el arbol.
- Se preservo la regla de autoridad: frontend presenta datos; backend/API decide informacion y media disponible.
- Se agrego tooling de Playwright para validaciones visuales/funcionales futuras.
- GitHub fue actualizado con los commits de la ronda antes del deploy.
- Hostinger fue actualizado con `dist/` sin tocar datos ni DB de produccion.

## Fotos y miembros trabajados

- Se trabajo la asignacion/validacion de fotos recientes indicadas por Victor para miembros del arbol.
- La fuente operativa debe seguir siendo backend/API y datos reales; evitar volver a introducir mapeos duros en frontend.
- En produccion, la lectura visual debe validarse desde las pantallas Sienna correspondientes despues de cualquier nueva carga de foto.

## Commits relevantes recientes

- `33e6cae Use backend member photos only`
- `e682c7c Prefer assigned photos before static fallbacks`
- `e2f4d9b Use local member photo assets in tree`
- `db369c4 Add Playwright test tooling`
- `6e7c5ea Show member photo lookup in Sienna tree`
- `1d9c96d Fix evidence document filename headers`
- `6f379bf Documenta cierre Sienna para reinicio`
- `21caa76 Registra fecha de fallecimiento de Domenico`

## Pendientes / riesgos

- Validar visualmente desde navegador la foto de cada miembro actualizado si Victor pide confirmacion puntual.
- Si una foto no aparece, revisar primero:
  - respuesta de `/api/sienna-family-members` con sesion autenticada;
  - datos del miembro/heir en backend;
  - cache del navegador/PWA;
  - existencia real del asset o photo_data asociado.
- No reintroducir logica de fotos en frontend salvo como presentacion pura de datos ya entregados por API.

## Regla operativa agregada por Victor

- Siempre que Victor diga `prepara para reiniciar`, crear o actualizar el handoff correspondiente en `docs/` antes de cerrar.
- Cuando haya cambios importantes, crear o actualizar el handoff correspondiente aunque Victor no use exactamente esa frase.
- El handoff debe incluir:
  - estado actual;
  - cambios cerrados;
  - commits relevantes;
  - verificacion local/produccion si aplica;
  - restricciones importantes;
  - pendientes y riesgos para retomar sin perdida de contexto.

## Reglas criticas para retomar

- Local primero salvo autorizacion expresa de Victor.
- No desplegar a Hostinger, produccion ni GitHub sin permiso explicito.
- No tocar DB, datos, fotos de produccion, documentos, `.env` ni migraciones sin permiso explicito.
- Mantener DRY: backend/API es la fuente de reglas, calculos, validaciones y media resuelta; frontend solo consume y presenta.
