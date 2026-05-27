# Handoff Sienna AI - 2026-05-24

Este documento es el punto de entrada para retomar el trabajo de Sienna despues de reiniciar la PC o abrir una conversacion nueva.

## Estado actual

Proyecto: HerenciaRD / Legado Sangiovanni  
Ruta local: `/home/pc/.openclaw/workspace-sienna/projects/herencia-familia-dominicana`  
Produccion: `https://herenciard.vmsencf.com`  
Frontend local: `http://localhost:8080/`  
Backend local: `http://localhost:3001/api/health`

Actualizacion posterior - 2026-05-27 07:55 AST:

- Produccion fue corregida por pantalla negra causada por chunks Vite obsoletos servidos como `text/html`.
- Fix desplegado en Hostinger: `.htaccess` devuelve 404 para `/assets/*` inexistentes, `sw.js` usa cache `legado-sangiovanni-v4` y `src/main.tsx` fuerza una recarga unica en `vite:preloadError`.
- Validacion post-deploy: `/api/health` OK MySQL/PHP, rutas Sienna principales en 200, JS principales con `application/x-javascript`, CSS con `text/css`, assets inexistentes bajo `/assets/*.js` en 404.
- Por urgencia se uso deploy quirurgico de archivos criticos porque el FTP completo se colgo subiendo media pesada del juego.
- Produccion DB fue actualizada solo con el miembro `maria-rosa-grisolia` (Maria Rosa Grisolia / Grisolia Divanna), su foto `maria-rosa-grisolia-portrait.webp` y el vinculo `Domenico.spouse_member_id = maria-rosa-grisolia`.
- No se tocaron otros miembros, calculos sucesorales ni migraciones. Backup previo local: `backups/prod_maria_rosa_grisolia_before_2026-05-27T11-54-40-029Z.json`.
- Ajuste posterior autorizado por Victor - 2026-05-27 08:31 AST: produccion ya tenia el asset estatico `/game/legado/archive/domenico-sangiovanni-portrait.webp`, pero faltaba la fila/foto de Domenico en `confirmed_heirs`. Se sincronizo solo `sienna_member_id = domenico` desde local hacia produccion, con backup previo `backups/prod_domenico_photo_before_2026-05-27T12-31-45.207Z.json`. No se tocaron otros miembros, calculos, migraciones ni deploy.

Actualizacion posterior - 2026-05-27 11:16 AST:

- Victor autorizo subir a Hostinger y GitHub esta ronda, con alcance limitado a codigo/frontend/PHP/assets/docs. No tocar DB, datos, migraciones, calculos ni `.env`.
- Canon narrativo contextual agregado sin modificar datos genealogicos: Domenico Sangiovanni Cino y Maria Rosa Grisolia Di Vanna llegan a Samana a fines del siglo XIX desde Santa Domenica Talao; Bonifacio puede mencionarse solo como contexto historico familiar, sin crear miembro; Maria Magdalena permanece en Santa Domenica como rama que cuida el origen.
- Enriquecimiento historico de la rama Domenico/Maria Rosa: Domenico como joyero ambulante hacia 1896 en Samana; Casa Hermanos Sangiovanni fundada en 1904 como casa comercial importante de importacion/exportacion; Paulino/Paolo asociado a la primera fabrica de hielo de Samana y al Cine Colon; Vicente/Vincenzo como parte del nucleo comercial familiar y esposo de Maria Balbina Perez Alvarez.
- Se corrigio el foco geografico: no usar Puerto Plata para esta rama; el nucleo verificable del relato es Samana / Santa Barbara de Samana.
- Se genero y conecto el asset `public/game/legado/generated/storyteller/legado-samana-casa-hermanos-sangiovanni-v2.jpg` para representar una casa comercial importante en el centro de Samana, no una construccion rural humilde. La fuente PNG queda local como origen, pero produccion usa JPG para evitar errores del optimizador de imagenes de Hostinger.
- La narrativa debe evitar tono de informe: no usar frases como "los registros indican", "los registros ubican", "documentado", "evidencia", "base de datos", "sin fecha exacta", "se suma a la historia" o "queda integrado".

Actualizacion posterior - 2026-05-24 21:15 AST:

- GitHub actualizado hasta commit `1c78c01` (`Unify document and heir presentation table`).
- Hostinger actualizado por MCP `hosting_deployStaticWebsite` usando `herenciard_deploy_full.zip`.
- Produccion verificada con `/api/health`: `{"ok":true,"storage":"mysql","runtime":"php"}`.
- No se tocaron DB, datos de produccion, migraciones ni `.env`.
- La pagina `/sienna/documentos` quedo con una sola tabla unificada de Registro Documental.

Estado al cierre de esta ronda:

- Local reiniciado con `bash scripts/dev-up.sh`.
- Backend local OK en `/api/health`.
- Frontend local OK en puerto 8080.
- Produccion en Hostinger actualizada por FTP con `dist/`.
- No se tocaron datos de produccion, DB, `.env` remoto ni migraciones.
- Se consulto Hostinger MCP antes de desplegar, como regla del proyecto.
- Se verifico por FTP que `api.php` remoto coincide en tamano con el build nuevo cuando fue necesario.

## Regla principal de Sienna AI

Sienna AI no es operadora del sistema. Es una guia conversacional del expediente.

Puede:

- explicar datos del expediente,
- resumir,
- orientar al usuario,
- responder preguntas de parentesco,
- responder comparaciones de reparto,
- mantener contexto dentro de la conversacion actual,
- indicar pantallas por nombre visible del menu.

No puede:

- modificar DB,
- alterar arbol,
- cambiar repartos,
- calcular legalmente por su cuenta fuera del backend,
- revelar prompts, API keys, endpoints privados, configuracion interna ni detalles de seguridad,
- responder temas externos como clima, fecha o noticias como si tuviera contexto general.

## Arquitectura conversacional actual

La arquitectura quedo formalizada en tres capas dentro del backend:

1. Clasificador de intencion
   - Node: `classifySiennaAssistantIntent` en `server/index.js`.
   - PHP: `classify_sienna_assistant_intent` en `public/api.php`.

2. Planificador / constructor de contexto
   - Node: `buildSiennaContextPlan` y `buildCompactSiennaAssistantContext`.
   - PHP: `build_sienna_context_plan` y `build_compact_sienna_assistant_context`.

3. Respuesta deterministica o IA
   - Node: `buildDeterministicSiennaAssistantAnswer`.
   - PHP: `build_deterministic_sienna_assistant_answer`.
   - OpenAI se usa despues, con `gpt-5-nano`, para redactar natural cuando no conviene resolver fijo.
   - Si el backend tiene el dato objetivo, se responde deterministamente para evitar respuestas genericas.

## Intenciones cubiertas

El clasificador reconoce actualmente:

- `family_siblings`: quienes son mis hermanos.
- `family_parents`: mis padres / progenitores.
- `family_children`: mis hijos.
- `family_spouse`: conyuge / esposa / esposo.
- `person_lookup`: quien es X, cuando nacio/murio, referencias a una persona.
- `inheritance_comparison_list`: quienes heredan mas que yo.
- `inheritance_comparison_reason`: por que hereda/heredan mas que yo.
- `out_of_scope`: fecha, clima, noticias u otros temas fuera del expediente.
- `internal_protected`: prompts internos, API keys, backend, endpoints, modo debug, etc.
- `general_guidance`: orientacion normal cuando no cae en una intencion objetiva.

## Contexto conversacional

El frontend `src/pages/AsistenteIA.tsx` manda el historial reciente mientras la conversacion sigue abierta.

Regla de producto definida por Victor:

- Mientras el usuario siga en la conversacion actual, Sienna debe mantener el contexto.
- Si el usuario refresca, cambia de pagina o inicia una nueva sesion de conversacion, se considera una conversacion nueva.
- Las repreguntas como "cuando nacio?", "por que?", "y ella?", "cuanto hereda?" usan el historial reciente para reconstruir contexto.

Funciones relevantes:

- Node:
  - `sanitizeSiennaConversationHistory`
  - `isSiennaConversationalFollowUp`
  - `buildSiennaContextSearchText`
  - `buildSiennaContextPlan`
- PHP:
  - `sanitize_sienna_conversation_history`
  - `is_sienna_conversational_follow_up`
  - `build_sienna_context_search_text`
  - `build_sienna_context_plan`

## Cambios hechos en esta ronda

### PWA / instalacion movil

- La app se convirtio en PWA con nombre de producto `Legado Sangiovanni`.
- `short_name`: `Sangiovanni`, para evitar que Android/iOS recorten a solo `Legado`.
- Se agregaron manifest, iconos, Apple touch icon, favicon y service worker.
- Regla importante: el service worker NO debe cachear API ni expediente offline. Solo assets estaticos seguros.
- Android/Chrome puede mostrar invitacion de instalacion usando `beforeinstallprompt`; si el usuario acepta, Chrome instala la app.
- iPhone/Safari no permite instalacion automatica ni disparar instalador nativo; se debe guiar con Compartir -> Agregar a pantalla de inicio.
- Se agrego pull-to-refresh movil para refrescar datos de forma natural desde la app instalada.

Commits relacionados:

- `e0ac36e` Add Legado Sangiovanni PWA support
- `f946eb8` Refine PWA name and Sangiovanni icon
- `0b55911` Add Android PWA install prompt
- `2642436` Add mobile pull to refresh

### Dashboard / curiosidades IA

- Victor detecto mensajes repetidos de curiosidades que parecian IA pero eran fallback.
- Se ajusto para no presentar fallback repetitivo como si fuera Nano.
- Las tarjetas de curiosidad ahora distinguen origen visual:
  - Verde: generado por Nano/OpenAI.
  - Azul: fallback/local.
- Ajuste local 2026-05-25: las curiosidades IA reciben un indice amplio del arbol y el prompt exige curiosidades dificiles de percibir, no limitadas a familiares cercanos. El usuario asociado pesa mas, pero no restringe el universo familiar.
- Auditoria IA 2026-05-25: las pantallas que consumen IA son `/sienna/asistente` y las curiosidades del Dashboard. Ambas usan backend/API; el frontend no decide hechos sucesorales ni genealogicos.

Commits relacionados:

- `66056ea` Avoid repeated fallback dashboard curiosities
- `f94d75d` Color dashboard curiosity cards by source

### Memoria conversacional local por usuario

- El historial local de Sienna en frontend se aislo por usuario para evitar que otro usuario vea contexto de Victor o mensajes en primera persona incorrectos.
- Esto corrige el caso donde al entrar con otro usuario aparecia un mensaje que decia Victor.
- La memoria sigue siendo local/frontend para continuidad de conversacion; no debe confundirse con datos del expediente ni guardarse como verdad del backend.

Commit relacionado:

- `fdcfed1` Isolate Sienna chat memory per user

### Fotos, verificacion y Registro Documental

- Se centralizo el componente `MemberPhoto` para aceptar estado de verificacion.
- Borde de fotos:
  - Verde sutil: miembro/heredero verificado.
  - Rojo sutil: pendiente/no verificado.
  - Neutral: sin estado conocido.
- Se agrego foto del miembro en Registro Documental.
- Se aplico el borde de verificacion en pantallas/tablas que usan `MemberPhoto`, incluyendo:
  - Documentos Probatorios,
  - Arbol Sienna,
  - Explicacion de herederos,
  - vistas relacionadas.
- El borde se suavizo luego de feedback de Victor: borde fino + ring suave, no borde grueso.

Commits relacionados:

- `f6b7025` Show verified status on member photos
- `465c2f4` Soften verified photo borders

### Performance de Documentos Probatorios

- Problema detectado: `DocumentosProbatorios` cargaba `useSiennaWorkspace(true)`, lo que hacia que el primer render pidiera media pesada/documentos completos en base64.
- Correccion:
  - La pagina ahora carga `useSiennaWorkspace(false)` para metadata ligera.
  - Las fotos de herederos se cargan por `useConfirmedHeirs(true)`.
  - El archivo completo del documento se pide bajo demanda solo cuando el usuario pulsa `Ver`.
- Esto reduce el tiempo inicial de carga de tablas.

Commit relacionado:

- `7acf1c9` Load documents page without full media

### Montos: fuente unica API/backend

- Victor detecto que al guardar foto decia `Foto y monto guardados`.
- Se encontro que la tabla `Presentacion de herederos` tenia monto editable manual y el update de foto reenviaba `inheritance_amount`.
- Correcciones:
  - Se elimino el input editable de monto en Documentos.
  - La UI muestra `Monto calculado` de solo lectura desde `useSiennaCalculation`.
  - Guardar foto ya no manda `inheritance_amount`.
  - Backend Node y PHP ahora conservan `inheritance_amount` cuando un PUT de heredero no trae ese campo.
  - El texto de toast ahora dice: `Foto guardada. El monto se mantiene calculado desde la API.`
- Regla vigente: los montos no deben guardarse desde la tabla de Documentos; deben venir del calculo/API. Mantener esta filosofia.

Commit relacionado:

- `a54bbad` Keep photo updates from saving heir amounts

### Unificacion de tablas en Documentos Probatorios

- Victor pidio eliminar duplicacion entre `Presentacion de herederos` y `Registro Documental`.
- Se elimino la tabla separada de Presentacion de herederos.
- `Registro Documental` ahora es una sola tabla que combina:
  - miembro/heredero,
  - foto editable,
  - borde verde/rojo por verificacion,
  - estado y lineas familiares,
  - documento,
  - fecha,
  - cantidad de actas,
  - monto calculado por API,
  - soporte,
  - acciones: guardar foto, ver documento, eliminar documento.
- Si un heredero no tiene documento vinculado, aparece en la misma tabla como `Sin documento vinculado` para poder completar la foto sin usar una segunda tabla.
- Se verifico en produccion que el bundle contiene:
  - `Miembro / heredero`,
  - `Monto calculado`,
  - `Guardar foto`,
  - `Sin documento vinculado`.

Commit relacionado:

- `1c78c01` Unify document and heir presentation table

### Modelo y prompting

- Modelo principal: `gpt-5-nano`.
- Prompt ajustado para:
  - respuestas breves, naturales y elegantes,
  - no revelar informacion interna,
  - usar solo contexto del backend,
  - no inventar parentescos, montos, documentos ni rutas,
  - indicar pantallas por nombre visible del menu, no rutas tecnicas.
- No usar `temperature` con `gpt-5-nano`, porque OpenAI lo rechazo en pruebas previas.

### Streaming / UX conversacional

- `AsistenteIA.tsx` usa streaming cuando esta disponible.
- Se agrego animacion tipo maquina de escribir en frontend para que aun si Hostinger/CDN entrega el bloque de golpe, el usuario vea letras aparecer progresivamente.
- El historial reciente se arma desde los mensajes visibles de la conversacion.

### Personalizacion por miembro

- Admin puede asociar un usuario a un miembro del arbol con `profiles.sienna_member_id`.
- Admin UI: `src/pages/AdminUsers.tsx`.
- Tipos/API: `src/lib/api.ts`.
- Backend:
  - `detectSiennaMemberForUser` / `detect_sienna_member_for_user`.
  - Primero respeta asociacion manual; luego puede intentar match por nombre/email.
- Personalizacion visual:
  - `src/hooks/useSiennaPersonalization.ts`
  - `src/components/DocumentHeader.tsx`
  - `src/pages/Dashboard.tsx`
  - `src/pages/AsistenteIA.tsx`

### Contexto familiar

El contexto de Sienna incluye ahora:

- padres,
- hermanos,
- hijos,
- conyuge,
- persona relevante por nombre,
- parentesco conversacional cuando se puede resolver,
- participacion hereditaria del usuario asociado,
- herederos que reciben mas que el usuario.

Ejemplos esperados:

- "quienes son mis hermanos" -> lista hermanos registrados.
- "quien es Onaney" -> Onaney figura como tu hermana.
- "cuando nacio?" despues de hablar de Onaney -> responde con fecha de Onaney.
- "quienes heredan mas que yo" -> lista personas, porcentaje y monto.
- "por que hereda mas que yo?" despues de la lista -> explica ruta familiar / acumulacion, no repite la lista.
- "que dia es hoy" -> responde que esta seccion solo tiene contexto del expediente.

### Sidebar

- `src/components/NavBar.tsx` ahora tiene scroll interno en desktop.
- El bloque inferior de perfil/cerrar sesion queda accesible.
- El ajuste fue subido a Hostinger.

### Produccion

- Dominio Hostinger confirmado por MCP:
  - `herenciard.vmsencf.com`
  - root remoto confirmado por MCP, sin documentar credenciales ni rutas internas aqui.
- Deploy real usado: FTP con `scripts/deploy-dist.py`.
- Cuando FTP estaba inestable, se uso subida directa de `dist/api.php`.
- No se uso `run-release.sh` para evitar cualquier riesgo de tocar env/DB.
- No se subio `.env`.
- No se ejecutaron migraciones.
- No se tocaron datos de produccion.

## Pruebas realizadas

Comandos base:

```sh
node --check server/index.js
php -l public/api.php
pnpm run build
pnpm run test:sienna
bash scripts/dev-up.sh
```

Pruebas conversacionales contra API local con usuario temporalmente asociado a `victor-manuel-martin`:

1. `quiénes heredan más que yo`
   - Esperado: modo deterministic, lista de personas con % y RD$.
2. `Porque hereda más que yo?` con historial de la pregunta anterior
   - Esperado: modo deterministic, explica por que heredan mas, no repite la lista.
3. `quienes son mis hermanos`
   - Esperado: Onaney Victoria Sangiovanni Rodriguez y Rosa Julia Sangiovanni Rodriguez.
4. `cuando nació?` con historial sobre Onaney
   - Esperado: mantiene contexto y responde fecha de Onaney.
5. `qué día es hoy`
   - Esperado: fuera de expediente, respuesta natural sin guiar a pantallas del caso.

Despues de las pruebas, se restauro la asociacion temporal local del admin:

```sql
UPDATE profiles
SET sienna_member_id = NULL, full_name = 'Administrador'
WHERE email = LOCAL_ADMIN_EMAIL;
```

## Archivos clave

Backend Node:

- `server/index.js`
  - asistente IA local,
  - clasificador de intencion,
  - constructor de contexto,
  - respuestas deterministicas,
  - streaming Node.

Backend PHP produccion:

- `public/api.php`
  - equivalente PHP para Hostinger,
  - debe mantenerse alineado con Node.
- `dist/api.php`
  - generado por build; es el archivo que se sube a Hostinger.

Frontend:

- `src/pages/AsistenteIA.tsx`
  - UI conversacional,
  - historial reciente,
  - streaming,
  - typewriter local,
  - humanizacion de rutas tecnicas.
- `src/pages/AdminUsers.tsx`
  - asociacion usuario -> miembro Sienna.
- `src/hooks/useSiennaPersonalization.ts`
  - personalizacion por miembro.
- `src/components/NavBar.tsx`
  - sidebar desktop con scroll interno.
- `src/pages/DocumentosProbatorios.tsx`
  - tabla unificada de Registro Documental,
  - carga ligera sin media completa al primer render,
  - fotos editables de herederos,
  - monto calculado solo desde API,
  - documentos completos bajo demanda al pulsar `Ver`.
- `src/components/sienna/MemberPhoto.tsx`
  - componente central para foto de miembro/heredero,
  - borde visual segun verificacion.
- `src/lib/memberPhotos.ts`
  - lookup de fotos,
  - resolucion de estado de verificacion desde herederos confirmados.

Docs:

- `docs/SIENNA.md`
- `docs/DEPLOY.md`
- `docs/SIENNA_AI_HANDOFF_2026-05-24.md` (este documento)

## Breadcrumbs para retomar

Leer en este orden:

1. `docs/SIENNA_AI_HANDOFF_2026-05-24.md`
2. `docs/SIENNA.md`
3. `docs/DEPLOY.md`
4. `server/index.js` buscar:
   - `classifySiennaAssistantIntent`
   - `buildSiennaContextPlan`
   - `buildCompactSiennaAssistantContext`
   - `buildDeterministicSiennaAssistantAnswer`
5. `public/api.php` buscar:
   - `classify_sienna_assistant_intent`
   - `build_sienna_context_plan`
   - `build_compact_sienna_assistant_context`
   - `build_deterministic_sienna_assistant_answer`
6. `src/pages/AsistenteIA.tsx`
7. `src/pages/AdminUsers.tsx`
8. `src/hooks/useSiennaPersonalization.ts`

## Pendientes / siguientes mejoras

1. Revisar visualmente en movil la tabla unificada de Documentos Probatorios despues del reinicio, especialmente ancho horizontal, inputs de foto y botones de accion.
2. Probar manualmente en produccion:
   - subir/cambiar foto desde la tabla unificada,
   - verificar que el toast diga solo foto guardada,
   - confirmar que el monto no cambia,
   - abrir documento con `Ver`,
   - revisar filas `Sin documento vinculado`.
3. Evaluar si conviene agregar filtros en Registro Documental:
   - con documento / sin documento,
   - verificados / pendientes,
   - linea Vincenzo / linea Paolo,
   - busqueda por nombre.
4. Eliminar duplicacion Node/PHP a futuro mediante contrato compartido o generacion, si el entorno lo permite.
5. Agregar tests automatizados especificos del asistente conversacional y de Documentos, no solo pruebas manuales con curl.
6. Exponer un endpoint admin-only de diagnostico de Sienna AI que no revele secretos, solo:
   - modelo configurado,
   - OpenAI configurado si/no,
   - modo ultimo request,
   - intencion detectada,
   - si uso contexto conversacional.
7. Mejorar soporte de repreguntas mas ambiguas:
   - "y el otro?"
   - "cuanto le toca a ella?"
   - "por que a Gina si y a mi no?"
8. Mantener prompts compactos: no enviar arbol entero, documentos completos ni listas gigantes.

## Reglas de deploy para la proxima conversacion

- Consultar Hostinger MCP antes de desplegar.
- Local primero.
- Correr:
  ```sh
  node --check server/index.js
  php -l public/api.php
  pnpm run build
  pnpm run test:sienna
  ```
- Si se cambia solo backend PHP:
  - asegurarse de regenerar `dist/api.php` con `pnpm run build`,
  - subir `dist/api.php`.
- No tocar DB ni datos de produccion salvo autorizacion explicita.
- No subir `.env`.
- No ejecutar migraciones salvo autorizacion explicita.

## Ultimos commits relevantes

```text
1c78c01 Unify document and heir presentation table
a54bbad Keep photo updates from saving heir amounts
7acf1c9 Load documents page without full media
465c2f4 Soften verified photo borders
f6b7025 Show verified status on member photos
2642436 Add mobile pull to refresh
f94d75d Color dashboard curiosity cards by source
0b55911 Add Android PWA install prompt
66056ea Avoid repeated fallback dashboard curiosities
fdcfed1 Isolate Sienna chat memory per user
f946eb8 Refine PWA name and Sangiovanni icon
e0ac36e Add Legado Sangiovanni PWA support
```

## Estado para reinicio

Antes de reiniciar la PC, estado conocido:

- GitHub esta actualizado.
- Hostinger esta actualizado.
- Produccion responde OK en `/api/health`.
- No hay una tarea de deploy pendiente.
- Pendiente real: QA visual/manual posterior al reinicio, principalmente Documentos Probatorios en movil y flujo de guardar foto desde tabla unificada.

## UI release posterior - tablas y documentos (2026-05-24 noche)

Cambios locales documentados y preparados para GitHub/Hostinger:

- `src/pages/DocumentosProbatorios.tsx`
  - Registro Documental paginado y ordenado alfabéticamente por miembro/heredero.
  - Selector de filas 10/25/50 y navegación estable con botones de flecha.
  - Guardado automático de foto al seleccionar archivo.
  - Eliminado el botón de disquete para foto.
  - Eliminada la columna de monto calculado.
  - Ampliadas columnas de miembro/heredero y soporte.
  - Estado muestra Verificado/Pendiente en vez de guion.
  - Botón eliminar solo visible para admin y con confirmación.
- `server/index.js`
  - `DELETE /api/evidence-documents/:id` ahora requiere `requireAdmin`, no solo editor.
- `src/components/TablePaginationControls.tsx`
  - Nuevo componente común de paginación con contador, filas 10/25/50 y flechas estables.
- Paginación aplicada a tablas largas:
  - `src/pages/MiembrosArbolSienna.tsx`
  - `src/pages/Hallazgos.tsx`
  - `src/pages/AdminUsers.tsx`
  - `src/components/PageVisitsStats.tsx`
  - `src/pages/CalculoFiliacion.tsx`
- `src/pages/ExplicacionHerederosSienna.tsx`
  - Tabla de explicación con mayor ancho para heredero y cadena de pago.
  - Cadena de pago renderizada con cápsulas e iconos en vez de `A -> B -> C`.

Validación ejecutada:

```sh
pnpm build
```

Restricciones del release:

- No tocar DB.
- No ejecutar migraciones.
- No subir ni sobrescribir `.env`.
- Deploy a Hostinger debe ser solo archivos generados de `dist/` vía script FTP seguro.
