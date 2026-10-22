// Experimental sparse Chinese term→Scene500 retrieval; no production quality assertion.
// The association registry is built offline, not inferred during a search.
export const SPARSE_VERSION='0.1.0-alpha';
const normalize=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/[\\s，。！？、；：,.!?;:]+/g,'');
export function createSparseSceneRetriever({registry, catalog}={}){
 if(!registry||registry.scene_count!==500||!registry.terms||!catalog?.scenes)
  throw new Error('SCENE500_INVALID_SPARSE_REGISTRY');
 const postings=new Map();
 for(const [term,values] of Object.entries(registry.terms)){
  const key=normalize(term);
  if(key.length<2||!Array.isArray(values)||values.length>50)throw new Error('SCENE500_INVALID_TERM: '+term);
  const seen=new Set();
  for(const {sceneId,weight} of values){
   if(!catalog.scenes[sceneId]||seen.has(sceneId)||!Number.isFinite(weight)||weight<0||weight>1)
    throw new Error('SCENE500_INVALID_POSTING: '+term);
   seen.add(sceneId);
  }
  postings.set(key,values);
 }
 const sorted=[...postings.keys()].sort((a,b)=>b.length-a.length||a.localeCompare(b));
 return Object.freeze({
  version:SPARSE_VERSION,
  search(query,{limit=50,eligibleSceneIds=null,maxTerms=10}={}){
   const q=normalize(query);
   if(!q)return {query:String(query??''),terms:[],results:[],total:0};
   const allowed=eligibleSceneIds===null?null:new Set(eligibleSceneIds);
   const chosen=[];
   for(const term of sorted){
    if(!q.includes(term))continue;
    // Do not double count a substring of an already selected compound phrase.
    if(chosen.some(x=>x.includes(term)))continue;
    chosen.push(term);
    if(chosen.length>=Math.max(1,Math.min(10,Math.floor(maxTerms)||10)))break;
   }
   const scores=new Map(),matches=new Map();
   for(const term of chosen){
    const list=postings.get(term);
    const idf=Math.log(1+500/(1+list.length));
    for(const p of list){
     if(allowed&&!allowed.has(p.sceneId))continue;
     scores.set(p.sceneId,(scores.get(p.sceneId)||0)+p.weight*idf);
     matches.set(p.sceneId,(matches.get(p.sceneId)||0)+1);
    }
   }
   const rows=[...scores].map(([sceneId,score])=>({
    sceneId,name:catalog.scenes[sceneId].name,score:Math.round(score*1000)/1000,
    matchedTerms:matches.get(sceneId)
   })).sort((a,b)=>b.score-a.score||b.matchedTerms-a.matchedTerms||a.sceneId.localeCompare(b.sceneId));
   return {query:String(query),terms:chosen,total:rows.length,results:rows.slice(0,Math.max(0,Math.min(500,Math.floor(limit)||0)))};
  }
 });
}
