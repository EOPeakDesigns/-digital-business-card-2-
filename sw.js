/**
 * Service Worker (PWA)
 * - Enables offline access to the digital business card
 * - Uses a simple cache-first strategy for same-origin GET requests
 *
 * Notes:
 * - Keep this file small and stable; updates propagate when the SW changes.
 * - We intentionally avoid querystring cache-busting; the SW version controls updates.
 */

const CACHE_NAME = 'eow-business-card-v1';

// Core assets required for offline use
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/scripts/copyToClipboard.js',
  '/scripts/qrCodeHandler.js',
  '/scripts/vCardHandler.js',
  '/scripts/pwa.js',
  '/manifest.webmanifest',
  '/assets/owner.png',
  '/assets/background.png',
  '/assets/MYQR.png',
  '/assets/favicon.svg',
  '/assets/favicon-128.svg',
  '/assets/favicon-256.svg',
  '/assets/favicon-qr.svg',
  '/assets/pwa-192.svg',
  '/assets/pwa-512.svg',
  '/assets/emma-wilson.vcf'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(CORE_ASSETS);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => (key === CACHE_NAME ? null : caches.delete(key))));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin GET requests
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // Cache-first
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;

      const res = await fetch(req);
      // Cache successful responses for future offline use
      if (res && res.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, res.clone());
      }
      return res;
    })()
  );
});


