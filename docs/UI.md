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

## Miembros del árbol (tabla)

- Incluye columna de foto (si existe en herederos confirmados).
- Incluye columna con total de actas/documentos vinculados por miembro.
- Botón **Ver documentación** abre un visor interno (imagen, PDF o texto transcrito).

## Navegación móvil

- En menú móvil, la sección Sienna se muestra como lista directa dentro del mismo dropdown (sin submenú lateral).
- Objetivo: evitar recortes visuales y asegurar legibilidad completa de cada opción.

## Hallazgos

- La página `hallazgos` consume datos en tiempo real y no texto fijo.
- El usuario ve hallazgos actuales según el estado del expediente en la base de datos.
