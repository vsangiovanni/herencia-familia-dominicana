# Handoff Sienna AI - 2026-05-24

Este documento es el punto de entrada para retomar el trabajo de Sienna despues de reiniciar la PC o abrir una conversacion nueva.

## Estado actual

Proyecto: HerenciaRD / Legado Sangiovanni  
Ruta local: `/home/pc/.openclaw/workspace-sienna/projects/herencia-familia-dominicana`  
Produccion: `https://herenciard.vmsencf.com`  
Frontend local: `http://localhost:8080/`  
Backend local: `http://localhost:3001/api/health`

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

1. Eliminar duplicacion Node/PHP a futuro mediante contrato compartido o generacion, si el entorno lo permite.
2. Agregar tests automatizados especificos del asistente conversacional, no solo pruebas manuales con curl.
3. Exponer un endpoint admin-only de diagnostico de Sienna AI que no revele secretos, solo:
   - modelo configurado,
   - OpenAI configurado si/no,
   - modo ultimo request,
   - intencion detectada,
   - si uso contexto conversacional.
4. Mejorar soporte de repreguntas mas ambiguas:
   - "y el otro?"
   - "cuanto le toca a ella?"
   - "por que a Gina si y a mi no?"
5. Mantener prompts compactos: no enviar arbol entero, documentos completos ni listas gigantes.

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
