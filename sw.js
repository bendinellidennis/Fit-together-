const APP_CACHE="fit-together-v40-video-app";
const RUNTIME_CACHE="fit-together-v40-video-runtime";
const OFFLINE_URL="./index.html";

self.addEventListener("install",event=>{
  self.skipWaiting();
  event.waitUntil(
    caches.open(APP_CACHE).then(async cache=>{
      try{
        const r=await fetch(OFFLINE_URL,{cache:"reload"});
        if(r.ok)await cache.put(OFFLINE_URL,r.clone());
      }catch(e){}
    })
  );
});

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.map(k=>{
      if(k!==APP_CACHE && k!==RUNTIME_CACHE && /fit-together|ft-/i.test(k)) return caches.delete(k);
    }));
    await self.clients.claim();
  })());
});

async function networkFirst(request){
  try{
    const fresh=await fetch(request,{cache:"no-store"});
    if(fresh && fresh.ok){
      const cache=await caches.open(APP_CACHE);
      cache.put(OFFLINE_URL,fresh.clone()).catch(()=>{});
    }
    return fresh;
  }catch(e){
    const cached=await caches.match(OFFLINE_URL);
    if(cached)return cached;
    throw e;
  }
}

self.addEventListener("fetch",event=>{
  const req=event.request;
  if(req.method!=="GET")return;

  const url=new URL(req.url);
  const isNavigation=req.mode==="navigate" ||
    (req.destination==="document") ||
    url.pathname.endsWith("/index.html");

  if(isNavigation){
    event.respondWith(networkFirst(req));
    return;
  }

  event.respondWith((async()=>{
    const cached=await caches.match(req);
    const fetchPromise=fetch(req).then(async res=>{
      if(res && res.ok){
        const cache=await caches.open(RUNTIME_CACHE);
        cache.put(req,res.clone()).catch(()=>{});
      }
      return res;
    }).catch(()=>cached);
    return cached || fetchPromise;
  })());
});

self.addEventListener("message",event=>{
  if(event.data?.type==="PRECACHE_APP"){
    event.waitUntil((async()=>{
      try{
        const r=await fetch(OFFLINE_URL,{cache:"reload"});
        if(r.ok){
          const c=await caches.open(APP_CACHE);
          await c.put(OFFLINE_URL,r.clone());
        }
      }catch(e){}
    })());
  }
});
