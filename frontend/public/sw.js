// Service Worker mínimo para habilitar a instalação do WebAPK sem o selo do Chrome
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Mantém o app elegível para instalação offline básica
});