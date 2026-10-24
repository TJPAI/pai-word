// Host-only Scene500 bridge: independently loaded; never mutates KU, SRS or study state.
let readyPromise=null,instance=null,hybridReady=null,lastError=null,hybridSettled=false;
const queryCache=new Map();
const ROOT=new URL('../scene500-recommendation/',import.meta.url);

async function initialize(){
 const [rules,loader,response]=await Promise.all([
  import(new URL('engine.mjs',ROOT).href),
  import(new URL('chinese-lexicon-loader.mjs',ROOT).href),
  fetch(new URL('catalog-v0.2.json?v=handoff-4f01be8-20261024',ROOT),{cache:'force-cache'})
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
  timeoutMs:4000,
  onDiagnostic:event=>{lastError=event?.code?String(event.code)+': '+String(event.reason??''):String(event)}
 }).then(engine=>{
  hybridSettled=true;
  if(engine?.failure)lastError=engine.failure;
  if(engine?.mode==='hybrid'){instance.engine=engine;instance.mode='hybrid';queryCache.clear()}
  else{instance.mode='rule_fallback'}
  return instance.mode;
 }).catch(error=>{hybridSettled=true;lastError=String(error);return 'rule_fallback'});
 return instance;
}
export async function recommend(query,{difficulty='all',inventory,eligibleSceneIds=null,limit=500}={}){
 if(!readyPromise)readyPromise=initialize().catch(error=>{readyPromise=null;lastError=String(error);throw error});
 await readyPromise;
 // Give a cache-warm hybrid a brief chance, but never keep the search page
 // waiting for slow Chinese lexicon downloads or a dead connection.
 if(instance.mode!=='hybrid'&&hybridReady){
  let timeout;
  try{await Promise.race([hybridReady,new Promise(resolve=>{timeout=setTimeout(resolve,350)})])}
  finally{clearTimeout(timeout)}
 }
 const allowed=eligibleSceneIds===null?null:new Set(eligibleSceneIds);
 const eligible=Object.keys(instance.catalog.scenes).filter(id=>
  (!allowed||allowed.has(id))&&typeof inventory==='function'&&Number(inventory(id,difficulty)?.reviewedCount)>0
 );
 const key=instance.mode+'|'+String(query)+'|'+difficulty+'|'+eligible.join(',');
 const cached=queryCache.get(key);
 if(cached)return {...cached,cacheHit:true,elapsedMs:0};
 const started=performance.now();
 const snapshot=instance.engine.search(query,{eligibleSceneIds:eligible,limit:Math.min(500,limit)});
 const allCandidates=snapshot.results.length?null:instance.engine.search(query,{limit:500});
 const answer={ids:[...new Set(snapshot.results.map(x=>x.sceneId))],
  total:snapshot.total,mode:instance.mode,
  emptyReason:snapshot.results.length?null:(allCandidates?.results?.length?'filtered_no_playable_scene':'no_semantic_match'),
  unfilteredCandidateCount:allCandidates?.results?.length??null,
  elapsedMs:Math.round(performance.now()-started),error:lastError,cacheHit:false};
 queryCache.set(key,answer);
 if(queryCache.size>24)queryCache.delete(queryCache.keys().next().value);
 return answer;
}
// Explicit preview diagnostics: the caller can inspect the active engine without
// confusing an experimental upstream branch with deployed runtime assets.
export const status=()=>({initialized:!!instance,error:lastError,
 mode:instance?.mode||'unloaded',hybridLoading:!!hybridReady&&!hybridSettled,
 catalogSchema:instance?.catalog?.schema||null,
 lexiconAsset:'zh-core20k-v094.min.json',
 associationAsset:'v094-lexical-associations.json'});
