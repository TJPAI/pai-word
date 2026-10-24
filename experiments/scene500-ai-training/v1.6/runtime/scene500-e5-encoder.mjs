/**
 * Fail-closed request lifecycle for the Muse E5 Web Worker.
 * The host supplies a URL relative to the deployed runtime, never a site-root URL.
 */
export function createE5Encoder({workerUrl=new URL('./scene500-e5-worker.mjs',import.meta.url)}={}){
 const worker=new Worker(workerUrl,{type:'module'});
 const pending=new Map();let seq=0,disposed=false;
 const abortError=()=>new DOMException('Recommendation aborted','AbortError');
 function settle(id,error,value){
  const entry=pending.get(id);if(!entry)return;
  pending.delete(id);entry.cleanup();
  if(error)entry.reject(error);else entry.resolve(value);
 }
 function failAll(error){for(const id of [...pending.keys()])settle(id,error)}
 worker.onmessage=event=>{
  const {id,ok,vector,error,modelLoadMs,type}=event.data||{};
  if(type==='fatal'){failAll(new Error('E5 worker fatal: '+error));return}
  if(!pending.has(id))return;
  if(ok)settle(id,null,{vector,modelLoadMs});
  else settle(id,new Error(error||'E5 worker error'));
 };
 worker.onerror=event=>failAll(new Error('E5 worker crashed: '+(event.message||'unknown')));
 function call(message,{signal}={}){
  if(disposed)return Promise.reject(new Error('E5 encoder disposed'));
  if(signal?.aborted)return Promise.reject(abortError());
  const id=++seq;
  return new Promise((resolve,reject)=>{
   const onAbort=()=>settle(id,abortError());
   const cleanup=()=>signal?.removeEventListener('abort',onAbort);
   pending.set(id,{resolve,reject,cleanup});
   signal?.addEventListener('abort',onAbort,{once:true});
   if(signal?.aborted){settle(id,abortError());return}
   try{worker.postMessage({id,...message})}catch(error){settle(id,error)}
  });
 }
 return {
  async encode(text,{signal}={}){const {vector}=await call({type:'encode',text},{signal});return vector},
  async warmup({signal}={}){const {modelLoadMs}=await call({type:'warmup'},{signal});return {modelLoadMs}},
  dispose(){if(disposed)return;disposed=true;failAll(new Error('E5 encoder disposed'));worker.terminate()}
 };
}
