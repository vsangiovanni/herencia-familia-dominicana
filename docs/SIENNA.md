# Sección Sienna

Pantallas especializadas del expediente familiar (caso Alessandro y derivados).

## Videojuego El Legado Sangiovanni

Se abrio el canon de producto y arquitectura para una nueva seccion de juego narrativo cooperativo dentro de Sienna.

- Documento: LEGADO_SANGIOVANNI_GAME.md.
- Ruta local propuesta: /sienna/legado-game.
- Primer origen canonico: Santa Domenica Talao, Italia, incluyendo casa/puerta Sangiovanni y la salida de Domenico y Maria Rosa con Paolo y Vincenzo hacia Puerto Plata.
- La seccion debe ser aislada y protegida.
- Solo puede consumir datos del backend/API en modo lectura.
- Integra IA desde el inicio como narradora, guia de misiones, pistas y dialogos, siempre en modo read-only.
- Nunca modifica arbol, expediente, documentos, herederos, calculos, convergencias, hallazgos ni settings.
- El progreso del juego debe vivir separado del expediente real.

## Handoff operativo reciente

Para retomar el estado actual del asistente conversacional Sienna despues de un reinicio o una conversacion nueva, leer primero:

- [Handoff Sienna AI - 2026-05-24](SIENNA_AI_HANDOFF_2026-05-24.md)
- [Auditoria Sienna backend-only - 2026-05-25](SIENNA_BACKEND_AUTHORITY_AUDIT_2026-05-25.md)

Ese documento resume la arquitectura actual del asistente, los cambios hechos, pruebas realizadas, deploy a Hostinger, pendientes y breadcrumbs de archivos clave.

## Rutas

| Ruta | Archivo | Propósito |
|------|---------|-----------|
| `/sienna/arbol-genealogico` | `ArbolGenealogicoSienna.tsx` | Árbol clásico, cálculo de montos, doble linaje, pantalla completa y resumen por heredero |
| `/sienna/miembros-arbol` | `MiembrosArbolSienna.tsx` | CRUD con línea parental, rama sucesoral, conexión al árbol y si hereda |
| `/sienna/dobles-linajes` | `AnalisisDoblesLinajesSienna.tsx` | Auditoría visual de dobles linajes, rutas, convergencias e inconsistencias |
| `/sienna/explicacion-herederos` | `ExplicacionHerederosSienna.tsx` | Reunión: por qué heredo, semáforo, timeline, glosario, PDF |
| `/sienna/asistente` | `AsistenteIA.tsx` | Sienna contigo: orienta, explica y guía hacia pantallas sin modificar datos |
| `/hallazgos` | `Hallazgos.tsx` | Hallazgos dinámicos de consistencia (sin texto hardcodeado) según data vigente |
| `/admin/settings` | `AdminSettings.tsx` | Editor guiado de settings globales y configuración del caso (solo admin) |

## Regla canónica de datos Sienna

Las pantallas Sienna no son fuente de verdad. La fuente única para información, cálculo y validación es el API/backend sobre la base de datos real.

- El frontend solo consume y presenta respuestas del API.
- No duplicar en frontend lógica sucesoral, validación genealógica, hallazgos, convergencias, clasificación efectiva ni reglas de doble linaje.
- Si una regla aparece en Node y PHP, debe mantenerse como contrato equivalente de API hasta poder centralizarla más; no crear una tercera versión en React.
- Local primero. No desplegar a Hostinger, GitHub ni producción sin autorización explícita de Víctor para ese despliegue.

### Auditoria backend-only 2026-05-25

Se hizo una pasada local estricta sobre las pantallas Sienna para eliminar fallbacks y calculos de autoridad desde frontend.

- Dashboard ya no usa `confirmed_heirs.length` como fallback de herederos finales.
- Miembros del Arbol ya no clasifica automaticamente sucesion desde React al guardar.
- Explicacion para Herederos ya no tiene simulador local de exclusion/recalculo de cuotas.
- Calculo por Filiacion usa totales de `GET /api/sienna-calculation`.
- Dobles Linajes no inventa `source_amounts` si el backend no los devuelve.
- Arbol Genealogico no cae a montos guardados como sustituto de calculo vivo.
- Documentos Probatorios exige heredero vinculado a miembro para resolver/cargar soporte.

Documento completo: [Auditoria Sienna backend-only - 2026-05-25](SIENNA_BACKEND_AUTHORITY_AUDIT_2026-05-25.md).

Victor probo localmente y autorizo subir esta ronda a GitHub y Hostinger. El deploy se hizo solo con artefactos de `dist/` por FTP, sin subir `.env`, sin migraciones y sin tocar DB/datos de produccion.

Endpoints canónicos actuales:

| Endpoint | Uso |
|----------|-----|
| `GET /api/sienna-workspace` | Datos base de miembros, uniones, vínculos, herederos, documentos y settings |
| `GET /api/sienna-calculation` | Cálculo sucesoral vigente, cuotas, montos y estado efectivo |
| `GET /api/sienna-dual-lineage-analysis` | Casos de doble linaje, rutas, convergencias e inconsistencias |
| `GET /api/sienna-analysis-summary` | Resumen ejecutivo de métricas Sienna |
| `GET /api/sienna-findings` | Hallazgos accionables por miembro |
| `POST /api/sienna-ai-assistant` | Orientación IA read-only. No expone escritura ni permite modificar reparto, árbol o documentos |
| `GET /api/sienna-ai-curiosities` | Curiosidades del Dashboard generadas por backend/IA con contexto amplio del árbol; el usuario asociado pesa más, pero no limita la familia |
| `POST /api/evidence-documents/interpret-ai` | Interpretación asistida de documentos probatorios. Sugiere clasificación/campos contra catálogo backend, pero no guarda ni confirma herencia automáticamente |

## Estado del release 2026-05-22

- Backend Node y PHP exponen el resumen Sienna, hallazgos y estado sucesoral efectivo para que React no replique reglas de negocio.
- Ajuste local 2026-05-25: las curiosidades del Dashboard ya no se limitan a familiares cercanos; el backend entrega a la IA un índice amplio del árbol para buscar patrones difíciles de percibir.
- Ajuste local 2026-05-25: las tarjetas de curiosidades del Dashboard rotan con peso parejo real entre 18 transiciones visuales mediante cursor local. En pull refresh se fuerza confeti en la tarjeta principal; el efecto ahora envuelve la tarjeta completa, desaparece limpio al terminar y el efecto de escritura quita el cursor al finalizar.
- Auditoria IA 2026-05-25: las pantallas con IA son `/sienna/asistente` y el bloque de curiosidades del Dashboard. Ambas consumen endpoints backend; React no decide hechos sucesorales ni genealogicos.
- Ajuste local 2026-05-25: el chat de Sienna agrega un resolvedor backend de hechos familiares para preguntas tipo `madre/padre/hijos/hermanos/cónyuge de [persona]`, incluyendo nacimiento o defunción cuando el usuario lo pide. Tambien expone la fecha del miembro autenticado y resuelve diferencias de edad contra personas mencionadas desde el backend. La IA conversa, pero el backend resuelve y confirma el dato.
- Ajuste local 2026-05-25: Documentos Probatorios incorpora `Interpretar con Sienna`; la IA puede leer imagen/transcripción, sugerir tipo, fecha, lugar, texto leído y vínculos contra miembros del árbol, pero el usuario debe aplicar/revisar y el guardado sigue pasando por backend/can_edit.
- Refinamiento local 2026-05-25: al usar `Interpretar con Sienna` sobre imagen, el frontend ejecuta OCR primero, llena el formulario con esa base y luego manda OCR + imagen a IA para mejorar/completar sin pisar campos buenos.
- Ajuste local 2026-05-25: la portada `/sienna` deja de mostrar bloques de enlaces que ya pertenecen al menú principal. En su lugar presenta `Genialidades del árbol` con gráficos de abuelos, hermanos, primos por raíz común y generaciones, usando datos familiares recibidos del backend.
- Ajuste local 2026-05-25: las tarjetas de `Genialidades del árbol` se redistribuyen para ocupar mejor el alto disponible e incluyen mini métricas de grupos, personas conectadas y dato dominante.
- Ajuste local 2026-05-25: las transiciones entre pantallas usan un `fade in` sutil global, respetando `prefers-reduced-motion`.
- Ajuste local 2026-05-25: el pull refresh móvil en `/sienna` ya no recarga toda la página; invalida/refresca curiosidades IA, limpia la rotación local y baraja texto + transiciones para mostrar combinaciones nuevas siempre.
- `/sienna/miembros-arbol` carga el workspace liviano para totales/listas y las fotos por separado mediante herederos confirmados con media; esto evita bloquear las tarjetas superiores por archivos pesados.
- Las tablas/listas de miembros en Sienna se presentan en orden alfabetico cuando son tablas de consulta. El arbol conserva su orden logico propio para no romper la genealogia visual.
- `/sienna/dobles-linajes` usa los casos calculados por API y ordena la auditoria por nombre de miembro.
- `MemberDetailSheet` es la ficha canónica reutilizable para abrir detalle de miembro desde árbol, hallazgos, dobles linajes y miembros.
- El despliegue autorizado de este release subió frontend/backend solamente; no se ejecutaron migraciones, no se tocó la BD y no se sobrescribió `.env` remoto.

## Estado operativo actual 2026-05-23

Último estado documentado del aparato Sienna después de la ronda de ajustes visuales, PDF, conteos y enlaces accionables.

### Decisión de producto 2026-05-23 noche

- La experiencia principal no debe presentarse como “Dashboard Sienna” ni como una marca interna del sistema.
- El protagonista visible es **Alessandro de Paola Sangiovanni**.
- La ruta técnica `/sienna` se conserva por compatibilidad, pero la interfaz debe hablar de **Caso Alessandro**, **Árbol del caso**, **Legado Sangiovanni** y expediente familiar.
- “Sienna” queda como nombre interno de módulos/componentes/API, no como encabezado protagonista para usuarios finales.

### Hardening backend local 2026-05-23 noche

- Node local quedó alineado con PHP/producción para `can_edit`: perfiles, listado de usuarios, creación/edición de usuarios y perfil público.
- Node agregó guardia `requireEditor` para escrituras de herederos, miembros, documentos y snapshots; usuarios aprobados sin edición quedan en modo lectura.
- Guardar/eliminar miembros en Node ahora usa transacción para mantener consistentes miembro, filiación, uniones y referencias documentales/herederos.
- Node y PHP agregan cache corto de 20 segundos para endpoints Sienna pesados: workspace, cálculo, linajes, resumen y hallazgos; se invalida al modificar settings, miembros, herederos, documentos o snapshots.
- La app usa `next-themes` con `defaultTheme="system"` y storage propio `herenciard-theme`, por lo que el primer render sigue el tema claro/oscuro del dispositivo sin quedar amarrado al viejo default `light`; si el usuario elige manualmente un tema, se respeta esa elección.
- Se agregó Sienna contigo en modo local/read-only: usa `OPENAI_MODEL=gpt-5-nano` cuando `OPENAI_API_KEY` está configurado; si no, responde en modo fallback con orientación determinística del backend. No tiene endpoints de escritura ni modifica datos sensibles.

### Fuente de verdad y conteos

- El conteo principal de herederos finales debe venir del cálculo vivo del API: `/api/sienna-calculation.active_heir_count` o `active_heirs.length`.
- El Dashboard ya no usa `confirmed_heirs.length` como número principal de herederos porque esa tabla representa registros documentales/manuales, no el universo calculado.
- Estado esperado:
  - Dashboard: **Herederos finales** = cálculo vivo.
  - Explicación de herederos: **Herederos calculados** = cálculo vivo.
  - Árbol del caso: **Herederos finales** = cálculo vivo.
  - El conteo de `confirmed_heirs` puede mostrarse solo como detalle secundario/documental.

### Soporte documental accionable

Se agregó un patrón común para convertir estados pendientes de soporte en acciones directas.

- Helper central: `src/lib/siennaSupportLinks.ts`.
- URL canónica:
  - `/sienna/documentos?memberId=<id>&intent=heir-support`
  - `/sienna/documentos?memberId=<id>&intent=member-support`
- `heir-support` precarga en Documentos:
  - miembro titular,
  - heredero relacionado cuando existe,
  - tipo `Acta de nacimiento`,
  - checkbox `Esta acta confirma al heredero seleccionado`,
  - nota de contexto,
  - parentescos automáticos desde el árbol.
- `member-support` precarga el miembro titular y contexto documental sin asumir confirmación hereditaria.

Pantallas donde aplica:

| Pantalla | Comportamiento |
|----------|----------------|
| `/sienna/explicacion-herederos` | Badges **Falta soporte** y **En progreso** abren Documentos con el miembro precargado |
| `/sienna/filiacion` | Estado **sin confirmar** y **0 - cargar soporte** abren Documentos como soporte de heredero |
| `/sienna/miembros-arbol` | Badge **0 actas** abre Documentos con el miembro precargado; si hereda usa `heir-support`, si no `member-support` |

Regla UX: no todos los badges deben ser links. Solo se enlazan estados que tienen una acción clara para resolver el pendiente.

### PDF individual de herencia

- El PDF individual fue rediseñado como documento premium familiar/histórico.
- Incluye:
  - logo oficial,
  - foto del miembro,
  - monto heredado estimado,
  - estado de validación,
  - resumen ejecutivo,
  - explicación humana,
  - rutas genealógicas,
  - doble linaje cuando aplica,
  - tabla de vínculos,
  - hallazgos,
  - documentos relacionados,
  - mosaico de documentos,
  - timeline,
  - descargo y aceptacion con constancia de recepcion/firma,
  - pie de página del Legado Sangiovanni.
- La portada ya no imprime la línea superior derecha que causaba solapamiento.
- Ajuste local 2026-05-25: la portada identifica el documento como **Descargo y aceptación individual de herencia** y conserva la misma informacion de rutas, monto, soporte, hallazgos y validacion.
- Las secciones 5 a 8 comienzan en segunda página; documentos/timeline/validación/descargo continúan en páginas posteriores.
- Los PDF subidos como soporte se muestran como miniatura renderizada de la primera página cuando el navegador puede hacerlo; si no, usan fallback textual.
- Una sola acta de nacimiento vinculada directamente o un documento marcado como `confirms_heir` basta para considerar soporte documental verificado.

### Producción y datos

- Últimos despliegues autorizados: frontend/assets y, cuando correspondió, backend/API. El deploy FTP evita sobrescribir `.env` remoto.
- En la ronda posterior de frontend no se tocaron datos ni DB de producción.
- Hubo una intervención previa y explícitamente autorizada por Víctor para confirmar herederos con soporte documental existente; esa operación tuvo backup local antes de escribir.
- Regla vigente: salvo autorización explícita, los deploys no ejecutan migraciones ni scripts sobre producción.

### Commits relevantes recientes

| Commit | Cambio |
|--------|--------|
| `a176610` | Experiencia visual Sienna, dark/light, PDF premium, assets, documentación y deploy autorizado |
| `e7de4bd` | Dashboard alineado al conteo calculado de herederos finales |
| `7898bd6` | Soporte pendiente enlazado desde Explicación hacia Documentos con precarga |
| `cc38449` | Patrón de soporte extendido a Filiación y Miembros; helper común de links |

### Verificación reciente

- `pnpm exec vite build`: OK.
- `pnpm run test:sienna`: OK.
- Producción verificada por presencia de bundles nuevos con los textos/enlaces esperados.

## Limpieza UX/UI aplicada

- `/sienna/miembros-arbol`: la tabla principal queda como directorio compacto; columnas técnicas, notas largas y detalles de filiación se consultan bajo demanda en ficha/detalles.
- El bloque **Simulador antes de guardar** no se muestra con el formulario vacío; aparece colapsado solo al editar un miembro o al comenzar a escribir un nombre nuevo.
- `/sienna/arbol-genealogico`: criterio legal, estado del API y cruces de ramas se muestran de forma discreta/colapsable para que el canvas sea protagonista.
- `/sienna/explicacion-herederos`: las tarjetas de herederos resumen primero nombre, porcentaje, estado y monto; ruta genealógica/base legal quedan colapsadas.
- `/documentos-probatorios`: la presentación manual de herederos queda bajo demanda para priorizar carga, OCR, vínculo y registro documental.
- `/hallazgos`: la vista funciona como bandeja de corrección; la acción detallada de resolver se abre solo cuando hace falta.
- `/sienna/dobles-linajes`: el encabezado y KPIs se reducen para apoyar una lectura master-detail de los casos.
- `/sienna/calculo-filiacion`: rutas largas y nota jurídica quedan resumidas/colapsadas para reducir ruido visual.
- `/sienna/arbol-genealogico`: los montos visibles salen únicamente del cálculo activo del API; registros históricos de herederos confirmados ya no pueden hacer que una persona fallecida aparezca cobrando.

## Documentos probatorios (vinculación)

- Pantalla: `/documentos-probatorios`.
- Flujo operativo:
  1. Cargar archivo.
  2. Seleccionar tipo de documento.
  3. Seleccionar **miembro titular (árbol)** (obligatorio).
  4. Usar **Recalcular parentescos automáticos** para completar padre/madre/cónyuge según el árbol.
- Los campos de parentesco se guardan vinculados por `*_member_id` para evitar duplicidades por texto libre.
- En `Miembros del Árbol de Alessandro`, la tabla incluye foto del miembro, conteo de documentos y botón **Ver documentación** con visor (imagen/PDF/texto).

## Ayuda en pantalla

En las rutas Sienna hay iconos en la esquina superior derecha del encabezado:

| Icono | Componente | Uso |
|-------|------------|-----|
| **?** | `PageHelp` | Popover breve por pantalla (`src/data/screenHelp.ts`) |
| **Libro** | `MemberRegistrationGuide` | Guía visual + texto para crear/editar miembros (solo en Miembros del árbol) |

La **Guía de registro** (`src/components/sienna/MemberRegistrationGuide.tsx`) abre un panel lateral con:

- Flujo de captura (adultos → matrimonios → hijos → validar)
- Diagrama de las 3 capas con conectores (árbol, bloque azul, bloque dorado)
- Orden recomendado de quién entrar primero
- Ejemplo paso a paso (Víctor Manuel, hijo de María Rosa y Pedro Pablo)
- Ejemplo de hijo de otra relación y preguntas frecuentes
- Layout responsive: matrimonios apilados en móvil, pipeline vertical en pantallas pequeñas

Acceso: botón libro junto al **?** en el encabezado de la página y en la tarjeta «Agregar/Editar Miembro».

Ver también [docs/UI.md](UI.md).

## Layout responsivo

- Contenedor base: `app-shell` (en `src/index.css`) — ancho máximo 1700px y padding lateral optimizado para móvil y desktop.
- Contenedor Sienna: `SiennaPageLayout` usa `app-shell` para mantener consistencia visual entre módulos.
- Árbol: canvas completo (`tree-world`) con pan, zoom, pinch zoom, Fit, reset y pantalla completa. El zoom escala el árbol entero, no tarjetas aisladas.
- Impresión del árbol: botón **Imprimir árbol** genera vista A3 horizontal, ajusta el árbol completo y conserva fotos, montos, doble linaje e indicadores.
- Pestañas de explicación: `.sienna-tabs-scroll` — scroll horizontal en móvil, grid en `md+`.
- Tabla de miembros: scroll horizontal; columna auditoría oculta en pantallas pequeñas.

## Registro de miembros y filiación (flujo lógico)

Al guardar un miembro el sistema actualiza tres capas:

| Capa | Dónde se guarda | Para qué sirve |
|------|-----------------|----------------|
| Árbol visual | `parent_id` + `relationship_to_parent` | Dibujo del árbol (bajo quién cuelga el nodo) |
| Unión de pareja | `family_unions` (+ `spouse_member_id` en el miembro) | Matrimonio o pareja entre dos miembros |
| Filiación del hijo | `member_parent_links` (+ `filiation` al guardar) | De qué unión es hijo, o solo de un progenitor |

**Orden operativo recomendado**

1. Crear primero los progenitores adultos y enlazar cónyuges por ID (no solo nombre en texto).
2. Registrar hijos del matrimonio: superior = uno de los padres, unión = pareja, segundo progenitor = el otro.
3. Registrar hijos de otra relación: superior = ese progenitor, unión = *sin unión*, sin segundo progenitor incorrecto.

**Al guardar (API)** persiste `sienna_family_members`, sincroniza `member_parent_links` para hijos/hijas y crea/actualiza `family_unions` si hay cónyuge enlazado.

Ayuda en pantalla: icono **?** (`sienna-miembros`, `sienna-miembros-agregar`) e icono **libro** (Guía de registro interactiva) en `MiembrosArbolSienna.tsx`.

## Doble linaje y cruces

- El árbol detecta herederos con concurrencia de ramas (`Vincenzo/Vicente` y `Paolo/Paulino`) y los marca con badge **Doble linaje**.
- Cada nodo puede mostrar:
  - **Padre/Madre base** (desde `parent_id`)
  - **Otro vínculo parental** (inferido desde `member_parent_links` y `family_unions` cuando existe filiación formal).
- La foto del heredero puede mostrarse en la esquina superior derecha del nodo con borde redondeado para lectura rápida en reuniones.
- En nodos de cruce se muestra un bloque visual con **línea punteada transversal** para exposición.
- Además se genera la tarjeta **Cruces de ramas (doble linaje)** para resumen narrativo frente a familia/abogados.
- La página de explicación y el PDF individual separan las rutas por fuente para que el doble linaje no quede escondido en una sola línea.

## Indicador de fallecido

- Todo miembro con fecha de defunción (`death`) se marca visualmente como fallecido.
- En tarjetas del árbol y componentes reutilizables se muestra un lacito negro discreto en una esquina y etiqueta **Fallecido**.
- El indicador evita tapar la foto cuando existe imagen del heredero.
- El PDF individual de explicación también imprime **Fallecido** junto a la fecha de defunción.

## Modo exposición y pantalla completa

- `Modo exposición`: amplía distribución de contenido del módulo.
- `Pantalla completa`: activa Fullscreen API sobre la vista del árbol para presentaciones en monitor/TV.
- Ambos modos se pueden usar juntos.

## Librerías

- `src/lib/api.ts` y `src/hooks/useSiennaData.ts` — contrato de consumo del API.
- `src/lib/dominicanInheritance.ts` — lógica histórica de plan sucesoral; debe migrarse gradualmente fuera del frontend cuando una pantalla dependa de ella para decisiones.
- `src/lib/siennaGenealogy.ts` — helpers de UI sobre uniones/vínculos; no debe convertirse en fuente de validación de negocio.
- `src/lib/siennaHeirExplain.ts` — presentación, PDF, semáforo y textos; los insumos deben venir del API.
- `src/lib/siennaMemberInheritance.ts` — adaptador de UI para leer `effective_inheritance_status` y `effective_inheritance_reason` devueltos por el API.

## Herramientas para reunión

| Función | Ubicación |
|---------|-----------|
| Por qué heredo | Explicación → pestaña «Por qué heredo» |
| Simulador (excluir herederos) | Explicación → «Simulador» |
| Simulador al editar miembro | Miembros → bloque simulador colapsado; visible solo al editar o empezar un miembro nuevo |
| Semáforo documental | Explicación → «Semáforo» |
| Línea de tiempo | Explicación → «Línea de tiempo» |
| Resumen ejecutivo | Explicación (parte superior) |
| PDF por heredero | Botón en cada ficha |
| Resumen en árbol | Árbol → «Por qué heredan» |

## Honorarios de abogados (% firma)

- Configuración global: `app_settings.lawyer_fee_percentage` (Settings → admin).
- **Fórmula única** (`resolveEstateAmounts` en `siennaCalculation.ts`):
  - Firma = bruto × (% / 100)
  - Neto repartible = bruto − firma
- **Árbol del caso** y **Explicación a herederos** usan la misma función; los montos por heredero = neto × % sucesorio real.
- Al abrir cada pantalla se leen Settings y el cálculo vigente desde la API.
- Guardar montos en el árbol persiste los pagos calculados sobre los herederos confirmados; Explicación refresca la vista sin alterar Settings globales.

## Hallazgos — corrección por miembro

- Pantalla `/hallazgos`: tabla **caso por caso** por miembro del árbol.
- Tipos: sincronizar vínculo de filiación, completar matrimonio del hijo, rama cortada.
- El cónyuge en texto (sin miembro en el árbol) es **referencia documental** — no genera pendiente ni nodo aparte.
- Corrección inline con selectores + Guardar (API `saveSiennaFamilyMember`).
- Lógica canónica: `GET /api/sienna-findings` en Node/PHP.
- UI: `Hallazgos.tsx` + `MemberIssueFixPanel.tsx`.

## Deuda técnica detectada

Estas pantallas todavía tienen cálculo de negocio en frontend y deben migrarse por fases a endpoints:

| Pantalla | Cálculo frontend pendiente | Destino recomendado |
|----------|----------------------------|---------------------|
| Árbol Genealógico Sienna | plan sucesoral, montos, rutas y resumen ya vienen de `/api/sienna-calculation`; queda solo presentación visual | mantener sin lógica sucesoral nueva en React |
| Explicación a herederos | plan, montos, motivos y rutas ya vienen de `/api/sienna-calculation`; queda simulador de exclusiones en frontend | endpoint de briefs/simulación por heredero |
| Cálculo de Filiación | distribución por línea ya consume `/api/sienna-calculation` | mover análisis comparativo específico si se amplía la página |
| Miembros del árbol | plan actual, orden/contexto y métricas ya consumen cálculo API; queda preview de borrador y simulación antes/después | endpoint de preview de miembro/filiación |
| Documentos probatorios | sugerencia automática de familiares por árbol | mantener como asistencia visual, pero validación final en API |

## Verificación del release

Comandos mínimos antes de considerar lista una entrega Sienna:

```sh
php -l public/api.php
pnpm run lint
pnpm run build
pnpm run test:sienna
pnpm run check:prod   # solo después de deploy autorizado
```

Estado de la última validación local: PHP OK, build OK, pruebas Sienna OK, lint sin errores (quedan warnings no bloqueantes de Fast Refresh/hooks).

## PDF individual de herencia

- En `siennaHeirExplain.ts`, el PDF individual sigue el formato premium del **Legado Sangiovanni**:
  - encabezado/portada con logo, título `REPORTE INDIVIDUAL DE HERENCIA`, ficha del heredero, foto, estado, monto heredado estimado y validación;
  - página 1 con resumen ejecutivo, resumen hereditario y explicación simple;
  - página 2 con rutas genealógicas, análisis de doble linaje cuando aplica, tabla de vínculos y hallazgos;
  - páginas posteriores con documentos relacionados, mosaico visual, timeline, validación del sistema, observaciones y pie de página.
- El mosaico de documentos soporta:
  - imágenes de actas en `data:image/...`,
  - base64 crudo con detección de mime (`jpeg/png/gif/webp`),
  - primera página renderizada para documentos PDF mediante `pdfjs-dist`,
  - fallback textual para PDF u otros formatos cuando el navegador no puede renderizar el archivo.
- El render usa normalización proporcional para evitar imágenes deformadas o invisibles.
- Si el heredero tiene doble linaje, el PDF imprime las rutas separadas por fuente y porcentaje.
- Si el miembro está fallecido, el PDF imprime marcador de fallecido con fecha.
- La regla de soporte documental considera **verificado** al heredero cuando tiene al menos un documento marcado como `confirma heredero` o un acta/documento de nacimiento vinculado directamente.

## Pruebas manuales recomendadas

1. Abrir cada ruta en viewport 375px y 1920px.
2. Verificar scroll de pestañas y tabla sin solapamiento.
3. Árbol: zoom/scroll y nodos legibles en móvil.
4. Imprimir árbol completo desde Árbol del caso.
5. Imprimir desde Explicación (`Imprimir reunión`) y generar PDF individual de un heredero con soporte documental.
