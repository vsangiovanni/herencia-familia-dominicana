export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        registration.update().catch(() => undefined);
      })
      .catch((error) => {
        console.warn('No se pudo registrar el service worker de Legado Sangiovanni.', error);
      });
  });
}
