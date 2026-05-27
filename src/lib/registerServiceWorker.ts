export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .then(() => ('caches' in window ? caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))) : undefined))
      .catch((error) => {
        console.warn('No se pudo limpiar el service worker de Memoria Sangiovanni.', error);
      });
  });
}
