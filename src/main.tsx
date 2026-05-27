import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerServiceWorker } from './lib/registerServiceWorker.ts'

window.addEventListener('vite:preloadError', () => {
  if (sessionStorage.getItem('legado:chunk-reload')) {
    return;
  }

  sessionStorage.setItem('legado:chunk-reload', '1');
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(<App />);
registerServiceWorker();
