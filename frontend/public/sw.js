const CACHE_NAME = 'matilda-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Fornece uma resposta direta para o Chrome validar o WebAPK com sucesso
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response("Matilda Café offline");
    })
  );
});