
/// <reference lib="webworker" />

const CACHE_NAME = 'bienve-app-v9'; 
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './logo.svg'
];

const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  sw.skipWaiting();
});

sw.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
        })
      );
    })
  );
  event.waitUntil(sw.clients.claim());
});

sw.addEventListener('fetch', (event: FetchEvent) => {
  if (event.request.method !== 'GET') return;
  // No cachear archivos de código fuente para ver cambios inmediatos en desarrollo/actualización
  if (event.request.url.includes('.tsx') || event.request.url.includes('index.tsx')) {
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request)) as Promise<Response>
  );
});

export {};
