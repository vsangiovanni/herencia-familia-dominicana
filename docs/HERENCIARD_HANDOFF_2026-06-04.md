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
