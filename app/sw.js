const CACHE_NAME = 'glicose-ai-v2';
const ASSETS = [
  '/app/index.html',
  '/app/css/main.css',
  '/app/css/themes.css',
  '/app/css/components.css',
  '/app/css/dashboard.css',
  '/app/css/glucose.css',
  '/app/css/food.css',
  '/app/css/insulin.css',
  '/app/css/charts.css',
  '/app/css/calendar.css',
  '/app/css/reminders.css',
  '/app/css/settings.css',
  '/app/css/ai.css',
  '/app/js/app.js',
  '/app/js/modules/storage.js',
  '/app/js/modules/theme.js',
  '/app/js/modules/router.js',
  '/app/js/modules/utils.js',
  '/app/js/modules/dashboard.js',
  '/app/js/modules/glucose.js',
  '/app/js/modules/food.js',
  '/app/js/modules/insulin.js',
  '/app/js/modules/charts.js',
  '/app/js/modules/calendar.js',
  '/app/js/modules/reminders.js',
  '/app/js/modules/settings.js',
  '/app/js/modules/ai.js',
  '/app/pages/dashboard.html',
  '/app/pages/glucose.html',
  '/app/pages/food.html',
  '/app/pages/insulin.html',
  '/app/pages/charts.html',
  '/app/pages/calendar.html',
  '/app/pages/reminders.html',
  '/app/pages/settings.html',
  '/app/pages/ai.html',
  '/app/manifest.json',
  '/app/icons/icon-192.svg',
  '/app/icons/icon-512.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
      return res;
    }))
  );
});
