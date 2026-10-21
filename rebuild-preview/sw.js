// V2.1 preview-scoped worker: deliberately does not cache or rewrite production requests.
// Scope must remain /pai-word/rebuild-preview/.
const SCOPE=new URL(self.registration.scope);
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
  // Network/browser default; never respond with the root index.html or touch root caches.
  if(!event.request.url.startsWith(SCOPE.href))return;
});
