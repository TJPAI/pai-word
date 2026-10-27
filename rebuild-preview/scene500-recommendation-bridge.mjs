// Host-only Scene500 bridge: independently loaded; never mutates KU, SRS or study state.
let readyPromise=null,instance=null,hybridReady=null,lastError=null,hybridSettled=false;
const queryCache=new Map();
const promotionListeners=new Set();
export function onHybridReady(listener){
 if(typeof listener!=='function')throw TypeError('SCENE500_LISTENER_REQUIRED');
 promotionListeners.add(listener);
 return ()=>promotionListeners.delete(listener);
}
const ROOT=new URL('../scene500-recommendation/',import.meta.url);
// Opt-in V1.2 draft reranker: only reorders eligible Hybrid candidates.
// It never creates playable scenes, changes scene IDs or touches KU/SRS.
const semanticEnabled=typeof location!=='undefined'&&new URLSearchParams(location.search).get('scene500semantic')==='1';
const observedEnabled=typeof location!=='undefined'&&new URLSearchParams(location.search).get('scene500observed')==='1';
let observedModule=null;
let semanticPromise=null,semanticOverlay=null,semanticReason='disabled';
async function loadSemantic(){
 if(!semanticEnabled)return null;
 if(!semanticPromise)semanticPromise=import(new URL('semantic-overlay-loader.mjs',ROOT).href).then(m=>m.loadOptionalSemanticOverlay({enabled:true,url:new URL('../data/scene500-semantic-overlay-v1.2.json',import.meta.url).href,sceneIds:Object.keys(instance.catalog.scenes)})).then(result=>{semanticReason=result.reason;semanticOverlay=result.overlay;queryCache.clear();for(const fn of promotionListeners){try{fn()}catch{}}return semanticOverlay}).catch(e=>{semanticReason=String(e);return null});
 return semanticPromise;
}
function semanticRank(query,results){
 if(!semanticOverlay||!Array.isArray(results)||results.length<2)return results;
 const q=String(query).normalize('NFKC').toLowerCase().replace(/\\s+/g,'');
 if(q.length<2)return results;
 const score=(id)=>{
  const profile=semanticOverlay.scenes[id];if(!profile)return {value:0,reasons:[]};
  let value=0;const reasons=[];
  const groups=[['actions',4.5],['objects',3],['aliases',2.5],['example_queries',1.1]];
  for(const [field,weight] of groups){let best=0,hit='';for(const raw of profile[field]||[]){const term=String(raw).normalize('NFKC').toLowerCase().replace(/\\s+/g,'');if(term.length<2||term.length>q.length||!q.includes(term))continue;const strength=term.length<3?0.35:term.length<4?0.65:1;const v=weight*strength;if(v>best){best=v;hit=raw}}if(best){value+=best;reasons.push(field+':'+hit)}}
  for(const raw of profile.negative_terms||[]){const term=String(raw).normalize('NFKC').toLowerCase();if(term.length>=2&&q.includes(term))value-=8}
  return {value,reasons};
 };
 const enriched=results.map((id,index)=>({id,index,...score(id)}));
 const winner=Math.max(...enriched.map(x=>x.value));
 // Require multiple independent signals or a strong action/object match;
 // otherwise preserve original Hybrid order exactly.
 if(winner<5.5)return results;
 enriched.sort((a,b)=>b.value-a.value||a.index-b.index);
 globalThis.PAI_SCENE500_SEMANTIC_DIAGNOSTIC={query,triggered:true,reasons:enriched.filter(x=>x.value>0).slice(0,5).map(x=>({sceneId:x.id,score:x.value,reasons:x.reasons}))};
 return enriched.map(x=>x.id);
}


async function initialize(){
 const [rules,loader,response,observed]=await Promise.all([
  import(new URL('engine.mjs',ROOT).href),
  import(new URL('chinese-lexicon-loader.mjs',ROOT).href),
  fetch(new URL('catalog-v0.2.json?v=handoff-4f01be8-20261024',ROOT),{cache:'force-cache'}),
  observedEnabled?import(new URL('observed-query-corrections.mjs',ROOT).href):Promise.resolve(null)
 ]);
 if(!response.ok)throw Error('SCENE500_CATALOG_HTTP_'+response.status);
 const catalog=await response.json();
 observedModule=observed;
 const rule=rules.createScene500Recommender({catalog});
 instance={catalog,engine:rule,mode:'rule_fallback'};
 if(semanticEnabled)void loadSemantic();
 // Loading the approved 20K lexicon and 3553 links is optional and never
 // blocks the first rule recommendation. Asset SHA verification is a release gate.
 hybridReady=loader.loadScene500WithChineseLexicon({
  catalog,lexiconUrl:new URL('zh-core20k-v0101-scene500-runtime.json',ROOT).href,
  associationUrl:new URL('v094-lexical-associations.json',ROOT).href,
  timeoutMs:4000,
  onDiagnostic:event=>{lastError=event?.code?String(event.code)+': '+String(event.reason??''):String(event)}
 }).then(engine=>{
  hybridSettled=true;
  if(engine?.failure)lastError=engine.failure;
  if(engine?.mode==='hybrid'){instance.engine=engine;instance.mode='hybrid';queryCache.clear();for(const listener of promotionListeners){try{listener()}catch(error){console.warn('SCENE500_PROMOTION_LISTENER',error)}}}
  else{instance.mode='rule_fallback'}
  return instance.mode;
 }).catch(error=>{hybridSettled=true;lastError=String(error);return 'rule_fallback'});
 return instance;
}
export async function warmup(){
 if(!readyPromise)readyPromise=initialize().catch(error=>{readyPromise=null;lastError=String(error);throw error});
 await readyPromise;
 return status();
}
export async function recommend(query,{difficulty='all',inventory,eligibleSceneIds=null,limit=500}={}){
 if(!readyPromise)readyPromise=initialize().catch(error=>{readyPromise=null;lastError=String(error);throw error});
 await readyPromise;
 // Return the first rule recommendation without an artificial hybrid wait.
 // The existing onHybridReady listener upgrades visible results asynchronously.
 // This avoids penalizing every cold search by up to 350ms.

 const allowed=eligibleSceneIds===null?null:new Set(eligibleSceneIds);
 const eligible=Object.keys(instance.catalog.scenes).filter(id=>
  (!allowed||allowed.has(id))&&typeof inventory==='function'&&Number(inventory(id,difficulty)?.reviewedCount)>0
 );
 const key=(observedEnabled?'observed|':'baseline|')+instance.mode+'|'+String(query)+'|'+difficulty+'|'+eligible.join(',');
 const cached=queryCache.get(key);
 if(cached)return {...cached,cacheHit:true,elapsedMs:0};
 const started=performance.now();
 const raw=instance.engine.search(query,{eligibleSceneIds:eligible,limit:Math.min(500,limit)});
 const snapshot=observedModule?.applyObservedQueryCorrections(raw,query,{catalog:instance.catalog,eligibleSceneIds:eligible,limit:Math.min(500,limit)})??raw;
 const allCandidates=snapshot.results.length?null:instance.engine.search(query,{limit:500});
 const baseIds=[...new Set(snapshot.results.map(x=>x.sceneId))];
 const rankedIds=semanticEnabled&&instance.mode==='hybrid'?semanticRank(query,baseIds):baseIds;
 const answer={ids:rankedIds,
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
 mode:instance?.mode||'unloaded',observedEnabled,observedReady:!!observedModule,semanticEnabled,semanticReason,semanticReady:!!semanticOverlay,hybridLoading:!!hybridReady&&!hybridSettled,
 catalogSchema:instance?.catalog?.schema||null,
 runtimeDataVersion:instance?.mode==='hybrid'?instance.engine?.runtimeDataVersion||null:null,
 lexiconVerifiedLoaded:instance?.mode==='hybrid'&&!!instance.engine?.runtimeDataVersion,
 lexiconAsset:'zh-core20k-v0101-scene500-runtime.json',
 associationAsset:'v094-lexical-associations.json'});
