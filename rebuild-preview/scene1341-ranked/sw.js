/* PAI Word Scene1341 ranked preview ONLY.
 * Registration lives under rebuild-preview/scene1341-ranked/.
 * Never registers at the root or intercepts unrelated app requests.
 */
const SHELL_CACHE='pai-word-scene1341-ranked-shell-v1';
const DATA_CACHE='pai-word-scene1341-ranked-v51-v61-20261109';
const RELATIVE=['./','./index.html','../scene1341-ranked-ui.mjs',
  '../scene1341-ranked-preview.mjs',
  '../../tools/integration/scene1341-ranked/manifest.json',
  '../../tools/integration/scene1341-ranked/index.json'];
const ALLOWED=new Set(RELATIVE.map(x=>new URL(x,self.location.href).href));
const batchPrefix=new URL('../../tools/integration/scene1341-ranked/',self.location.href).href;
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{const c=await caches.open(SHELL_CACHE);await c.addAll(RELATIVE);await self.skipWaiting();})());
});
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const u=event.request.url;
  const batch=u.startsWith(batchPrefix)&&/^v(?:5[1-9]|6[01])-ranked\.csv$/.test(u.slice(batchPrefix.length));
  if(!ALLOWED.has(u)&&!batch)return; // Do not affect other PAI Word pages.
  event.respondWith((async()=>{
    const cache=await caches.open(batch?DATA_CACHE:SHELL_CACHE);
    const cached=await cache.match(event.request);
    if(cached)return cached;
    try{
      const response=await fetch(event.request);
      if(response.ok)await cache.put(event.request,response.clone()).catch(()=>{});
      return response;
    }catch(error){
      if(cached)return cached;
      return new Response('Offline asset not yet cached',{status:503,headers:{'content-type':'text/plain; charset=utf-8'}});
    }
  })());
});
