# Interfaz y navegación

## Ayuda contextual por pantalla

Cada módulo incluye un botón **?** en la esquina superior derecha (junto al título o en la barra de la pantalla). Al pulsarlo se abre un popover con instrucciones de esa pantalla; no bloquea el contenido.

| Componente | Archivo |
|------------|---------|
| Textos por pantalla | `src/data/screenHelp.ts` |
| Botón y popover | `src/components/PageHelp.tsx` |
| Integración en títulos | `src/components/DocumentHeader.tsx` (`helpKey`) |

Para añadir ayuda en una pantalla nueva:

1. Definir la clave y secciones en `screenHelp.ts`.
2. Pasar `helpKey="mi-clave"` a `DocumentHeader`, o renderizar `<PageHelp helpKey="mi-clave" />` en páginas sin cabecera documental (dashboard, perfil, login, legal).

## Botón «Atrás»

El componente `BackButton` (`src/components/BackButton.tsx`) solo se muestra cuando aporta:

| Situación | Comportamiento |
|-----------|----------------|
| Rutas `/` (redirige), `/dashboard`, `/auth` | Oculto |
| Resto de módulos | Visible |
| Hay historial en la app | Vuelve a la página anterior (`navigate(-1)`) |
| Entrada directa por URL | Redirige a `/dashboard` |

No deja espacio vacío cuando está oculto (`return null`).

## Pantallas con ayuda (claves)

| Clave | Pantalla |
|-------|----------|
| `dashboard` | Panel de control |
| `auth` | Login |
| `perfil` | Mi perfil |
| `legal` | Información legal |
| `admin-users` | Administración |
| `arbol-genealogico` | Árbol genealógico |
| `arbol-genealogico-clasico` | Árbol clásico |
| `lineas-familiares` | Líneas familiares |
| `determinacion-herederos` | Determinación de herederos |
| `hallazgos` | Hallazgos |
| `calculo-herencias` | Cálculo de herencias |
| `calculo-filiacion` | Cálculo por filiación |
| `documentos-probatorios` | Documentos probatorios |
| `sienna-arbol` | Árbol Sienna |
| `sienna-miembros` | Miembros del árbol |
| `sienna-explicacion` | Explicación para herederos |
| `sienna-miembros-agregar` | Ayuda específica del formulario «Agregar miembro» |

## Perfil de usuario

- La vista de `perfil` usa `DocumentHeader` para consistencia de navegación y ayuda contextual.
- Se divide en dos tarjetas: **identidad** (avatar, nombre, email, rol) y **seguridad** (cambio de contraseña y cierre de sesión).
- Se optimizó jerarquía visual para lectura rápida en desktop y móvil.

## Documentos probatorios

- Se usa un único selector **Miembro titular (árbol)** para evitar duplicidad entre “titular” y “relacionado”.
- El botón **Recalcular parentescos automáticos** completa padre, madre y cónyuge desde el árbol actual.
- La ayuda contextual de `documentos-probatorios` refleja este flujo.
- Los PDF individuales de explicación muestran imágenes de actas cuando el documento es imagen o base64 compatible; PDF y otros formatos conservan resumen textual.
- El **Registro Documental** está paginado con controles estables de flechas, selector 10/25/50 y orden alfabético por miembro/heredero.
- La foto del heredero se guarda automáticamente al seleccionar una imagen en la tabla; no hay botón adicional de disquete.
- El botón de eliminar documentos solo se muestra a administradores, exige confirmación en frontend y el endpoint backend requiere rol `admin`.
- La tabla evita mostrar monto calculado; prioriza miembro/heredero, estado, documento, fecha, actas y soporte.

## Árbol Sienna

- El zoom del árbol se aplica al canvas completo (`tree-world`), no a cada tarjeta por separado.
- La vista permite pan con mouse/dedo, pinch zoom en móvil, ajuste automático **Fit**, reset al 100% y pantalla completa.
- El botón **Imprimir árbol** abre una salida A3 horizontal que ajusta el árbol completo al ancho imprimible.
- Los miembros con fecha de defunción muestran lacito negro y etiqueta **Fallecido** sin tapar la foto.
- El doble linaje se explica con badges, rutas separadas y conectores visuales de cruce.

## Miembros del árbol (tabla)

- Incluye columna de foto (si existe en herederos confirmados).
- Incluye columna con total de actas/documentos vinculados por miembro.
- Botón **Ver documentación** abre un visor interno (imagen, PDF o texto transcrito).
- La tabla principal está paginada con el patrón común: selector 10/25/50, contador y flechas.

## Navegación móvil

- En menú móvil, la sección Sienna se muestra como lista directa dentro del mismo dropdown (sin submenú lateral).
- Objetivo: evitar recortes visuales y asegurar legibilidad completa de cada opción.

## Hallazgos

- La página `hallazgos` consume datos en tiempo real y no texto fijo.
- El usuario ve hallazgos actuales según el estado del expediente en la base de datos.
- La tabla desktop y las tarjetas móviles comparten la misma paginación para mantener consistencia.

## Explicación para herederos

- Usa el mismo cálculo en vivo que el árbol para porcentajes, montos y neto después de honorarios.
- Muestra doble linaje desglosado por rama cuando un heredero participa por más de una fuente.
- El PDF individual funciona como descargo y aceptacion: mantiene ruta sucesoral, soporte documental, marcador de fallecido si aplica, monto estimado y agrega constancia de recepcion/firma.
- En la tabla de resumen, las columnas **Heredero** y **Cadena de pago** tienen mayor ancho para lectura cómoda.
- La **Cadena de pago** se presenta como una secuencia visual con cápsulas e iconos de origen, ramificación y heredero final, en vez de texto plano con separadores.

## Paginación común de tablas

- Componente reutilizable: `src/components/TablePaginationControls.tsx`.
- Patrón visual: contador de registros, selector de filas 10/25/50 y navegación estable `‹  X / Y  ›`.
- Se usa en tablas largas de:
  - Documentos Probatorios.
  - Miembros del Árbol.
  - Hallazgos.
  - Admin Users.
  - PageVisitsStats.
  - Cálculo por Filiación.
- No se pagina contenido pequeño o estático donde el control añade fricción sin beneficio.
