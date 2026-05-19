# Sección Sienna

Pantallas especializadas del expediente familiar (caso Alessandro y derivados).

## Rutas

| Ruta | Archivo | Propósito |
|------|---------|-----------|
| `/sienna/arbol-genealogico` | `ArbolGenealogicoSienna.tsx` | Árbol clásico, cálculo de montos, resumen por heredero |
| `/sienna/miembros-arbol` | `MiembrosArbolSienna.tsx` | CRUD con línea parental, rama sucesoral, conexión al árbol y si hereda |
| `/sienna/explicacion-herederos` | `ExplicacionHerederosSienna.tsx` | Reunión: por qué heredo, simulador, semáforo, timeline, glosario, PDF |

## Ayuda en pantalla

En las tres rutas Sienna hay un icono **?** (esquina superior derecha del encabezado) con guía de uso: montos del caudal, estado hereditario en miembros, pestañas de explicación, etc. Ver [docs/UI.md](UI.md).

## Layout responsivo

- Contenedor: `SiennaPageLayout` — ancho máximo 1600px, padding adaptativo.
- Árbol: scroll horizontal en desktop; en móvil las ramas se apilan (`src/index.css`).
- Pestañas de explicación: `.sienna-tabs-scroll` — scroll horizontal en móvil, grid en `md+`.
- Tabla de miembros: scroll horizontal; columna auditoría oculta en pantallas pequeñas.

## Librerías

- `src/lib/dominicanInheritance.ts` — plan sucesoral y clasificación.
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

## Pruebas manuales recomendadas

1. Abrir cada ruta en viewport 375px y 1920px.
2. Verificar scroll de pestañas y tabla sin solapamiento.
3. Árbol: zoom/scroll y nodos legibles en móvil.
4. Imprimir desde Explicación (`Imprimir reunión`).
