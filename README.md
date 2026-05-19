# HerenciaRD

Sistema especializado para documentar, explicar y calcular herencias familiares en la República Dominicana.

## Proyecto

**URL**: https://lovable.dev/projects/7f633c8a-c2f3-4efb-90df-5640b3e808da

**Producción**: https://herenciard.vmsencf.com

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/7f633c8a-c2f3-4efb-90df-5640b3e808da) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Sección Sienna

La sección Sienna contiene las pantallas de trabajo especializadas para el expediente familiar:

- `/sienna/arbol-genealogico`: árbol genealógico clásico, dinámico y enfocado en explicar quién hereda, por qué hereda y cuánto recibe.
- `/sienna/miembros-arbol`: CRUD administrativo para agregar, editar y clasificar miembros del árbol sin contaminar la pantalla de presentación.
- `/sienna/explicacion-herederos`: pantalla para reunión con herederos — vista «Por qué heredo», simulador visual, semáforo documental (verde/amarillo/rojo), línea de tiempo, glosario con ejemplos del caso, resumen ejecutivo del reparto y ficha PDF individual por heredero.
- `/documentos-probatorios`: carga y revisión de documentos, herederos confirmados, foto del heredero y monto heredado.

El árbol Sienna usa la información documentada del caso Alessandro para marcar herederos finales, enlaces genealógicos y ramas activas. El monto total de la herencia se puede calcular en pantalla y se refleja en los nodos del árbol; al guardar, queda persistido en los herederos confirmados.

### Cálculo sucesoral Sienna

Las páginas `/sienna/arbol-genealogico` y `/sienna/miembros-arbol` comparten el cálculo de `src/lib/dominicanInheritance.ts`.

- Aplica el criterio sucesoral dominicano de forma operativa: primero descendientes directos del causante; si no existen, ramas colaterales documentadas y representación por estirpes cuando un ascendiente de la rama figura fallecido.
- Para el expediente Alessandro, al no existir descendencia directa registrada, la distribución activa parte de las ramas Vincenzo/Vicente y Paolo/Paulino y recalcula porcentajes cuando se agregan nuevos descendientes en el árbol Sienna.
- El cálculo conserva la doble vocación sucesoral cuando una rama entra por el cónyuge documentado en el árbol, como ocurre con María Rosa Sangiovanni Pérez y Pedro Pablo Sangiovanni Simo.
- La pantalla de miembros clasifica al guardar; el árbol recalcula en vivo el porcentaje y el monto neto a distribuir después del porcentaje de la firma de abogados.

## Backend y datos

El desarrollo local usa Node.js + Express contra MySQL. Producción en Hostinger usa el backend PHP `public/api.php` y `public/.htaccess`, porque es el flujo estable para el hosting compartido.

Tablas relevantes:

- `confirmed_heirs`: herederos confirmados, líneas familiares, foto y monto heredado.
- `sienna_family_members`: miembros del árbol, parentesco, nodo superior, estado hereditario y razón explicativa.

## Desarrollo local

```sh
node server/index.js
./node_modules/.bin/vite --host 0.0.0.0 --port 8080
```

URLs locales:

- Frontend: http://localhost:8080/
- Backend health: http://127.0.0.1:3001/api/health
- Árbol Sienna: http://localhost:8080/sienna/arbol-genealogico
- CRUD miembros: http://localhost:8080/sienna/miembros-arbol
- Explicación herederos: http://localhost:8080/sienna/explicacion-herederos

### Herramientas para explicar a herederos (Sienna)

| Función | Dónde |
|--------|--------|
| Por qué heredo (ruta, %, monto, base legal simple) | `/sienna/explicacion-herederos` → pestaña «Por qué heredo» |
| Simulador (incluir/excluir herederos sin guardar) | `/sienna/explicacion-herederos` → «Simulador» |
| Simulador antes de guardar miembro en el árbol | `/sienna/miembros-arbol` |
| Semáforo documental y conflictos de fechas | `/sienna/explicacion-herederos` → «Semáforo» |
| Línea de tiempo (nacimiento, matrimonio, defunción, vínculos) | `/sienna/explicacion-herederos` → «Línea de tiempo» |
| Resumen ejecutivo (bruto, firma, neto, tabla de reparto) | `/sienna/explicacion-herederos` (parte superior) |
| Ficha PDF por heredero (foto, rama, documentos, cuota) | Botón «PDF individual» en cada ficha |
| Resumen en el árbol | `/sienna/arbol-genealogico` → bloque «Por qué heredan» |

Lógica compartida en `src/lib/siennaHeirExplain.ts` y cálculo sucesoral en `src/lib/dominicanInheritance.ts`.

## Tecnologías

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Despliegue

El flujo estable actual es:

1. Validar cambios localmente.
2. Ejecutar `./node_modules/.bin/vite build`.
3. Subir el contenido de `dist/` por FTP al subdominio de Hostinger.
4. Verificar `https://herenciard.vmsencf.com/api/health` y rutas críticas:
   - `/sienna/arbol-genealogico`
   - `/sienna/explicacion-herederos`
   - `/sienna/miembros-arbol`

No subir `.env`, `.deploy_hostinger/`, dumps ni credenciales. El build de Vite copia `public/api.php` y `public/.htaccess` dentro de `dist/`.

## Can I connect a custom domain to my Lovable project?

Yes it is!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
