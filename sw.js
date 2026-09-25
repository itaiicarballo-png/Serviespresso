/* ============================================================
   Service Worker — Serviespresso (Cotizador y Reportes)
   Cachea el "app shell" para que la aplicación abra sin conexión
   una vez que ya fue visitada al menos una vez con internet.
   ============================================================ */

const CACHE_NAME = 'serviespresso-cache-v1';

// Rutas relativas a este archivo (mismo directorio que el HTML).
// Ajusta APP_SHELL_URL si le cambias el nombre al archivo HTML principal.
const APP_SHELL_URL = 'serviespresso-documentos.html';

const ARCHIVOS_A_CACHEAR = [
  './',
  APP_SHELL_URL,
  'manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ARCHIVOS_A_CACHEAR))
      .catch(() => { /* si algún recurso no existe aún, no rompe la instalación */ })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres
          .filter((nombre) => nombre !== CACHE_NAME)
          .map((nombre) => caches.delete(nombre))
      )
    )
  );
  self.clients.claim();
});

// Estrategia: "cache primero, con actualización en segundo plano"
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((respuestaCache) => {
      const fetchPromise = fetch(event.request)
        .then((respuestaRed) => {
          if (respuestaRed && respuestaRed.status === 200) {
            const copia = respuestaRed.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
          }
          return respuestaRed;
        })
        .catch(() => respuestaCache); // sin conexión: usa lo que haya en caché

      return respuestaCache || fetchPromise;
    })
  );
});
