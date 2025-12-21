
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
  
  const url = event.request.url;
  
  // CRÍTICO: No cachear NUNCA archivos de código fuente para evitar versiones obsoletas
  if (url.includes('.tsx') || url.includes('.ts') || url.includes('.map') || url.includes('index.tsx')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request)) as Promise<Response>
  );
});

export {};
