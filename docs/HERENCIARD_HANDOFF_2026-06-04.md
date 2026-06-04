# HerenciaRD Handoff - 2026-06-04

## Estado actual

- Proyecto activo: HerenciaRD / Sienna, ruta local projects/herencia-familia-dominicana.
- Ultima instruccion de Victor antes del reinicio: Dejala como esta.
- Modo operativo vigente: trabajar en local primero. No desplegar a Hostinger, produccion ni GitHub sin autorizacion explicita nueva de Victor.
- Hay cambios locales sin commit y archivos nuevos. No revertirlos automaticamente.
- La regla permanente sigue vigente: backend/API es la unica fuente de informacion, calculo, validacion, clasificacion efectiva, hallazgos y media resuelta; frontend solo consume y presenta.

## Contexto de la conversacion reciente

- Victor pidio que la opcion Proporcional excluyendo compensados sea la opcion por default en el laboratorio.
- En el codigo local, el estado inicial de allocationMethod esta en proporcional_sin_compensados.
- Victor pregunto si la pagina ya estaba autorizada para usuarios; localmente se agrego la pagina al registro y se sincronizo acceso regular para /sienna/laboratorio-compensacion tanto en Node como en PHP.
- Produccion volvio a mostrar pantalla en blanco desde el icono de la pantalla de inicio; Victor aclaro que en Safari entraba bien.
- Luego Victor pidio trabajarlo en local primero y finalmente indico dejarlo como estaba.
- Nueva solicitud posterior 2026-06-04: antes de crear una pantalla nueva para documentos de no participacion/declinacion de herederos confirmados, verificar GitHub y documentacion, respaldar cambios recientes y no iniciar implementacion hasta dejar el proyecto claro.
- Plan tecnico/funcional de la nueva pantalla documentado en docs/HERENCIARD_DECLINACIONES_PLAN_2026-06-04.md.
- Implementacion local posterior: pantalla /sienna/declaraciones-no-participacion creada para los herederos calculados por la API sucesoral, no para miembros generales del arbol ni para la tabla manual de herederos.
- Validacion local posterior: 46 filas en /api/sienna-declaration-documents, coincidiendo con active_heirs de /api/sienna-calculation; build OK; ruta Vite 200; generacion QA probada y limpiada.
- Ajuste posterior solicitado por Victor: la tabla de declaraciones muestra monto y porcentaje calculados por API; los botones quedaron como Generar registro, Descargar PDF e Imprimir; Descargar PDF usa endpoint backend attachment para evitar que solo se abra en pantalla.
- Ajuste de relacion/calidad: backend entrega compact_relationship para celular, ejemplo "Vincenzo · Gen. 4", y compact_relationship_desktop para escritorio, ejemplo "Representacion Vincenzo · Gen. 4". La tabla muestra el formato segun breakpoint y mantiene el detalle completo en el title.
- Deploy Hostinger autorizado por Victor 2026-06-04: se subio codigo/frontend/PHP por FTP quirurgico, sin subir .env, sin migraciones y sin scripts SQL. Produccion valida /api/health OK, ruta /sienna/declaraciones-no-participacion 200 y assets principales 200.
- Restriccion de DB produccion: durante la primera ventana de subida se creo la tabla heir_declaration_documents, pero verificacion read-only confirmo 0 filas y 0 cedulas/pasaportes guardados. public/api.php remoto fue corregido para no crear automaticamente esa tabla y para mantener persistencia documental deshabilitada en produccion aunque la tabla exista. La pantalla puede listar/generar PDF en modo prueba sin guardar; guardar estados/documentos en produccion requiere autorizacion aparte.
- Autorizacion posterior de Victor 2026-06-04: activar almacenamiento documental porque la tabla ya existe. Se subio solo api.php con heir_declaration_document_persistence_enabled() en true. Verificacion remota: PHP responde con persistencia activa, no contiene CREATE TABLE de declaraciones, /api/health OK, ruta 200, tabla existe y sigue con 0 filas antes de pruebas de usuarios.
- Ajuste posterior 2026-06-04: en Administracion de Usuarios > Permisos de usuario, las paginas se agrupan visualmente en "Sienna / expediente Alessandro" y "Sistema general", con conteos seleccionados/total por grupo. Cambio frontend solamente, desplegado a Hostinger con assets e index.html; /api/health, /admin-users, AdminUsers asset, main bundle y CSS respondieron 200.
- Correccion posterior: el grupo se amplio a "Expediente Alessandro / Sienna" para incluir tambien rutas del expediente que no empiezan con /sienna: /dashboard, /arbol-genealogico, /arbol-genealogico-clasico, /lineas-familiares, /determinacion-herederos, /calculo-herencias, /hallazgos, /calculo-filiacion y /documentos-probatorios. Desplegado solo frontend; checks produccion OK.
- Correccion final del agrupado de permisos: Victor pidio dividir igual que el menu lateral. El dialogo de permisos ahora usa grupos equivalentes al sidebar: Navegacion principal, Caso, Legacy, Admin y Otros para rutas no contempladas. Incluye aliases historicos para mapear rutas antiguas a su bloque visual. Desplegado solo frontend; /api/health, /admin-users, AdminUsers asset, main bundle y CSS 200.
- Ajuste posterior: la tabla principal de usuarios y el filtro de usuarios de auditoria se ordenan alfabeticamente por nombre visible y luego email. Desplegado solo frontend; checks produccion OK.

## Cambios locales presentes

- Nueva pantalla local:
  - src/pages/LaboratorioCompensacionFamiliar.tsx
  - Ruta: /sienna/laboratorio-compensacion
  - Proposito: simulador experimental de reembolsos y compensaciones familiares sin modificar el reparto oficial.
- Navegacion local actualizada:
  - src/App.tsx
  - src/components/NavBar.tsx
  - src/components/NavigationMenu.tsx
  - src/components/MobileNavigationMenu.tsx
- Ayuda contextual agregada:
  - src/data/screenHelp.ts
- Registro/autorizacion de pagina agregado en:
  - server/index.js
  - public/api.php
- Dashboard local tiene cambios pendientes en src/pages/Dashboard.tsx.
- Handoff anterior docs/HERENCIARD_HANDOFF_2026-05-30.md ya contiene notas locales agregadas sobre:
  - postal Dia de las Madres;
  - ajuste gestion + honorarios;
  - regla de documentar antes de reiniciar.
- Archivo de documentacion de postal creado:
  - docs/HERENCIARD_DIA_MADRES_2026-05-31.md
- Archivo de plan para declaraciones/no participacion creado:
  - docs/HERENCIARD_DECLINACIONES_PLAN_2026-06-04.md
- Nueva pantalla local creada:
  - src/pages/DeclaracionesNoParticipacion.tsx
  - Ruta: /sienna/declaraciones-no-participacion
  - Proposito: generar y dar seguimiento a PDFs de no participacion/declinacion de gestion para herederos registrados sin incluir montos.
- Assets de postal guardados en:
  - docs/mockups/postal-dia-madres-sangiovanni-2026-05-31.jpg
  - docs/mockups/postal-dia-madres-sangiovanni-veo3-bg-2026-05-31.mp4

## Archivos modificados / nuevos al preparar reinicio

Estado observado con git status --short antes de este handoff:

- Modificados:
  - docs/HERENCIARD_HANDOFF_2026-05-30.md
  - public/api.php
  - server/index.js
  - src/App.tsx
  - src/components/MobileNavigationMenu.tsx
  - src/components/NavBar.tsx
  - src/components/NavigationMenu.tsx
  - src/data/screenHelp.ts
  - src/pages/Dashboard.tsx
- Nuevos:
  - docs/HERENCIARD_DIA_MADRES_2026-05-31.md
  - docs/mockups/postal-dia-madres-sangiovanni-2026-05-31.jpg
  - docs/mockups/postal-dia-madres-sangiovanni-veo3-bg-2026-05-31.mp4
  - src/pages/LaboratorioCompensacionFamiliar.tsx
  - docs/HERENCIARD_HANDOFF_2026-06-04.md

## Verificacion local

- Build local ejecutado despues de crear este handoff:
  - pnpm run build
  - Resultado: OK, Vite built in 13.45s.
- Si se retoma despues de reinicio, correr como minimo:
  - pnpm run build
  - validacion local autenticada de /sienna/laboratorio-compensacion
  - validacion de que /sienna/laboratorio-compensacion aparece solo para usuarios con acceso sincronizado.

## Riesgos / pendientes

- Produccion/PWA: el acceso desde el icono de pantalla de inicio reporto pantalla blanca, pero Safari normal entraba bien. No se debe tocar produccion hasta autorizacion explicita.
- Posible cache/service worker/PWA: si Victor decide corregirlo, revisar primero service worker, cache de assets Vite y manifest/start_url antes de cualquier deploy.
- Laboratorio: aunque el default tecnico esta en proporcional_sin_compensados, el texto de ayuda visible aun dice Recomendacion inicial: proporcional al monto heredado. Si se retoma la pantalla, conviene alinear ese copy con la preferencia de Victor.
- Laboratorio: no guarda escenarios, no modifica Settings y no debe convertirse en calculo oficial sin una decision explicita.
- Mantener local primero. No push, no GitHub, no Hostinger, no DB de produccion, no migraciones y no .env sin permiso directo.

## Para retomar rapido

1. Leer este archivo y luego docs/HERENCIARD_HANDOFF_2026-05-30.md.
2. Revisar git status --short.
3. Ejecutar pnpm run build.
4. Si Victor autoriza continuar localmente, validar el laboratorio en navegador con sesion autenticada.
5. Si Victor autoriza corregir PWA produccion, usar docs/PRODUCTION_WHITE_SCREEN_RUNBOOK.md antes de cualquier deploy.
