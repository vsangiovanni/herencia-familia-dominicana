# HerenciaRD

Sistema genealógico y de determinación de herederos para la República Dominicana.

**Autor y titular:** [Víctor Sangiovanni](https://github.com/vsangiovanni)

**Producción:** https://herenciard.vmsencf.com

**Repositorio:** https://github.com/vsangiovanni/herencia-familia-dominicana

## Descripción

HerenciaRD documenta expedientes familiares, construye árboles genealógicos y calcula repartos sucesorios según criterios operativos de la legislación dominicana. La sección **Sienna** concentra las pantallas de reunión con herederos: explicación del reparto, semáforo documental, simulador y árbol clásico.

La ruta `/` redirige al panel (`/dashboard`) para uso operativo directo.

## Desarrollo local

Requisitos: Node.js 18+ y MySQL.

```sh
git clone https://github.com/vsangiovanni/herencia-familia-dominicana.git
cd herencia-familia-dominicana
cp .env.example .env
pnpm install
node server/index.js
pnpm run dev
```

| Servicio | URL |
|----------|-----|
| Frontend (redirige a dashboard) | http://localhost:8080/ |
| API (Node) | http://127.0.0.1:3001/api/health |
| Árbol Sienna | http://localhost:8080/sienna/arbol-genealogico |
| Explicación herederos | http://localhost:8080/sienna/explicacion-herederos |
| Miembros del árbol | http://localhost:8080/sienna/miembros-arbol |

## Sección Sienna

Documentación: [docs/SIENNA.md](docs/SIENNA.md)

| Ruta | Uso |
|------|-----|
| `/sienna/arbol-genealogico` | Árbol clásico, montos, doble linaje, pantalla completa y resumen «Por qué heredan» |
| `/sienna/miembros-arbol` | CRUD de miembros, uniones matrimoniales, filiación hijo/hija y simulador |
| `/sienna/dobles-linajes` | Auditoría visual de doble linaje, rutas, convergencias y validación |
| `/sienna/explicacion-herederos` | Reunión con herederos: pestañas, PDF, semáforo, timeline |
| `/documentos-probatorios` | Evidencias vinculadas a miembros del árbol (titular + parentescos autoasistidos) |
| `/hallazgos` | Hallazgos dinámicos calculados con data actual (miembros, herederos y documentos) |
| `/admin/settings` | Configuración central del caso Sienna (solo administradores) |

Regla canónica: el API/backend es la fuente única de información, cálculo y validación Sienna. El frontend presenta respuestas del API y no debe duplicar reglas sucesorales, genealógicas, hallazgos ni convergencias.

Lógica/presentación compartida: `src/lib/siennaGenealogy.ts`, `src/lib/siennaHeirExplain.ts`, `src/lib/siennaMemberInheritance.ts`.

Estado actual del flujo Sienna:

- El zoom del Árbol Sienna escala el canvas completo y permite pan, pinch zoom, Fit y reset.
- El botón **Imprimir árbol** genera una vista A3 horizontal con todo el árbol ajustado.
- Los miembros fallecidos se marcan con lacito negro discreto y etiqueta **Fallecido** en árbol, vistas reutilizables y PDF.
- La explicación para herederos usa cálculo en vivo, muestra doble linaje por ruta y genera PDF con mosaico de documentos soporte.
- Las imágenes de actas se normalizan antes de insertarse en PDF para evitar soportes invisibles.
- Las tablas de consulta de miembros se ordenan alfabéticamente; el árbol conserva su orden lógico visual.
- `/sienna/miembros-arbol` separa carga liviana de workspace y media para que totales/listas no dependan de fotos pesadas.

## Interfaz (ayuda y navegación)

Documentación: [docs/UI.md](docs/UI.md)

- **Ayuda (?):** popover no invasivo en cada pantalla; textos en `src/data/screenHelp.ts`.
- **Guía de registro (libro):** panel lateral en Miembros del árbol con diagramas, orden de captura y ejemplo Víctor Manuel (`MemberRegistrationGuide.tsx`).
- **Atrás:** visible solo fuera de inicio, login y panel; con historial vuelve atrás, si no va al dashboard.
- **Perfil:** vista renovada con tarjetas de identidad/seguridad y mejor jerarquía visual.
- **Navegación móvil:** la sección Sienna se muestra en lista directa para evitar submenús recortados.

## Backend

- **Local:** Node.js + Express (`server/index.js`) → MySQL.
- **Producción (Hostinger):** PHP `public/api.php` + `.htaccess` (copiados a `dist/` en el build).

Tablas principales: `confirmed_heirs`, `sienna_family_members`, `family_unions`, `member_parent_links`.

Migración inicial de filiación desde datos legacy:

```sh
pnpm run migrate:genealogy          # local (.env)
pnpm run migrate:genealogy:prod     # producción (.env.prod.working), solo con autorización de BD
```

## Marca y créditos

Ver [docs/BRANDING.md](docs/BRANDING.md). Favicon: `public/favicon.svg` (árbol y balanza en azul legal y oro).

## Despliegue

Guía completa: [docs/DEPLOY.md](docs/DEPLOY.md)

| Comando | Acción |
|---------|--------|
| `pnpm run build` | Genera `dist/` |
| `pnpm run deploy` | Sube `dist/` por FTP (no toca `.env` remoto) |
| `pnpm run deploy:api` | Solo `api.php` (cambios de backend) |
| `pnpm run check:prod` | Verifica health y rutas Sienna en producción |
| `pnpm run release` | Build + deploy + check (script bash) |
| `pnpm run migrate:genealogy` | Poblar uniones y vínculos parentales (local) |
| `pnpm run deploy:env` | Sube `.env.prod.working` al servidor (FTP) |
| `pnpm run deploy:zip` | Genera `herenciard_deploy_full.zip` para deploy MCP |

Plantilla de variables en servidor: [`.env.production.example`](.env.production.example)

Credenciales FTP: archivo local `Credenciales Hostinger.txt` en el escritorio (ver DEPLOY.md).

## Tecnologías

Vite, TypeScript, React, shadcn/ui, Tailwind CSS, MySQL.

## Licencia

© Víctor Sangiovanni. Todos los derechos reservados.
