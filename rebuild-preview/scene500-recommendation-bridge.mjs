// PAI Word host-only bridge: no writes to learning state, SRS or English Core20K.
let pending=null,instance=null;let lastError=null;
const queryCache=new Map();
const ROOT=new URL('../scene500-recommendation/',import.meta.url);
async function create(){
 const [module,response]=await Promise.all([
  import(new URL('chinese-lexicon-loader.mjs',ROOT).href),
  fetch(new URL('catalog-v0.2.json',ROOT),{cache:'force-cache'})
 ]);
 if(!response.ok)throw Error('SCENE500_CATALOG_HTTP_'+response.status);
 const catalog=await response.json();
 if(catalog?.scene_count!==500||Object.keys(catalog.scenes||{}).length!==500)throw Error('SCENE500_INVALID_CATALOG');
 // Only the baseline 20K/3553-edge assets are included; the 3693-edge
 // candidate overlay remains excluded. Invalid assets revert to rule search.
 const engine=await module.loadScene500WithChineseLexicon({catalog,lexiconUrl:new URL('zh-core20k-v094.min.json',ROOT).href,associationUrl:new URL('v094-lexical-associations.json',ROOT).href,timeoutMs:8000});
 return {engine,catalog};
}
export async function recommend(query,{difficulty='all',inventory,limit=500}={}){
 if(!pending)pending=create().then(x=>(instance=x,x),e=>{pending=null;lastError=String(e);throw e});
 const ready=await pending;
 const eligible=Object.keys(ready.catalog.scenes).filter(id=>
  typeof inventory==='function' && Number(inventory(id,difficulty)?.reviewedCount)>0
 );
 const key=String(query)+'\\u0000'+difficulty+'\\u0000'+eligible.join(',');
 const cached=queryCache.get(key);
 if(cached)return {...cached,cacheHit:true,elapsedMs:0};
 const started=performance.now();
 const snapshot=ready.engine.search(query,{eligibleSceneIds:eligible,limit:Math.min(500,limit)});
 const answer={ids:[...new Set(snapshot.results.map(x=>x.sceneId))],total:snapshot.total,mode:ready.engine.mode||'rule_fallback',elapsedMs:Math.round(performance.now()-started),error:lastError,cacheHit:false};
 queryCache.set(key,answer);
 if(queryCache.size>24)queryCache.delete(queryCache.keys().next().value);
 return answer;
}
export const status=()=>({initialized:!!instance,error:lastError,mode:instance?.engine?.mode||'unloaded'});
