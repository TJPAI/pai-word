// Host-only Scene500 bridge: independently loaded; never mutates KU, SRS or study state.
let readyPromise=null,instance=null,hybridReady=null,lastError=null,hybridSettled=false;
const queryCache=new Map();
const ROOT=new URL('../scene500-recommendation/',import.meta.url);
// Explicit opt-in; the default hybrid ranking remains untouched.
const semanticEnabled=()=>new URLSearchParams(globalThis.location?.search||'').get('scene500semantic')==='1';
let semanticPromise=null;
async function optionalOverlay(){
 if(!semanticEnabled())return null;
 if(!semanticPromise)semanticPromise=import(new URL('semantic-overlay-loader.mjs',ROOT).href)
  .then(m=>m.loadOptionalSemanticOverlay({enabled:true,url:new URL('semantic-overlay-pilot-12.json',ROOT).href,sceneIds:Object.keys(instance.catalog.scenes)}))
  .catch(()=>({enabled:false,reason:'load_error'}));
 return semanticPromise;
}


async function initialize(){
 const [rules,loader,response]=await Promise.all([
  import(new URL('engine.mjs',ROOT).href),
  import(new URL('chinese-lexicon-loader.mjs',ROOT).href),
  fetch(new URL('catalog-v0.2.json',ROOT),{cache:'force-cache'})
 ]);
 if(!response.ok)throw Error('SCENE500_CATALOG_HTTP_'+response.status);
 const catalog=await response.json();
 const rule=rules.createScene500Recommender({catalog});
 instance={catalog,engine:rule,mode:'rule_fallback'};
 // Loading the approved 20K lexicon and 3553 links is optional and never
 // blocks the first rule recommendation. The loader validates SHA-256/assets.
 hybridReady=loader.loadScene500WithChineseLexicon({
  catalog,lexiconUrl:new URL('zh-core20k-v094.min.json',ROOT).href,
  associationUrl:new URL('v094-lexical-associations.json',ROOT).href,
  timeoutMs:8000
 }).then(engine=>{
  hybridSettled=true;
  if(engine?.failure)lastError=engine.failure;
  if(engine?.mode==='hybrid'){instance.engine=engine;instance.mode='hybrid';queryCache.clear()}
  else{instance.mode='rule_fallback'}
  return instance.mode;
 }).catch(error=>{hybridSettled=true;lastError=String(error);return 'rule_fallback'});
 return instance;
}
export async function recommend(query,{difficulty='all',inventory,eligibleSceneIds=null,limit=500,signal}={}){
 if(signal?.aborted)throw new DOMException('Scene search cancelled','AbortError');
 if(!readyPromise)readyPromise=initialize().catch(error=>{readyPromise=null;lastError=String(error);throw error});
 await readyPromise;
 if(signal?.aborted)throw new DOMException('Scene search cancelled','AbortError');
 // Give a cache-warm hybrid a brief chance, but never keep the search page
 // waiting for slow Chinese lexicon downloads or a dead connection.
 if(instance.mode!=='hybrid'&&hybridReady){
  let timeout;
  try{await Promise.race([hybridReady,new Promise(resolve=>{timeout=setTimeout(resolve,350)})])}
  finally{clearTimeout(timeout)}
 }
 if(signal?.aborted)throw new DOMException('Scene search cancelled','AbortError');
 const overlay=await optionalOverlay();
 if(signal?.aborted)throw new DOMException('Scene search cancelled','AbortError');
 const allowed=eligibleSceneIds===null?null:new Set(eligibleSceneIds);
 const eligible=Object.keys(instance.catalog.scenes).filter(id=>
  (!allowed||allowed.has(id))&&typeof inventory==='function'&&Number(inventory(id,difficulty)?.reviewedCount)>0
 );
 const key=instance.mode+'|'+(overlay?.enabled?'pilot12':'baseline')+'|'+String(query)+'|'+difficulty+'|'+eligible.join(',');
 const cached=queryCache.get(key);
 if(signal?.aborted)throw new DOMException('Scene search cancelled','AbortError');
 if(cached)return {...cached,cacheHit:true,elapsedMs:0};
 const started=performance.now();
 const snapshot=instance.engine.search(query,{eligibleSceneIds:eligible,limit:Math.min(500,limit)});
 // Pilot only: exact full-expression match, never fuzzy guessing or changing the catalog.
 const phrase=String(query??'').normalize('NFKC').trim();
 const experimentalId=overlay?.enabled?overlay.overlay.scenes.find(s=>s.expressions.some(x=>x.normalize('NFKC').trim()===phrase))?.scene_id:null;
 const baseIds=snapshot.results.map(x=>x.sceneId);
 const mergedIds=experimentalId&&eligible.includes(experimentalId)?[experimentalId,...baseIds.filter(id=>id!==experimentalId)]:baseIds;
 const answer={ids:[...new Set(mergedIds)],
  total:snapshot.total,mode:instance.mode,
  elapsedMs:Math.round(performance.now()-started),error:lastError,cacheHit:false,
  semanticPilot:overlay?.enabled?'enabled':(semanticEnabled()?overlay?.reason||'unavailable':'disabled')};
 queryCache.set(key,answer);
 if(queryCache.size>24)queryCache.delete(queryCache.keys().next().value);
 return answer;
}
export const status=()=>({initialized:!!instance,error:lastError,
 mode:instance?.mode||'unloaded',hybridLoading:!!hybridReady&&!hybridSettled});
