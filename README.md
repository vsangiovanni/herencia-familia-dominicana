# HerenciaRD

Sistema genealógico y de determinación de herederos para la República Dominicana.

**Autor y titular:** [Víctor Sangiovanni](https://github.com/vsangiovanni)

**Producción:** https://herenciard.vmsencf.com

**Repositorio:** https://github.com/vsangiovanni/herencia-familia-dominicana

## Descripción

HerenciaRD documenta expedientes familiares, construye árboles genealógicos y calcula repartos sucesorios según criterios operativos de la legislación dominicana. La sección **Sienna** concentra las pantallas de reunión con herederos: explicación del reparto, semáforo documental, simulador y árbol clásico.

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
| Frontend | http://localhost:8080/ |
| API (Node) | http://127.0.0.1:3001/api/health |
| Árbol Sienna | http://localhost:8080/sienna/arbol-genealogico |
| Explicación herederos | http://localhost:8080/sienna/explicacion-herederos |
| Miembros del árbol | http://localhost:8080/sienna/miembros-arbol |

## Sección Sienna

Documentación: [docs/SIENNA.md](docs/SIENNA.md)

| Ruta | Uso |
|------|-----|
| `/sienna/arbol-genealogico` | Árbol clásico, montos y resumen «Por qué heredan» |
| `/sienna/miembros-arbol` | CRUD de miembros y simulador antes de guardar |
| `/sienna/explicacion-herederos` | Reunión con herederos: pestañas, PDF, semáforo, timeline |
| `/documentos-probatorios` | Evidencias y herederos confirmados |

Lógica compartida: `src/lib/dominicanInheritance.ts`, `src/lib/siennaHeirExplain.ts`.

## Backend

- **Local:** Node.js + Express (`server/index.js`) → MySQL.
- **Producción (Hostinger):** PHP `public/api.php` + `.htaccess` (copiados a `dist/` en el build).

Tablas principales: `confirmed_heirs`, `sienna_family_members`.

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

Plantilla de variables en servidor: [`.env.production.example`](.env.production.example)

Credenciales FTP: archivo local `Credenciales Hostinger.txt` en el escritorio (ver DEPLOY.md).

## Tecnologías

Vite, TypeScript, React, shadcn/ui, Tailwind CSS, MySQL.

## Licencia

© Víctor Sangiovanni. Todos los derechos reservados.
