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
npm install
node server/index.js
npm run dev
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
| `/sienna/explicacion-herederos` | Reunión con herederos: pestañas, PDF, semáforo, timeline |
| `/documentos-probatorios` | Evidencias vinculadas a miembros del árbol (titular + parentescos autoasistidos) |
| `/hallazgos` | Hallazgos dinámicos calculados con data actual (miembros, herederos y documentos) |
| `/admin/settings` | Configuración central del caso Sienna (solo administradores) |

Lógica compartida: `src/lib/dominicanInheritance.ts`, `src/lib/siennaGenealogy.ts`, `src/lib/siennaHeirExplain.ts`.

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
npm run migrate:genealogy          # local (.env)
npm run migrate:genealogy:prod     # producción (.env.prod.working)
```

## Marca y créditos

Ver [docs/BRANDING.md](docs/BRANDING.md). Favicon: `public/favicon.svg` (árbol y balanza en azul legal y oro).

## Despliegue

Guía completa: [docs/DEPLOY.md](docs/DEPLOY.md)

| Comando | Acción |
|---------|--------|
| `npm run build` | Genera `dist/` |
| `npm run deploy` | Sube `dist/` por FTP (no toca `.env` remoto) |
| `npm run deploy:api` | Solo `api.php` (cambios de backend) |
| `npm run check:prod` | Verifica health y rutas Sienna en producción |
| `npm run release` | Build + deploy + check (script bash) |
| `npm run migrate:genealogy` | Poblar uniones y vínculos parentales (local) |
| `npm run deploy:env` | Sube `.env.prod.working` al servidor (FTP) |
| `npm run deploy:zip` | Genera `herenciard_deploy_full.zip` para deploy MCP |

Plantilla de variables en servidor: [`.env.production.example`](.env.production.example)

Credenciales FTP: archivo local `Credenciales Hostinger.txt` en el escritorio (ver DEPLOY.md).

## Tecnologías

Vite, TypeScript, React, shadcn/ui, Tailwind CSS, MySQL.

## Licencia

© Víctor Sangiovanni. Todos los derechos reservados.
