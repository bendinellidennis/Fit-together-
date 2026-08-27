const APP_CACHE="fit-together-v14-app";
const RUNTIME_CACHE="fit-together-v14-runtime";
const APP_SHELL=["./","./index.html","./manifest.webmanifest"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(APP_CACHE).then(c=>c.addAll(APP_SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==APP_CACHE&&k!==RUNTIME_CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("message",event=>{if(event.data&&event.data.type==="PRECACHE_APP")event.waitUntil(caches.open(APP_CACHE).then(c=>c.addAll(APP_SHELL)))});
self.addEventListener("fetch",event=>{
 const req=event.request;if(req.method!=="GET")return;const url=new URL(req.url);
 if(req.mode==="navigate"){event.respondWith(fetch(req).then(resp=>{const copy=resp.clone();caches.open(APP_CACHE).then(c=>c.put("./index.html",copy));return resp}).catch(()=>caches.match("./index.html")));return}
 if(url.origin===self.location.origin){event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(resp=>{const copy=resp.clone();caches.open(APP_CACHE).then(c=>c.put(req,copy));return resp})));return}
 event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(resp=>{if(resp&&(resp.ok||resp.type==="opaque")){const copy=resp.clone();caches.open(RUNTIME_CACHE).then(c=>c.put(req,copy)).catch(()=>{})}return resp})));
});