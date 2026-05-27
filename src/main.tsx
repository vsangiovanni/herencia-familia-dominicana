import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerServiceWorker } from './lib/registerServiceWorker.ts'

const recoverFromStaleBundle = () => {
  const lastReload = Number(sessionStorage.getItem('legado:chunk-reload-at') || '0');
  const now = Date.now();
  if (now - lastReload < 3500) return;

  sessionStorage.setItem('legado:chunk-reload-at', String(now));
  const reload = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('reload', Date.now().toString());
    window.location.replace(url.toString());
  };

  if ('serviceWorker' in navigator) {
    Promise.all([
      navigator.serviceWorker.getRegistrations().then((registrations) =>
        Promise.all(registrations.map((registration) => registration.unregister()))
      ),
      'caches' in window ? caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))) : Promise.resolve(),
    ])
      .catch(() => undefined)
      .finally(reload);
    return;
  }

  reload();
};

window.addEventListener('vite:preloadError', recoverFromStaleBundle);
window.addEventListener('error', (event) => {
  const message = String(event.message || '');
  if (/dynamically imported module|Failed to fetch|Importing a module script failed|Loading chunk/i.test(message)) {
    recoverFromStaleBundle();
  }
});
window.addEventListener('unhandledrejection', (event) => {
  const message = String(event.reason?.message || event.reason || '');
  if (/dynamically imported module|Failed to fetch|Importing a module script failed|Loading chunk/i.test(message)) {
    recoverFromStaleBundle();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
registerServiceWorker();
