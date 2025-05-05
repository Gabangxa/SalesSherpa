/**
 * Service Worker for offline support
 * 
 * This service worker provides caching strategies for:
 * - Static assets (CSS, JS, images)
 * - API responses
 * - Fallback for offline pages
 */

// Cache names for different resource types
const CACHE_NAMES = {
  static: 'static-cache-v1',
  api: 'api-cache-v1',
  pages: 'pages-cache-v1'
};

// Resources that will be cached during installation
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html', // Fallback page for when offline
  '/assets/main.css',
  '/assets/main.js',
  '/manifest.json',
  '/favicon.ico',
  '/logo.svg'
];

// API paths that should be cached
const API_CACHE_PATHS = [
  '/api/user',
  '/api/check-in-alerts'
];

// API paths that should never be cached
const API_NO_CACHE_PATHS = [
  '/api/auth/login',
  '/api/auth/logout'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAMES.static).then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      }),
      // Cache offline page
      caches.open(CACHE_NAMES.pages).then((cache) => {
        return fetch('/offline.html')
          .then((response) => {
            return cache.put('/offline.html', response);
          })
          .catch(() => {
            console.error('Failed to cache offline page');
          });
      })
    ]).then(() => {
      // Activate the new service worker immediately
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = Object.values(CACHE_NAMES);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete any old caches not in our whitelist
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
          return null;
        }).filter(Boolean)
      );
    }).then(() => {
      // Claim clients so the SW is in control immediately
      return self.clients.claim();
    })
  );
});

// Helper function to determine if an API request should be cached
function shouldCacheApiRequest(url) {
  const requestUrl = new URL(url);
  const pathname = requestUrl.pathname;
  
  // Don't cache paths that should never be cached
  if (API_NO_CACHE_PATHS.some(path => pathname.startsWith(path))) {
    return false;
  }
  
  // Cache specific API paths
  return API_CACHE_PATHS.some(path => pathname.startsWith(path));
}

// Fetch event - handle requests with appropriate caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    // For API requests, use a network-first strategy with specific caching rules
    if (shouldCacheApiRequest(request.url)) {
      event.respondWith(
        // Try network first
        fetch(request.clone())
          .then((response) => {
            // Cache the successful response
            if (response.ok) {
              const clonedResponse = response.clone();
              caches.open(CACHE_NAMES.api).then((cache) => {
                cache.put(request, clonedResponse);
              });
            }
            return response;
          })
          .catch(() => {
            // If network fails, try cache
            return caches.match(request).then((cacheResponse) => {
              return cacheResponse || Promise.reject('failed-to-fetch');
            });
          })
      );
    } else {
      // For non-cached API paths, just use network
      event.respondWith(fetch(request));
    }
    return;
  }
  
  // For page navigation requests, use a network-first strategy
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // If network fails, return the cached homepage, or offline page as fallback
          return caches.match(request)
            .then((response) => {
              return response || caches.match('/offline.html');
            });
        })
    );
    return;
  }
  
  // For static assets, use a cache-first strategy
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'image' ||
      request.destination === 'font') {
    event.respondWith(
      caches.match(request)
        .then((cacheResponse) => {
          // Return cached version or fetch from network
          return cacheResponse || fetch(request)
            .then((networkResponse) => {
              // Cache the fetched response
              const clonedResponse = networkResponse.clone();
              caches.open(CACHE_NAMES.static).then((cache) => {
                cache.put(request, clonedResponse);
              });
              return networkResponse;
            });
        })
    );
    return;
  }
  
  // For all other requests, try network then cache
  event.respondWith(
    fetch(request)
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});