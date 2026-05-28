# Production White Screen Runbook

## Problem

The app can show a flash followed by a blank screen after login or route changes when the browser loads a frontend bundle that references chunks not available on Hostinger yet, or when an old service worker/cache keeps serving stale Vite assets.

This is most visible after Vite builds because generated filenames are hash based:

- `/assets/index-*.js`
- lazy route chunks such as `/assets/Auth-*.js`, `/assets/Dashboard-*.js`, `/assets/LegadoSangiovanniGame-*.js`
- `/assets/index-*.css`

If `index.html` points to new hashes but one referenced chunk is missing or served as HTML, the browser fails dynamic import and the app can go blank.

## Permanent Rules

1. Never upload `index.html` before the new `dist/assets/*` files are uploaded.
2. Never delete old `dist/assets/*` hashes during the same deploy. Old browser tabs may still need them.
3. Always deploy static assets first, then `.htaccess`, `api.php`, manifest/SEO files, and `index.html` last.
4. Production must return 404 for missing `/assets/*` files. It must never rewrite missing JS/CSS assets to `index.html`.
5. `index.html`, `sw.js`, and `manifest.webmanifest` must be served with no-cache/no-store headers.
6. The frontend must unregister legacy service workers and clear browser caches on load.
7. The frontend must handle Vite preload/dynamic import failures by clearing service worker/cache state and reloading once with a cache-busting query.

## Current Safeguards

- `public/.htaccess` blocks SPA fallback for missing `/assets/*`:

  ```apache
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteRule ^assets/ - [R=404,L]
  ```

- `public/.htaccess` disables caching for `index.html`, `sw.js`, and `manifest.webmanifest`.
- `src/lib/registerServiceWorker.ts` unregisters existing service workers and clears browser caches.
- `src/main.tsx` listens for Vite preload errors, dynamic import failures, and chunk loading errors, then reloads with `?reload=<timestamp>`.

## Safe Deploy Checklist

Run locally:

```bash
pnpm exec vite build
php -l public/api.php
node --check server/index.js
git diff --check
```

Deploy order:

1. Upload all files under `dist/assets/`.
2. Upload other static files under `dist/`, except `index.html`.
3. Upload `.htaccess` and `api.php`.
4. Upload `index.html` last.

Verify production:

```bash
curl -sS https://herenciard.vmsencf.com/ | rg 'assets/index|modulepreload|stylesheet'

for p in \
  assets/index-<hash>.js \
  assets/index-<hash>.css \
  assets/Auth-<hash>.js \
  assets/Dashboard-<hash>.js \
  assets/LegadoSangiovanniGame-<hash>.js
do
  curl -sS -o /dev/null -w "$p %{http_code} %{content_type} %{size_download}\n" \
    "https://herenciard.vmsencf.com/$p"
done

curl -sS -o /dev/null -w "%{http_code} %{content_type}\n" \
  "https://herenciard.vmsencf.com/assets/definitely-missing.js"
```

Expected:

- JS files: `200 application/x-javascript` or `200 text/javascript`
- CSS files: `200 text/css`
- Missing asset: `404`, not `200 text/html`
- `/api/health`: `200 application/json`

## Emergency Recovery

If the flash/blank screen returns:

1. Check the current production `index.html` asset hashes.
2. Verify every referenced JS/CSS asset returns 200 with the correct content type.
3. Re-upload missing assets first.
4. Re-upload `.htaccess`.
5. Re-upload `index.html` last.
6. Ask the tester to open with `?reload=1` only after production assets are confirmed.

Do not touch production data, database, `.env`, or migrations for this issue.

## 2026-05-27 Deploy Note

Latest verified production build:

- Commit: `630de7c` (`Polish legacy finale and narrative scrolling`)
- Main JS: `/assets/index-BLXndUy2.js`
- Main CSS: `/assets/index-B2UL79wP.css`
- Storybook chunk: `/assets/LegadoSangiovanniGame-sCSq9LB1.js`
- Production checks after deploy:
  - `/` returned 200 and referenced the latest hashes above.
  - `/api/health` returned 200 JSON.
  - `/sienna/legado-game` returned 200 HTML.
  - Main JS/CSS and the storybook chunk returned 200 with JS/CSS content types.
  - A missing asset under `/assets/__missing_verify__.js` returned 404.

Operational note: FTP was intermittent during this deploy. The safe response is to keep production on the old `index.html` until all new assets are confirmed, then upload `index.html` last. Do not force `index.html` early.
