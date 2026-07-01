const CACHE_NAME = 'glicose-ai-v4';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/themes.css',
  '/css/main.css',
  '/css/components.css',
  '/css/dashboard.css',
  '/css/glucose.css',
  '/css/food.css',
  '/css/insulin.css',
  '/css/charts.css',
  '/css/calendar.css',
  '/css/reminders.css',
  '/css/settings.css',
  '/css/ai.css',
  '/js/app.js',
  '/js/modules/storage.js',
  '/js/modules/theme.js',
  '/js/modules/router.js',
  '/js/modules/utils.js',
  '/js/modules/dashboard.js',
  '/js/modules/glucose.js',
  '/js/modules/food.js',
  '/js/modules/insulin.js',
  '/js/modules/charts.js',
  '/js/modules/calendar.js',
  '/js/modules/reminders.js',
  '/js/modules/settings.js',
  '/js/modules/ai.js',
  '/js/modules/api.js',
  '/js/modules/nlp.js',
  '/pages/dashboard.html',
  '/pages/glucose.html',
  '/pages/food.html',
  '/pages/insulin.html',
  '/pages/charts.html',
  '/pages/calendar.html',
  '/pages/reminders.html',
  '/pages/settings.html',
  '/pages/ai.html',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('/api/')) return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      return res;
    }))
  );
});
