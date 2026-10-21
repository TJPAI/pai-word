// Preview-only opt-in-on-success light-home offline shell.
// No precache, no root-site cache deletion, no Core20K/Top100 background downloads.
// Offline study is NOT provided by this worker.
const SCOPE=new URL(self.registration.scope);
const ROOT=new URL('../',SCOPE);
const CACHE='pai-word-rebuild-preview-light-home-v21-20261021b';
const CACHEABLE=new Set([
 'rebuild-preview/','rebuild-preview/index.html',
 'rebuild-preview/preview-state.js','rebuild-preview/bootstrap.js',
 'rebuild-preview/home-index.mjs','rebuild-preview/light-home-startup.mjs',
 'rebuild-preview/light-home-budget.mjs','rebuild-preview/learning-entry.mjs',
 'rebuild-preview/light-home-view.mjs','rebuild-preview/home-dashboard.js',
 'rebuild-preview/data/home-scene-index-v1.json',
 'rebuild-preview/data/home-ku-metadata-v1.json',
 'rebuild-preview/data/home-ku-metadata-v1.json.gz',
 'rebuild-preview/scene-search.js'
]);
const pathOf=url=>{
 const u=new URL(url);
 if(u.origin!==ROOT.origin||!u.pathname.startsWith(ROOT.pathname))return null;
 return decodeURIComponent(u.pathname.slice(ROOT.pathname.length));
};
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 // Keep older preview caches for rollback until a complete replacement is verified.
 // Fetches use only CACHE and never fall back across versions.
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const path=pathOf(request.url);
 if(!path||!CACHEABLE.has(path))return;
 // Only requests from preview-controlled clients; do not intercept root-site pages.
 if(event.clientId&&!new URL(self.registration.scope).pathname.includes('rebuild-preview/'))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{
   const response=await fetch(request);
   if(response.ok&&response.type==='basic')event.waitUntil(cache.put(request,response.clone()));
   return response;
  }catch(error){
   const cached=await cache.match(request);
   if(cached)return cached;
   throw error;
  }
 })());
});
