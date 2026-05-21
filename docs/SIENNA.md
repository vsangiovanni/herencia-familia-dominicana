# Sección Sienna

Pantallas especializadas del expediente familiar (caso Alessandro y derivados).

## Rutas

| Ruta | Archivo | Propósito |
|------|---------|-----------|
| `/sienna/arbol-genealogico` | `ArbolGenealogicoSienna.tsx` | Árbol clásico, cálculo de montos, doble linaje, pantalla completa y resumen por heredero |
| `/sienna/miembros-arbol` | `MiembrosArbolSienna.tsx` | CRUD con línea parental, rama sucesoral, conexión al árbol y si hereda |
| `/sienna/explicacion-herederos` | `ExplicacionHerederosSienna.tsx` | Reunión: por qué heredo, simulador, semáforo, timeline, glosario, PDF |
| `/hallazgos` | `Hallazgos.tsx` | Hallazgos dinámicos de consistencia (sin texto hardcodeado) según data vigente |
| `/admin/settings` | `AdminSettings.tsx` | Editor guiado de settings globales y configuración del caso (solo admin) |

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
- Árbol: scroll horizontal en desktop; en móvil las ramas se apilan (`src/index.css`).
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
  - **Otro vínculo parental** (inferido por pareja `spouse`, incluso en referencia inversa).
- La foto del heredero puede mostrarse en la esquina superior derecha del nodo con borde redondeado para lectura rápida en reuniones.
- En nodos de cruce se muestra un bloque visual con **línea punteada transversal** para exposición.
- Además se genera la tarjeta **Cruces de ramas (doble linaje)** para resumen narrativo frente a familia/abogados.

## Modo exposición y pantalla completa

- `Modo exposición`: amplía distribución de contenido del módulo.
- `Pantalla completa`: activa Fullscreen API sobre la vista del árbol para presentaciones en monitor/TV.
- Ambos modos se pueden usar juntos.

## Librerías

- `src/lib/dominicanInheritance.ts` — plan sucesoral y clasificación.
- `src/lib/siennaGenealogy.ts` — uniones, vínculos parentales, hijos por filiación y descendientes para representación.
- `src/lib/siennaHeirExplain.ts` — semáforo, timeline, glosario, PDF, textos «por qué heredo».

## Herramientas para reunión

| Función | Ubicación |
|---------|-----------|
| Por qué heredo | Explicación → pestaña «Por qué heredo» |
| Simulador (excluir herederos) | Explicación → «Simulador» |
| Simulador al editar miembro | Miembros → bloque simulador |
| Semáforo documental | Explicación → «Semáforo» |
| Línea de tiempo | Explicación → «Línea de tiempo» |
| Resumen ejecutivo | Explicación (parte superior) |
| PDF por heredero | Botón en cada ficha |
| Resumen en árbol | Árbol → «Por qué heredan» |

## Hallazgos — corrección por miembro

- Pantalla `/hallazgos`: tabla **caso por caso** por miembro del árbol.
- Tipos: sincronizar vínculo de filiación, completar matrimonio del hijo, rama cortada.
- El cónyuge en texto (sin miembro en el árbol) es **referencia documental** — no genera pendiente ni nodo aparte.
- Corrección inline con selectores + Guardar (API `saveSiennaFamilyMember`).
- Lógica: `src/lib/siennaMemberIssues.ts`, UI: `MemberIssueFixPanel.tsx`.

## PDF de explicación (mosaico de soporte)

- En `siennaHeirExplain.ts`, el mosaico de documentos soporta:
  - imagen en `data:image/...`,
  - base64 crudo con detección de mime (`jpeg/png/gif/webp`),
  - fallback textual para PDF u otros formatos.
- El render usa normalización proporcional para evitar imágenes deformadas o invisibles.

## Pruebas manuales recomendadas

1. Abrir cada ruta en viewport 375px y 1920px.
2. Verificar scroll de pestañas y tabla sin solapamiento.
3. Árbol: zoom/scroll y nodos legibles en móvil.
4. Imprimir desde Explicación (`Imprimir reunión`).
