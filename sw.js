const CACHE_NAME='dataforge-v2-1';
const urlsToCache=['index.html','data.json','sample-data.html'];

self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache=>cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('fetch',e=>{
  e.respondWith(
    caches.match(e.request)
      .then(response=>{
        if(response)return response;
        return fetch(e.request).then(r=>{
          if(!r||r.status!==200||r.type!=='basic')return r;
          return caches.open(CACHE_NAME).then(cache=>{
            cache.put(e.request,r.clone());
            return r;
          });
        });
      }).catch(()=>caches.match('index.html'))
  );
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(cacheNames=>{
      return Promise.all(
        cacheNames.map(cache=>{
          if(cache!==CACHE_NAME)return caches.delete(cache);
        })
      );
    })
  );
  self.clients.claim();
});
