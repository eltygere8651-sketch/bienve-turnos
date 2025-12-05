// FIX: Add a triple-slash directive to include the 'webworker' library,
// which defines global types for service workers like `ServiceWorkerGlobalScope`.
/// <reference lib="webworker" />
// FIX: Removed unnecessary reference to 'vite/client' types, which are not available in the service worker scope.

// This is a robust service worker for caching static assets.
// It helps the app to load faster and work offline.

const CACHE_NAME = 'bienve-app-cache-v4'; // Incremented version to clear old caches
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json', // Cache the PWA manifest
  '/logo.svg',  // Cache the new app icon
  'https://cdn.tailwindcss.com'
];

// Cast self to the ServiceWorkerGlobalScope type to access service worker events
const sw = self as unknown as ServiceWorkerGlobalScope;

// Install event: Cache all the core assets of the application.
sw.addEventListener('install', event => {
  // FIX: Cast event to ExtendableEvent to access waitUntil
  const installEvent = event as ExtendableEvent;
  installEvent.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching core assets.');
        // Use addAll to fetch and cache all specified URLs.
        // If any fetch fails, the entire installation fails, ensuring a consistent cache state.
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event: Serve cached content when offline, using a "Cache First" strategy.
sw.addEventListener('fetch', event => {
    // FIX: Cast event to FetchEvent to access request and respondWith properties.
    const fetchEvent = event as FetchEvent;

    // We only handle GET requests. Other requests like POST should pass through to the network.
    if (fetchEvent.request.method !== 'GET') {
        return;
    }

    fetchEvent.respondWith(
        caches.match(fetchEvent.request)
            .then(cachedResponse => {
                // If the response is in the cache, return it immediately.
                if (cachedResponse) {
                    return cachedResponse;
                }

                // If it's not in the cache, fetch it from the network.
                return fetch(fetchEvent.request).then(
                    networkResponse => {
                        // Check if we received a valid response to cache.
                        // FIX: Allow caching of opaque responses from CDNs (like tailwindcss)
                        if (!networkResponse || (networkResponse.status !== 200 && networkResponse.type !== 'opaque')) {
                            return networkResponse;
                        }

                        // Clone the response because it's a stream and can only be consumed once.
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                // Put the new response in the cache for future requests.
                                cache.put(fetchEvent.request, responseToCache);
                            });

                        return networkResponse;
                    }
                ).catch(error => {
                    console.error('Fetching failed:', error);
                    // You could return a custom offline page here if you want.
                    throw error;
                });
            })
    );
});


// Activate event: Clean up old caches to save space and prevent conflicts.
sw.addEventListener('activate', event => {
  // FIX: Cast event to ExtendableEvent to access waitUntil
  const activateEvent = event as ExtendableEvent;
  const cacheWhitelist = [CACHE_NAME];
  activateEvent.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // If the cache name is not in our whitelist, delete it.
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// FIX: Add an empty export to treat the file as a module and prevent redeclaration errors.
export {};