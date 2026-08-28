const VERSION = 'frame-uv-v1.6';
const APP_ASSETS = []; // injected by Vite build
const SHELL = ['/', '/offline.html', '/assets/offline.css', '/manifest.webmanifest', '/icons/icon.svg', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png', '/assets/uv-blueprint-plate.webp', ...APP_ASSETS];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => Promise.all(SHELL.map(async (url) => {
    const response = await fetch(new Request(url, { cache: 'reload' }));
    if (!response.ok) throw new Error(`Could not precache ${url}`);
    return cache.put(url, response);
  }))));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(VERSION).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(async () => (await caches.match(event.request, { ignoreVary: true })) || (await caches.match('/')) || caches.match('/offline.html')));
    return;
  }
  event.respondWith(caches.match(event.request, { ignoreVary: true }).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) caches.open(VERSION).then((cache) => cache.put(event.request, response.clone()));
    return response;
  })));
});
