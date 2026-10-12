const CACHE='pai-word-shell-v1';
const SHELL=[
  './','./index.html','./manifest.webmanifest','./mobile.css','./ux-fix.css','./product-v2.css',
  './mobile.js','./core-loader.js','./core-bootstrap.js','./daily.js','./ipa-accent.js','./app-runtime.js','./product-v2.js'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('pai-word-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin||url.pathname.includes('/data/core13000-v25.5/'))return;
  event.respondWith((async()=>{
    try{
      const fresh=await fetch(event.request);
      if(fresh.ok){const cache=await caches.open(CACHE);cache.put(event.request,fresh.clone()).catch(()=>{});}
      return fresh;
    }catch(error){
      const cached=await caches.match(event.request,{ignoreSearch:true});
      if(cached)return cached;
      if(event.request.mode==='navigate')return caches.match('./index.html',{ignoreSearch:true});
      throw error;
    }
  })());
});
