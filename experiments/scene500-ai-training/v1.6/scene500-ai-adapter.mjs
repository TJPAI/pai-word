// Scene500 AI adapter — isolated experimental runtime; no DOM/storage/SRS side effects.
// E5 encoder must be injected by the host; this module does not ship model weights.
export const ENGINE_VERSION='scene500-ai-adapter-0.1.0';
export const TAXONOMY_VERSION='scene500-taxonomy-20x25-v1';
const STATUSES=new Set(['ok','no_match','needs_clarification','invalid_input','unavailable']);
const abortError=()=>new DOMException('Recommendation aborted','AbortError');
function assertActive(signal){if(signal?.aborted)throw abortError();}
export function validateIdentity(catalog,index){
 if(!catalog?.scenes||Object.keys(catalog.scenes).length!==500)throw Error('Expected 500 canonical scenes');
 const ids=Array.from({length:500},(_,i)=>'S'+String(i+1).padStart(3,'0'));
 for(const id of ids)if(typeof catalog.scenes[id]?.name!=='string'||!catalog.scenes[id].name.trim())throw Error('Invalid canonical scene '+id);
 if(catalog.scenes.S001.name!=='起床与晨间准备')throw Error('Wrong Scene500 taxonomy');
 if(index){
  if(index.taxonomyVersion!==TAXONOMY_VERSION)throw Error('Index taxonomy mismatch');
  if(index.taxonomyFingerprint!==catalog.taxonomyFingerprint)throw Error('Index fingerprint mismatch');
  if(!Array.isArray(index.scenes)||index.scenes.length!==500)throw Error('Index must have 500 vectors');
  const seen=new Set();
  for(const item of index.scenes){
   if(!catalog.scenes[item.sceneId]||seen.has(item.sceneId))throw Error('Invalid/duplicate index ID '+item.sceneId);
   seen.add(item.sceneId);
   if(!Array.isArray(item.vector)||!item.vector.length||item.vector.some(v=>!Number.isFinite(v)))throw Error('Invalid vector '+item.sceneId);
  }
  const dim=index.scenes[0].vector.length;
  if(index.scenes.some(x=>x.vector.length!==dim))throw Error('Vector dimension mismatch');
 }
 return true;
}
export async function fingerprintIdentity(catalog){
 validateIdentity(catalog);
 const payload=Array.from({length:500},(_,i)=>{
  const id='S'+String(i+1).padStart(3,'0');return [id,catalog.scenes[id].name];
 });
 const bytes=new TextEncoder().encode(JSON.stringify(payload));
 if(!globalThis.crypto?.subtle)throw Error('SHA-256 WebCrypto unavailable');
 const hash=await globalThis.crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('');
}
const cosine=(a,b)=>{let dot=0,aa=0,bb=0;for(let i=0;i<a.length;i++){dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i]}return aa&&bb?dot/Math.sqrt(aa*bb):-1};
export function createScene500AI({loadCatalog,loadIndex,embedQuery,fallback,eligibleSceneIds}={}){
 if(typeof loadCatalog!=='function')throw TypeError('loadCatalog required');
 let state=null,pending=null;
 async function initialize(){
  if(state)return;
  if(!pending)pending=(async()=>{
   const catalog=await loadCatalog();
   const fp=await fingerprintIdentity(catalog);
   const normalized={...catalog,taxonomyFingerprint:fp};
   const index=typeof loadIndex==='function'?await loadIndex():null;
   if(index)validateIdentity(normalized,index);
   state={catalog:normalized,index};
  })().finally(()=>{pending=null});
  return pending;
 }
 async function recommend({query,topK=5,locale='auto',signal}={}){
  assertActive(signal);
  if(typeof query!=='string'||!query.trim()||query.length>500||/[\u0000-\u001f]/.test(query))
   return response('invalid_input',[],null,'none');
  if(!Number.isInteger(topK)||topK<1||topK>10)throw RangeError('topK must be 1..10');
  if(!['auto','zh','en'].includes(locale))throw RangeError('invalid locale');
  const start=performance.now();
  try{
   await initialize();assertActive(signal);
   const {catalog,index}=state;
   const allowed=eligibleSceneIds?new Set(await eligibleSceneIds()):null;
   const items=[];
   if(index&&typeof embedQuery==='function'){
    const q=await embedQuery('query: '+query.trim(),{signal,locale});
    assertActive(signal);
    if(!Array.isArray(q)||q.length!==index.scenes[0].vector.length||q.some(v=>!Number.isFinite(v)))throw Error('Invalid query vector');
    for(const item of index.scenes){
     if(allowed&&!allowed.has(item.sceneId))continue;
     items.push({sceneId:item.sceneId,score:cosine(q,item.vector)});
    }
    items.sort((a,b)=>b.score-a.score||a.sceneId.localeCompare(b.sceneId));
    const recommendations=items.slice(0,topK).map((x,i)=>({...x,rank:i+1,displayName:catalog.scenes[x.sceneId].name}));
    // Cosine is NOT calibrated for abstention. Do not guess no_match from score.
    return response(recommendations.length?'ok':'no_match',recommendations,'cosine_similarity','e5',catalog.taxonomyFingerprint,start);
   }
   if(typeof fallback==='function'){
    const ids=await fallback(query.trim(),{topK,locale,signal});assertActive(signal);
    const recommendations=[...new Set(ids)].filter(id=>catalog.scenes[id]&&(!allowed||allowed.has(id))).slice(0,topK).map((id,i)=>({sceneId:id,rank:i+1,score:null,displayName:catalog.scenes[id].name}));
    return response(recommendations.length?'ok':'no_match',recommendations,'none','rules_fallback',catalog.taxonomyFingerprint,start);
   }
   return response('unavailable',[],'none','none',catalog.taxonomyFingerprint,start);
  }catch(e){
   if(e?.name==='AbortError'||signal?.aborted)throw abortError();
   return response('unavailable',[],'none','none',state?.catalog.taxonomyFingerprint,start);
  }
 }
 function response(status,recommendations,scoreType,modeUsed,taxonomyFingerprint=null,start){
  if(!STATUSES.has(status))throw Error('Invalid status');
  return {status,recommendations,engineVersion:ENGINE_VERSION,taxonomyVersion:TAXONOMY_VERSION,
   taxonomyFingerprint,scoreType,modeUsed,latencyMs:start===undefined?null:Math.round(performance.now()-start)};
 }
 return {initialize,recommend};
}
