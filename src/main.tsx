import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './pwa-register';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Registro del Service Worker para PWA en subruta de GitHub Pages
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/agenda-consulta/sw.js', { scope: '/agenda-consulta/' })
      .then((registration) => {
        console.log('ServiceWorker registrado con éxito en scope:', registration.scope);
      })
      .catch((error) => {
        console.error('Error al registrar ServiceWorker:', error);
      });
  });
}
