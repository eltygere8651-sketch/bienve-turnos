
/// <reference lib="webworker" />

const CACHE_NAME = 'bienve-app-v8'; // Forzamos actualización de caché
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
      return cache.addAll(urlsToCache).catch(err => {
        console.warn('Error al precachear algunos recursos:', err);
      });
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
  const isSourceFile = event.request.url.includes('.tsx') || event.request.url.includes('index.tsx');
  if (isSourceFile) {
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request)) as Promise<Response>
  );
});

export {};
