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
2. Pasar `helpKey="mi-clave"` a `DocumentHeader`, o renderizar `<PageHelp helpKey="mi-clave" />` en páginas sin cabecera documental (dashboard, perfil, login, legal, inicio).

## Botón «Atrás»

El componente `BackButton` (`src/components/BackButton.tsx`) solo se muestra cuando aporta:

| Situación | Comportamiento |
|-----------|----------------|
| Rutas `/`, `/dashboard`, `/auth` | Oculto |
| Resto de módulos | Visible |
| Hay historial en la app | Vuelve a la página anterior (`navigate(-1)`) |
| Entrada directa por URL | Redirige a `/dashboard` |

No deja espacio vacío cuando está oculto (`return null`).

## Pantallas con ayuda (claves)

| Clave | Pantalla |
|-------|----------|
| `landing` | Inicio |
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
