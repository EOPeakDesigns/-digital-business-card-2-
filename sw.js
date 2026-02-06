/**
 * Service Worker (PWA)
 * - Enables offline access to the digital business card
 * - Uses network-first strategy for HTML/JS (always fresh)
 * - Uses stale-while-revalidate for CSS/images (fast + background update)
 *
 * Notes:
 * - Cache version controls updates - increment to force cache refresh
 * - HTML and JS files always fetched fresh from network
 * - CSS and images use stale-while-revalidate for performance
 */

const CACHE_NAME = 'eow-business-card-v2';
const CACHE_VERSION = 'v2';

// Core assets required for offline use
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/scripts/copyToClipboard.js',
  '/scripts/qrCodeHandler.js',
  '/scripts/vCardHandler.js',
  '/scripts/pwa.js',
  '/scripts/socialDeepLinks.js',
  '/manifest.webmanifest',
  '/assets/owner.png',
  '/assets/background.png',
  '/assets/MYQR.png',
  '/assets/favicon.svg',
  '/assets/favicon-128.svg',
  '/assets/favicon-256.svg',
  '/assets/favicon-qr.svg',
  '/assets/pwa-192.svg',
  '/assets/pwa-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      // Skip waiting to activate immediately
      await self.skipWaiting();
      
      // Pre-cache core assets in background (non-blocking)
      try {
        const cache = await caches.open(CACHE_NAME);
        // Use addAll but don't block if some assets fail
        await Promise.allSettled(
          CORE_ASSETS.map(url => 
            cache.add(url).catch(err => {
              console.warn(`Failed to cache ${url}:`, err);
            })
          )
        );
      } catch (err) {
        console.warn('Cache pre-population failed:', err);
      }
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Delete all old caches (force cache refresh on update)
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Deleting old cache:', key);
            return caches.delete(key);
          }
          return null;
        })
      );
      
      // Take control of all clients immediately
      await self.clients.claim();
      
      // Notify all clients that service worker has updated
      const clients = await self.clients.matchAll({ includeUncontrolled: true });
      clients.forEach(client => {
        client.postMessage({
          type: 'SW_UPDATED',
          version: CACHE_VERSION
        });
      });
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin GET requests
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // vCard should always be fresh and never served from cache
  if (url.pathname.endsWith('.vcf')) {
    event.respondWith(fetch(req, { cache: 'no-store' }));
    return;
  }

  // Network-first strategy for HTML and JavaScript (always fresh)
  // This ensures updates are immediately available on reload
  if (url.pathname.endsWith('.html') || 
      url.pathname.endsWith('.js') ||
      url.pathname === '/' ||
      url.pathname.endsWith('/')) {
    event.respondWith(
      (async () => {
        try {
          // Try network first
          const networkResponse = await fetch(req);
          
          // If successful, update cache in background
          if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(req, networkResponse.clone());
          }
          
          return networkResponse;
        } catch (err) {
          // Network failed, try cache (offline fallback)
          const cached = await caches.match(req);
          if (cached) {
            return cached;
          }
          // If both fail, return network error
          throw err;
        }
      })()
    );
    return;
  }

  // Stale-while-revalidate for CSS, images, and other assets
  // Fast response from cache + background update
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      
      // Fetch fresh version in background
      const fetchPromise = fetch(req).then((networkResponse) => {
        if (networkResponse && networkResponse.ok) {
          cache.put(req, networkResponse.clone());
        }
        return networkResponse;
      }).catch(() => {
        // Network failed, ignore (we have cache)
      });
      
      // Return cached version immediately if available
      if (cached) {
        // Update cache in background
        fetchPromise.catch(() => {});
        return cached;
      }
      
      // No cache, wait for network
      return fetchPromise;
    })()
  );
});


