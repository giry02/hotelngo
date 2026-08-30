const CACHE_NAME = 'hotelngo-mobile-v14';
const APP_SHELL = [
  './', './index.html', './styles/app.css', './scripts/app.js', './scripts/native-bridge.js',
  './manifest.webmanifest', './icon.svg', './assets/hotelngo-logo.svg', './assets/PretendardVariable.woff2', './assets/danang.jpg',
  './assets/kyoto.jpg', './assets/bangkok.jpg', './assets/bali.jpg', './assets/hotel.jpg',
  './assets/restaurant.jpg', './assets/spa.jpg', './assets/golf.jpg', './assets/hotel-room.jpg', './assets/market.jpg', './data/mobile-app.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.pathname.endsWith('.json')) {
    event.respondWith(fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
    return response;
  })));
});
