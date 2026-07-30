const CACHE='opic-vocab-v5-native-wakelock';
const CORE=['./','./index.html','./manifest.webmanifest'];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(cache=>cache.addAll(CORE))
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;

  const url=new URL(req.url);
  const isNavigation=req.mode==='navigate' || url.pathname.endsWith('/index.html');

  if(isNavigation){
    event.respondWith(
      fetch(req,{cache:'no-store'})
        .then(response=>{
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(req,copy));
          return response;
        })
        .catch(()=>caches.match(req).then(r=>r||caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached=>cached||fetch(req).then(response=>{
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(req,copy));
      return response;
    }))
  );
});
