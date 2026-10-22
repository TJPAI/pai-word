// Independent Scene500 recommendation engine. Browser ESM; no DOM, globals, SRS or home code.
export const ENGINE_VERSION='1.0.0-alpha.1';
const normalize=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/[\s，。！？、；：,.!?;:]+/g,'');
const unique=a=>[...new Set(a.filter(Boolean))];
function score(query,s){
 const q=normalize(query); if(!q)return 0;
 let points=0;
 for(const p of unique([s.name,...(s.aliases||[])]).map(normalize).filter(x=>x.length>=2))
  if(q.includes(p))points+=p===normalize(s.name)?20:12;
 let actions=0,objects=0;
 for(const p of unique(s.actions||[]).map(normalize).filter(x=>x.length>=2))
  if(q.includes(p)){points+=7;actions++}
 for(const p of unique(s.objects||[]).map(normalize).filter(x=>x.length>=2))
  if(q.includes(p)){points+=4;objects++}
 if(actions&&objects)points+=10;
 const desc=normalize(s.description_enriched||'');
 const grams=unique([...q].slice(0,-1).map((c,i)=>c+q[i+1]));
 points+=Math.min(5,grams.filter(g=>desc.includes(g)).length*.5);
 if((s.example_queries||[]).some(x=>normalize(x)===q))points+=16;
 const negatives=unique(s.negative_terms||[]).map(normalize).filter(x=>x.length>=2);
 points-=Math.min(18,negatives.filter(x=>q.includes(x)).length*9);
 return Math.round(Math.max(0,points)*100)/100;
}
function integer(value,fallback,max){
 const n=Number(value);return Number.isFinite(n)?Math.max(0,Math.min(max,Math.floor(n))):fallback;
}
export function createScene500Recommender({catalog, minimumScore=3}={}){
 if(!catalog||catalog.scene_count!==500||!catalog.scenes||Object.keys(catalog.scenes).length!==500)
  throw new Error('SCENE500_INVALID_CATALOG');
 const ordered=Object.entries(catalog.scenes).sort((a,b)=>a[0].localeCompare(b[0]));
 return Object.freeze({
  version:ENGINE_VERSION,
  catalogVersion:catalog.schema,
  search(query,{limit=20,eligibleSceneIds=null}={}){
   const q=normalize(query);if(!q)return Object.freeze({query:String(query??''),total:0,results:[]});
   const allowed=eligibleSceneIds==null?null:new Set(eligibleSceneIds);
   const rows=ordered.filter(([id])=>!allowed||allowed.has(id)).map(([id,s])=>({
    sceneId:id,score:score(q,s),quality:s.quality,
    name:s.name
   })).filter(r=>r.score>=minimumScore)
    .sort((a,b)=>b.score-a.score||a.sceneId.localeCompare(b.sceneId))
    .slice(0,integer(limit,20,500));
   return {query:String(query),total:rows.length,results:rows};
  },
  getPage(snapshot,pageIndex=0,pageSize=5){
   const i=integer(pageIndex,0,100000),size=Math.max(1,integer(pageSize,5,100));
   return snapshot.results.slice(i*size,(i+1)*size);
  }
 });
}
export async function loadScene500Recommender({catalogUrl,fetchImpl=globalThis.fetch,signal}={}){
 if(!catalogUrl)throw new Error('SCENE500_MISSING_CATALOG_URL');
 const response=await fetchImpl(catalogUrl,{signal,cache:'force-cache'});
 if(!response.ok)throw new Error('SCENE500_CATALOG_FETCH_FAILED: '+response.status);
 return createScene500Recommender({catalog:await response.json()});
}
