// 工作待办追踪系统 - Service Worker (PWA)
const CACHE_NAME = 'task-tracker-v1';
const ASSETS = [
  '/test2/',
  '/test2/index.html',
  '/test2/manifest.json',
  '/test2/icons/icon-192.png',
  '/test2/icons/icon-512.png',
  'https://cdn.jsdelivr.net/npm/aipexbase-js/dist/aipexbase.umd.min.js',
  'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js'
];

// 安装：缓存核心资源
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

// 激活：清理旧缓存
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

// 拦截请求：网络优先，缓存兜底
self.addEventListener('fetch', event => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') return;

  // API 请求不缓存
  if (event.request.url.includes('aipexbase') || event.request.url.includes('sheetjs')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => {
        if (cached) return cached;
        // 如果完全离线，返回离线提示
        return new Response(
          '<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>离线</title><style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f0f2f5;color:#333;text-align:center;padding:20px}div{max-width:400px}h1{font-size:24px;margin-bottom:8px}p{color:#666;line-height:1.6}</style></head><body><div><h1>📋 暂无网络</h1><p>当前处于离线状态，请在联网后刷新页面继续使用。</p></div></body></html>',
          { headers: { 'Content-Type': 'text/html;charset=utf-8' } }
        );
      }))
  );
});
