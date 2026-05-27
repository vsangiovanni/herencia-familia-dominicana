import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerServiceWorker } from './lib/registerServiceWorker.ts'

window.addEventListener('vite:preloadError', () => {
  if (sessionStorage.getItem('legado:chunk-reload')) {
    return;
  }

  sessionStorage.setItem('legado:chunk-reload', '1');
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
});

createRoot(document.getElementById("root")!).render(<App />);
registerServiceWorker();
