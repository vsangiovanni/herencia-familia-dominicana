# Marca y créditos — HerenciaRD

## Identidad

| Elemento | Valor |
|----------|-------|
| Nombre | **HerenciaRD** |
| Tagline | Herencia familiar dominicana — árbol genealógico y determinación de herederos |
| Titular | Víctor Sangiovanni |
| Producción | https://herenciard.vmsencf.com |

## Colores (Tailwind)

Definidos en `tailwind.config.ts` y usados en la UI:

- `legal-blue` — fondos principales, footer
- `legal-gold` — acentos, créditos
- `legal-beige` — texto secundario sobre azul

## Favicon e imagen para compartir

| Archivo | Uso |
|---------|-----|
| `public/favicon.svg` | Icono vectorial en pestaña del navegador |
| `public/favicon-192.png` | Icono PNG |
| `public/apple-touch-icon.png` | iOS / acceso directo |
| `public/og-image.png` | Vista previa en WhatsApp, Facebook, Twitter (1200×630) |
| `public/favicon.ico` | Reemplaza icono legacy; se genera en `prebuild` |

Las meta etiquetas `og:image` y `twitter:image` usan URL **absoluta** a `https://herenciard.vmsencf.com/og-image.png` (WhatsApp no admite SVG ni rutas relativas).

Fuentes PNG en `assets/` (o ruta Cursor); `npm run prebuild` ejecuta `scripts/copy-brand-assets.sh`.

## Metadatos HTML

`index.html` incluye `author`, `creator` y `copyright` con Victor Sangiovanni, más Open Graph y Twitter cards.

## Footer

`src/components/Footer.tsx` muestra HerenciaRD, tagline y «Desarrollado por Víctor Sangiovanni» con año dinámico.

## Uso externo

© Víctor Sangiovanni. Todos los derechos reservados. No reutilizar marca ni assets sin autorización.
