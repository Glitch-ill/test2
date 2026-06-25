// 工作待办追踪系统 - Service Worker (PWA)
const CACHE_NAME = 'task-tracker-v3';
const ASSETS = [
  '/test2/',
  '/test2/index.html',
  '/test2/manifest.json',
  '/test2/lib/aipexbase.umd.min.js',
  '/test2/lib/xlsx.full.min.js',
  '/test2/icons/icon-192.png',
  '/test2/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        console.warn('PWA: Some assets failed to cache', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => {
        if (cached) return cached;
        return new Response(
          '<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>离线</title><style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f0f2f5;color:#333;text-align:center;padding:20px}div{max-width:400px}h1{font-size:24px;margin-bottom:8px}p{color:#666;line-height:1.6}</style></head><body><div><h1>📋 暂无网络</h1><p>当前处于离线状态，请在联网后刷新页面继续使用。</p></div></body></html>',
          { headers: { 'Content-Type': 'text/html;charset=utf-8' } }
        );
      }))
  );
});
