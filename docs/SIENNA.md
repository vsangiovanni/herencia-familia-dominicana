# Sección Sienna

Pantallas especializadas del expediente familiar (caso Alessandro y derivados).

## Rutas

| Ruta | Archivo | Propósito |
|------|---------|-----------|
| `/sienna/arbol-genealogico` | `ArbolGenealogicoSienna.tsx` | Árbol clásico, cálculo de montos, doble linaje, pantalla completa y resumen por heredero |
| `/sienna/miembros-arbol` | `MiembrosArbolSienna.tsx` | CRUD con línea parental, rama sucesoral, conexión al árbol y si hereda |
| `/sienna/dobles-linajes` | `AnalisisDoblesLinajesSienna.tsx` | Auditoría visual de dobles linajes, rutas, convergencias e inconsistencias |
| `/sienna/explicacion-herederos` | `ExplicacionHerederosSienna.tsx` | Reunión: por qué heredo, simulador, semáforo, timeline, glosario, PDF |
| `/hallazgos` | `Hallazgos.tsx` | Hallazgos dinámicos de consistencia (sin texto hardcodeado) según data vigente |
| `/admin/settings` | `AdminSettings.tsx` | Editor guiado de settings globales y configuración del caso (solo admin) |

## Regla canónica de datos Sienna

Las pantallas Sienna no son fuente de verdad. La fuente única para información, cálculo y validación es el API/backend sobre la base de datos real.

- El frontend solo consume y presenta respuestas del API.
- No duplicar en frontend lógica sucesoral, validación genealógica, hallazgos, convergencias, clasificación efectiva ni reglas de doble linaje.
- Si una regla aparece en Node y PHP, debe mantenerse como contrato equivalente de API hasta poder centralizarla más; no crear una tercera versión en React.
- Local primero. No desplegar a Hostinger, GitHub ni producción sin autorización explícita de Víctor para ese despliegue.

Endpoints canónicos actuales:

| Endpoint | Uso |
|----------|-----|
| `GET /api/sienna-workspace` | Datos base de miembros, uniones, vínculos, herederos, documentos y settings |
| `GET /api/sienna-calculation` | Cálculo sucesoral vigente, cuotas, montos y estado efectivo |
| `GET /api/sienna-dual-lineage-analysis` | Casos de doble linaje, rutas, convergencias e inconsistencias |
| `GET /api/sienna-analysis-summary` | Resumen ejecutivo de métricas Sienna |
| `GET /api/sienna-findings` | Hallazgos accionables por miembro |

## Estado del release 2026-05-22

- Backend Node y PHP exponen el resumen Sienna, hallazgos y estado sucesoral efectivo para que React no replique reglas de negocio.
- `/sienna/miembros-arbol` carga el workspace liviano para totales/listas y las fotos por separado mediante herederos confirmados con media; esto evita bloquear las tarjetas superiores por archivos pesados.
- Las tablas/listas de miembros en Sienna se presentan en orden alfabetico cuando son tablas de consulta. El arbol conserva su orden logico propio para no romper la genealogia visual.
- `/sienna/dobles-linajes` usa los casos calculados por API y ordena la auditoria por nombre de miembro.
- `MemberDetailSheet` es la ficha canónica reutilizable para abrir detalle de miembro desde árbol, hallazgos, dobles linajes y miembros.
- El despliegue autorizado de este release subió frontend/backend solamente; no se ejecutaron migraciones, no se tocó la BD y no se sobrescribió `.env` remoto.

## Limpieza UX/UI aplicada

- `/sienna/miembros-arbol`: la tabla principal queda como directorio compacto; columnas técnicas, notas largas y detalles de filiación se consultan bajo demanda en ficha/detalles.
- El bloque **Simulador antes de guardar** no se muestra con el formulario vacío; aparece colapsado solo al editar un miembro o al comenzar a escribir un nombre nuevo.
- `/sienna/arbol-genealogico`: criterio legal, estado del API y cruces de ramas se muestran de forma discreta/colapsable para que el canvas sea protagonista.
- `/sienna/explicacion-herederos`: las tarjetas de herederos resumen primero nombre, porcentaje, estado y monto; ruta genealógica/base legal quedan colapsadas.
- `/documentos-probatorios`: la presentación manual de herederos queda bajo demanda para priorizar carga, OCR, vínculo y registro documental.
- `/hallazgos`: la vista funciona como bandeja de corrección; la acción detallada de resolver se abre solo cuando hace falta.
- `/sienna/dobles-linajes`: el encabezado y KPIs se reducen para apoyar una lectura master-detail de los casos.
- `/sienna/calculo-filiacion`: rutas largas y nota jurídica quedan resumidas/colapsadas para reducir ruido visual.

## Documentos probatorios (vinculación)

- Pantalla: `/documentos-probatorios`.
- Flujo operativo:
  1. Cargar archivo.
  2. Seleccionar tipo de documento.
  3. Seleccionar **miembro titular (árbol)** (obligatorio).
  4. Usar **Recalcular parentescos automáticos** para completar padre/madre/cónyuge según el árbol.
- Los campos de parentesco se guardan vinculados por `*_member_id` para evitar duplicidades por texto libre.
- En `Miembros del Árbol Sienna`, la tabla incluye foto del miembro, conteo de documentos y botón **Ver documentación** con visor (imagen/PDF/texto).

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
- **Árbol Sienna** y **Explicación a herederos** usan la misma función; los montos por heredero = neto × % sucesorio real.
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

## PDF de explicación (mosaico de soporte)

- En `siennaHeirExplain.ts`, el mosaico de documentos soporta:
  - imagen en `data:image/...`,
  - base64 crudo con detección de mime (`jpeg/png/gif/webp`),
  - fallback textual para PDF u otros formatos.
- El render usa normalización proporcional para evitar imágenes deformadas o invisibles.
- Si el heredero tiene doble linaje, el PDF imprime las rutas separadas por fuente y porcentaje.
- Si el miembro está fallecido, el PDF imprime marcador de fallecido con fecha.

## Pruebas manuales recomendadas

1. Abrir cada ruta en viewport 375px y 1920px.
2. Verificar scroll de pestañas y tabla sin solapamiento.
3. Árbol: zoom/scroll y nodos legibles en móvil.
4. Imprimir árbol completo desde Árbol Sienna.
5. Imprimir desde Explicación (`Imprimir reunión`) y generar PDF individual de un heredero con soporte documental.
