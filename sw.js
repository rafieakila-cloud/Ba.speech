const C='bacapi-v1';
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(['./bacapi.html','./bacapi.css','./bacapi.js','./bacapi-logo.svg','./manifest.json'])).then(()=>self.skipWaiting()))});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))});
