// Apply explicit KU decisions; no keyword expansion or headword-wide inference.
(function(root){
 function create(doc,lookup){
  if(doc?.schemaVersion!==1||!Array.isArray(doc.decisions))throw Error('Scene review data unavailable');
  const byScene=new Map(),seen=new Set();
  for(const r of doc.decisions){
   const u=lookup(r.ku_id),pair=r.scene_id+'|'+r.ku_id;
   if(seen.has(pair)||!u||u.s.kuType!=='sense'||u.w.w!==r.word||u.s.m!==r.gloss||u.s.kuTitle!==r.title||!['include','exclude'].includes(r.action))throw Error('Invalid/stale scene review '+pair);
   seen.add(pair);if(!byScene.has(r.scene_id))byScene.set(r.scene_id,[]);byScene.get(r.scene_id).push(r);
  }
  function apply(id,keys){
   const accepted=new Set(keys.filter(k=>lookup(k)?.s.kuType==='sense'));
   for(const r of byScene.get(id)||[])if(r.action==='exclude')accepted.delete(r.ku_id);else accepted.add(r.ku_id);
   return [...accepted].sort((a,b)=>lookup(a).w.rank-lookup(b).w.rank||a.localeCompare(b));
  }
  function evidence(id,k){const r=(byScene.get(id)||[]).find(r=>r.ku_id===k&&r.action==='include');return r?{kuId:k,sceneId:id,word:r.word,source:'explicit_sense_review',reviewStatus:'editorially_reviewed',dictionaryStatus:'not_verified',verified:false,reason:r.reason}:null}
  function stats(id,keys){const n=keys.filter(k=>evidence(id,k)).length;return {editoriallyReviewed:n,pending:keys.length-n,dictionaryVerified:0}}
  return {apply,evidence,stats,decisions:id=>(byScene.get(id)||[]).map(r=>({...r}))};
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={create};
 else root.PAI_SCENE_REVIEW=create(root.PAI_SCENE_REVIEW_DATA,k=>root.PAI_CORE.byKU.get(k));
})(typeof window==='undefined'?globalThis:window);
