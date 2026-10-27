// Independent Scene500 recommendation engine. Browser ESM; no DOM, globals, SRS or home code.
export const ENGINE_VERSION='1.0.0-alpha.1';
const normalize=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/[\s，。！？、；：,.!?;:]+/g,'');
// ASCII words need lexical boundaries: "AI" must not match trAIn / wAIt / fAIls.
// Chinese and mixed-language phrases keep the historical compact matching semantics.
const evidenceMatch=(original,compact,phrase)=>{
 if(/^[a-z]+$/.test(phrase)){
  const raw=String(original??'').normalize('NFKC').toLowerCase();
  return new RegExp('(^|[^a-z])'+phrase+'(?=$|[^a-z])').test(raw);
 }
 return compact.includes(phrase);
};
const unique=a=>[...new Set(a.filter(Boolean))];
// Small, generic Chinese function-word strip for order-independent phrase matching.
const weakWords=/^(?:我|你|他|她|它|们|的|了|过|在|和|与|把|给|向|想|要|请|问|如何|怎么|怎样|可以|一下|一个|一些|需要|进行|有关|相关|问题|情况)$/;
const segments=x=>String(x??'').normalize('NFKC').toLowerCase().match(/[\u4e00-\u9fff]{2,}|[a-z0-9]+/g)||[];
function unorderedEvidence(q,p){
 const parts=segments(p).filter(x=>!weakWords.test(x)&&x.length>=2);
 if(parts.length<2||parts.length>4)return false;
 return parts.every(x=>evidenceMatch(q,q,x));
}
function score(query,s){
 const q=normalize(query); if(!q)return 0;
 let points=0,anchored=false;
 for(const p of unique([s.name,...(s.aliases||[])]).map(normalize).filter(x=>x.length>=2))
  if(evidenceMatch(query,q,p)){points+=p===normalize(s.name)?20:12;anchored=true;}
 // Multi-part aliases can match despite reversed phrase order, at lower weight.
 for(const p of unique(s.aliases||[]))if(!evidenceMatch(query,q,normalize(p))&&unorderedEvidence(q,p)){
  points+=6;anchored=true;
 }
 let actions=0,objects=0;
 for(const p of unique(s.actions||[]).map(normalize).filter(x=>x.length>=2))
  if(evidenceMatch(query,q,p)){points+=7;actions++;anchored=true;}
 for(const p of unique(s.objects||[]).map(normalize).filter(x=>x.length>=2))
  if(evidenceMatch(query,q,p)){points+=4;objects++;anchored=true;}
 if(actions&&objects)points+=10;
 const desc=normalize(s.description_enriched||'');
 const grams=unique([...q].slice(0,-1).map((c,i)=>c+q[i+1]));
 // Character bigrams alone are weak evidence; they must not trigger a result.
 points+=Math.min(anchored?5:2,grams.filter(g=>desc.includes(g)).length*.5);
 if((s.example_queries||[]).some(x=>normalize(x)===q)){points+=16;anchored=true;}
 const negatives=unique(s.negative_terms||[]).map(normalize).filter(x=>x.length>=2);
 points-=Math.min(18,negatives.filter(x=>evidenceMatch(query,q,x)).length*9);
 return Math.round(Math.max(0,points)*100)/100;
}
function integer(value,fallback,max){
 const n=Number(value);return Number.isFinite(n)?Math.max(0,Math.min(max,Math.floor(n))):fallback;
}
export function createScene500Recommender({catalog, minimumScore=3}={}){
 if(!catalog||catalog.scene_count!==500||!catalog.scenes||Object.keys(catalog.scenes).length!==500)
  throw new Error('SCENE500_INVALID_CATALOG');
 const ordered=Object.entries(catalog.scenes).sort((a,b)=>a[0].localeCompare(b[0]));
 // Reject malformed identities before they can leak into search or scene selection.
 for(let i=0;i<ordered.length;i++){
  const expected='S'+String(i+1).padStart(3,'0');
  const [id,scene]=ordered[i];
  if(id!==expected||!scene||typeof scene.name!=='string'||!scene.name.trim())
   throw new Error('SCENE500_INVALID_CATALOG: '+id);
 }
 return Object.freeze({
  version:ENGINE_VERSION,
  catalogVersion:catalog.schema,
  search(query,{limit=20,eligibleSceneIds=null}={}){
   const q=normalize(query);if(!q)return Object.freeze({query:String(query??''),total:0,results:[]});
   const allowed=eligibleSceneIds==null?null:new Set(eligibleSceneIds);
   const rows=ordered.filter(([id])=>!allowed||allowed.has(id)).map(([id,s])=>({
    sceneId:id,score:score(query,s),quality:s.quality,
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
