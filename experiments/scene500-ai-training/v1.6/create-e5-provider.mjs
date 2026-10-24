/** Browser-only provider for the deployed Muse V1.6 runtime.
 * E5 and index are fetched lazily from the same-origin /scene500-e5/ directory.
 * No DOM, storage, SRS or homepage side effects.
 */
export function createE5Provider({
 baseUrl='/scene500-e5/',
 timeoutMs=60000,
 fallback,
 eligibleSceneIds,
}={}){
 const root=new URL(baseUrl,location.href);
 if(root.origin!==location.origin)throw Error('E5 assets must be same-origin');
 if(!root.pathname.endsWith('/'))root.pathname+='/';
 let encoder=null,enginePromise=null,disposed=false;
 const controllers=new Set();
 const abortError=()=>new DOMException('E5 request cancelled','AbortError');
 const url=p=>new URL(p,root);
 async function loadJSON(path){
  const r=await fetch(url(path));
  if(!r.ok)throw Error('E5 asset '+path+' HTTP '+r.status);
  return r.json();
 }
 async function engine(){
  if(disposed)throw Error('Provider disposed');
  if(!enginePromise)enginePromise=(async()=>{
   const [{createScene500AI},{createE5Encoder}]=await Promise.all([
    import(url('adapter/scene500-ai-adapter.mjs')),
    import(url('encoder/scene500-e5-encoder.mjs'))
   ]);
   if(disposed)throw Error('Provider disposed');
   encoder=createE5Encoder({workerUrl:url('encoder/scene500-e5-worker.mjs')});
   const instance=createScene500AI({
    loadCatalog:()=>loadJSON('assets/catalog-v0.2.json'),
    loadIndex:()=>loadJSON('assets/scene500-c2-index.json'),
    embedQuery:(query,{signal}={})=>encoder.encode(query,{signal}),
    fallback,eligibleSceneIds
   });
   await instance.initialize();
   return instance;
  })().catch(e=>{enginePromise=null;encoder?.dispose();encoder=null;throw e});
  return enginePromise;
 }
 async function recommend(query,{topK=10,locale='auto',signal,timeout=timeoutMs}={}){
  if(disposed)throw Error('Provider disposed');
  if(signal?.aborted)throw abortError();
  const controller=new AbortController();
  controllers.add(controller);
  const onAbort=()=>controller.abort(signal?.reason);
  signal?.addEventListener('abort',onAbort,{once:true});
  if(signal?.aborted)controller.abort(signal.reason);
  const timer=setTimeout(()=>controller.abort(new DOMException('E5 timeout','TimeoutError')),timeout);
  try{
   const cancelled=new Promise((_,reject)=>{
    if(controller.signal.aborted){reject(abortError());return}
    controller.signal.addEventListener('abort',()=>reject(abortError()),{once:true});
   });
   const instance=await Promise.race([engine(),cancelled]);
   if(controller.signal.aborted)throw abortError();
   return await Promise.race([instance.recommend({query,topK,locale,signal:controller.signal}),cancelled]);
  }catch(e){
   if(controller.signal.aborted){
    if(signal?.aborted)throw abortError();
    // Caller may use existing rules after timeout.
    return {status:'unavailable',recommendations:[],modeUsed:'none',errorCode:'timeout'};
   }
   // Fail closed. Caller can keep existing rules recommender.
   return {status:'unavailable',recommendations:[],modeUsed:'none',errorCode:'load_or_inference_failed'};
  }finally{
   clearTimeout(timer);signal?.removeEventListener('abort',onAbort);controllers.delete(controller);
  }
 }
 return {
  recommend,
  warmup:async()=>{const e=await engine();return e.initialize()},
  dispose(){disposed=true;for(const c of controllers)c.abort();controllers.clear();encoder?.dispose();encoder=null;enginePromise=null}
 };
}
