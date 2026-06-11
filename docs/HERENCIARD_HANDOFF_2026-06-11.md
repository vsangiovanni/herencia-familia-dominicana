# HerenciaRD Handoff - 2026-06-11

## Resumen de la sesion

Sesion de correccion de un bug de produccion y limpieza UX de dos tablas Sienna, con
reorganizacion del bloque "Resumen ejecutivo para reunion". Trabajo en local primero,
validado en navegador real (Playwright, sesion admin, 46 herederos), y desplegado a
Hostinger con autorizacion explicita de Victor.

## Bug corregido: "Descargar PDF" -> "Ruta no encontrada"

- Sintoma: en `/sienna/declaraciones-no-participacion`, el boton Descargar PDF de la tabla
  fallaba en produccion con el toast "No se pudo descargar / Ruta no encontrada".
- Causa raiz: el frontend genera el PDF en el navegador (jsPDF) y luego lo envia a
  `POST /api/sienna-tree-pdf-downloads` para forzar la descarga como archivo. Ese endpoint
  existia **solo** en el backend Node local (`server/index.js`, guarda el PDF en memoria con
  token temporal), pero **no** en el backend PHP de produccion (`public/api.php`). La peticion
  caia en el 404 generico de api.php (`{"message":"Ruta no encontrada"}`).
- Alcance: el mismo endpoint lo usa tambien el PDF descargable del Arbol Genealogico Sienna
  (`src/pages/ArbolGenealogicoSienna.tsx`), que estaba fallando igual en produccion.

### Arreglo (backend PHP)

`public/api.php`:
- Helpers nuevos: `safe_download_file_name()`, `temporary_pdf_download_dir()`,
  `cleanup_temporary_pdf_downloads()`.
- `POST /api/sienna-tree-pdf-downloads` (requiere sesion): valida el base64 como PDF real
  (`%PDF-`), lo guarda como archivo temporal en `sys_get_temp_dir()/herenciard_pdf_downloads`
  con id + token UUID y devuelve la URL de descarga. TTL 10 min, limpieza automatica en cada uso.
- `GET /api/sienna-tree-pdf-downloads/{id}/{token}/{archivo}`: sirve el PDF con
  `Content-Disposition: attachment`. id/token validados con formato UUID estricto (sin path traversal).
- No toca la base de datos. Espejo funcional del comportamiento en Node.

Validacion local: `php -l public/api.php` OK; pruebas con servidor PHP embebido contra MySQL
local: login admin -> subir PDF -> descargar = 200 con headers de attachment y bytes identicos;
token invalido -> 404; sin sesion -> 401; base64 no-PDF -> 400.

## Limpieza UX: tablas con encabezado fijo

Problema: tablas anchas (la de No Participacion tiene 10 columnas ~1900px) obligaban a bajar
hasta el final de las 46 filas para alcanzar la barra de scroll horizontal.

Arreglo (mismo patron en ambas):
- Contenedor de la tabla con altura acotada (`max-h-[70vh] overflow-auto`): las filas se
  desplazan dentro del cuadro y la barra horizontal queda a su pie, sin recorrer toda la lista.
- Encabezado `sticky top-0` con fondo opaco `bg-card` (token de tema, se adapta a claro/oscuro;
  evita que las filas se transparenten por debajo al hacer scroll).

Archivos:
- `src/components/ui/table.tsx`: prop opcional `containerClassName` para controlar el contenedor
  de scroll del componente shadcn (retrocompatible).
- `src/pages/DeclaracionesNoParticipacion.tsx`: tabla en contenedor `max-h-[70vh]` + header sticky `bg-card`.
- `src/pages/ExplicacionHerederosSienna.tsx`: misma tabla de herederos con `max-h-[70vh]` + header sticky `bg-card`.

Nota de modo oscuro: el primer intento uso un color fijo (`#f4f5f7`) que se quedaba claro en
modo oscuro (banda clara sobre tabla oscura). Corregido a `bg-card`, que iguala la superficie
de la tabla en ambos temas. Verificado claro/oscuro con screenshots.

Arreglo movil (contenido flotando): en celular las filas de No Participacion quedaban altas por
los controles de formulario (input Cedula, Estado con badge+select, Textarea Notas min-h-72) y
el contenido corto (nombre/contacto) flotaba centrado por `align-middle`. Corregido alineando
las celdas del cuerpo arriba: `[&_td]:align-top` en el `TableBody` de No Participacion y en el
`tbody` de la tabla de Explicacion (esta ultima por consistencia: filas con cadena de pago larga
podrian flotar igual). Verificado en viewport iPhone 12.

## Reorganizacion: "Resumen ejecutivo para reunion"

`src/pages/ExplicacionHerederosSienna.tsx`. Antes: criterio legal + 3 inputs + panel resultado +
boton, todo apretado en una fila de 5 columnas con alineacion despareja; el desglose era una
frase corrida.

Ahora: tres zonas claras.
1. Criterio sucesoral en su propio recuadro de contexto (`bg-legal-blue/5`).
2. "Parametros del calculo" (izquierda): Monto bruto arriba (ancho completo), % gestion y % firma
   lado a lado con sus notas; boton "Actualizar esta vista" + fecha de calculo al pie.
3. "Neto a repartir" (derecha): panel destacado (`bg-legal-gold/5`) con el monto grande y el
   desglose como lista alineada (Gestion / Base abogados / Firma de abogados).
   Grid `lg:grid-cols-[minmax(0,1fr)_340px]`; en pantallas chicas se apila.

Tambien se quitaron colores fijos que se rompian en oscuro: `text-gray-700` -> `text-legal-dark`,
`bg-white` -> tokens de tema. Verificado claro/oscuro.

## Verificacion local

- `pnpm run build` OK.
- `php -l public/api.php` OK.
- Navegador real (Playwright, viewport 1280): header sticky confirmado (`position: sticky`,
  se mantiene al tope del contenedor al hacer scroll), barra horizontal alcanzable sin recorrer
  filas, columnas de la derecha visibles, sin errores de consola relevantes (solo el 401 normal
  del chequeo de sesion previo al login).

## Deploy a produccion (Hostinger)

Deploy quirurgico (solo lo cambiado; dist/ pesa 180M por media del juego que ya esta en el
servidor sin cambios, no se re-sube). Flujo:
- `pnpm run build`
- Subir solo `dist/assets/*` + `dist/index.html` (index.html al final).
- `pnpm run deploy:api` (api.php).
- `pnpm run check:prod`.

Sin migraciones, sin tocar BD de produccion, sin subir `.env`.

Estado 2026-06-11 (DEPLOY COMPLETADO, autorizado por Victor):
- Frontend (66 assets + index.html) desplegado: tablas con header fijo, Resumen ejecutivo
  reorganizado y arreglo movil `align-top` ya en produccion.
- api.php desplegado: rutas de descarga de PDF ahora existen en produccion.
- Verificacion produccion:
  - `/api/health` -> 200 (mysql/php OK).
  - Rutas Sienna (`/sienna/arbol-genealogico`, `/sienna/explicacion-herederos`,
    `/sienna/miembros-arbol`) -> 200.
  - `POST /api/sienna-tree-pdf-downloads` sin sesion -> 401 "No autenticado" (la ruta EXISTE;
    antes devolvia 404 "Ruta no encontrada"). Con sesion real en el navegador, Descargar PDF
    funciona (flujo autenticado verificado en local).
- No se toco `.env`, ni BD, ni migraciones.

Deploy quirurgico usado (dist/ pesa 180M por media del juego que NO cambio):
- `pnpm run deploy:fast` (`scripts/deploy-dist-fast.py`): sube todo `dist/` EXCEPTO `dist/game/`
  (~175M de media inmutable del Legado), index.html al final, sin tocar `.env`. Evita que el FTP
  se cuelgue. Usar cuando el release no cambia assets del juego; si cambian, usar `pnpm run deploy`.
- Backend api.php: `pnpm run deploy:api`.

## Para retomar

1. Leer este archivo y docs/HERENCIARD_HANDOFF_2026-06-04.md.
2. `git status --short`.
3. Pendientes anteriores aun vigentes: PWA produccion (pantalla blanca desde icono de inicio,
   ver docs/PRODUCTION_WHITE_SCREEN_RUNBOOK.md) y el copy de ayuda del Laboratorio.
