// Offline cache: app shell is pre-cached, Google Fonts are cached the first time they load.
const CACHE='melody-chords-v1';
const SHELL=['./','index.html','manifest.webmanifest','icons/icon.svg','icons/icon-180.png','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  e.respondWith(fetch(r).then(res=>{
    if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));}
    return res;
  }).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))));
});
