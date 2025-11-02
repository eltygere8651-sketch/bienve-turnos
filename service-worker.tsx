// FIX: Add a triple-slash directive to include the 'webworker' library,
// which defines global types for service workers like `ServiceWorkerGlobalScope`.
/// <reference lib="webworker" />

// This is a robust service worker for caching static assets.
// It helps the app to load faster and work offline.

const CACHE_NAME = 'bienve-app-cache-v3'; // Incremented version to clear old caches
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx', // Cache the main script to enable offline functionality
  '/logo.svg',  // Cache the new app icon
  'https://cdn.tailwindcss.com',
  // Cache all critical CDN assets from the importmap
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/react-dom@^19.2.0',
  'https://aistudiocdn.com/@google/genai@^1.28.0',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// Cast self to the ServiceWorkerGlobalScope type to access service worker events
const sw = self as unknown as ServiceWorkerGlobalScope;

// Install event: Cache all the core assets of the application.
sw.addEventListener('install', event => {
  event.waitUntil(
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
    // We only handle GET requests. Other requests like POST should pass through to the network.
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // If the response is in the cache, return it immediately.
                if (cachedResponse) {
                    return cachedResponse;
                }

                // If it's not in the cache, fetch it from the network.
                return fetch(event.request).then(
                    networkResponse => {
                        // Check if we received a valid response to cache.
                        // FIX: Allow caching of opaque responses from CDNs (like tailwindcss)
                        if (!networkResponse || networkResponse.status !== 200) {
                            if (networkResponse && networkResponse.type === 'opaque') {
                                // It's an opaque response, let's cache it but we can't inspect it.
                            } else {
                                return networkResponse;
                            }
                        }

                        // Clone the response because it's a stream and can only be consumed once.
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                // Put the new response in the cache for future requests.
                                cache.put(event.request, responseToCache);
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
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
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