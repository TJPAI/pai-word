// Explicitly opted-in experiment. Preserves baseline engine and keeps provenance visible.
export function withExperimentalSceneExtension(base,{catalog,extension,enabled=false}={}){
 if(!enabled)return base;
 if(extension?.schema!=='scene500-experimental-compound-extension-v0.1'||
    extension.status!=='EXPERIMENTAL_NOT_APPROVED'||extension.requires_opt_in!==true||
    extension.production_ready!==false||extension.lexicon_version!=='0.10.1-evidence-compat'||
    !Number.isInteger(extension.baseline_count)||extension.baseline_count!==3553||
    !Array.isArray(extension.candidates)||
    !catalog?.scenes)throw Error('SCENE500_INVALID_EXPERIMENTAL_EXTENSION');
 const index=new Map(),seen=new Set(),termOwners=new Map();
 for(const p of extension.candidates){
  const key=JSON.stringify([p.term_id,p.scene_id]);
  if(seen.has(key)||!catalog.scenes[p.scene_id]||p.release_eligible!==false||
     p.status!=='EXPERIMENTAL_UNVERIFIED'||typeof p.term!=='string'||
     p.term.length<2||!Number.isFinite(p.score)||p.score<=0||p.score>.45)
    throw Error('SCENE500_INVALID_EXPERIMENTAL_EDGE');
  seen.add(key);
  // A negating compound may invert the anchor's meaning; never expose its
  // inherited scene in the opt-in experiment without an independent review.
  if(typeof p.anchor_term==='string'&&/^(不|非|无|反|未|失)/u.test(p.term)&&
     !/^(不|非|无|反|未|失)/u.test(p.anchor_term))continue;
  const surface=p.term.normalize('NFKC');
  if(termOwners.has(surface)&&termOwners.get(surface)!==p.term_id)
   throw Error('SCENE500_AMBIGUOUS_EXPERIMENTAL_TERM');
  termOwners.set(surface,p.term_id);
  if(!index.has(p.term))index.set(p.term,[]);
  index.get(p.term).push(p);
 }
 const terms=[...index.keys()].sort((a,b)=>b.length-a.length||a.localeCompare(b));
 return Object.freeze({
  ...base,experimentalExtension:'ENABLED_UNVERIFIED',
  search(query,{limit=20,eligibleSceneIds=null,...options}={}){
   const safeLimit=Number.isFinite(Number(limit))?Math.max(0,Math.min(500,Math.floor(Number(limit)))):20;
   const baseline=base.search(query,{...options,limit:500,eligibleSceneIds});
   const allowed=eligibleSceneIds==null?null:new Set(eligibleSceneIds);
   const q=String(query??'').normalize('NFKC').toLowerCase().replace(/[\s，。！？、；：,.!?;:]+/g,'');
   const map=new Map(baseline.results.map(x=>[x.sceneId,{...x}]));
   const matched=[];
   for(const term of terms){
    if(!q.includes(term)||matched.some(parent=>parent.includes(term)))continue;
    matched.push(term);if(matched.length>=10)break;
   }
   for(const term of matched)for(const p of index.get(term)){
    if(allowed&&!allowed.has(p.scene_id))continue;
    const old=map.get(p.scene_id);
    const delta=+(p.score*2).toFixed(3);
    if(old){
     old.score=+(old.score+delta).toFixed(3);
     old.reason=[...new Set([...(old.reason||[]),'experimental_compound_inheritance'])];
     old.experimental=true;
    }else map.set(p.scene_id,{sceneId:p.scene_id,name:catalog.scenes[p.scene_id].name,
     score:delta,reason:['experimental_compound_inheritance'],
     matchedTerms:[term],experimental:true,evidenceStatus:'unverified'});
   }
   const results=[...map.values()].sort((a,b)=>b.score-a.score||a.sceneId.localeCompare(b.sceneId));
   results.forEach((x,i)=>{x.rank=i+1;});
   return {query:String(query??''),total:results.length,results:results.slice(0,safeLimit)};
  }
 });
}
