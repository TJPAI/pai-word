// PAI Word v4 compatibility: old Core-13000 scene-review decisions do not apply to the new KU namespace.
(function(root){
  const lookup=k=>root.PAI_CORE?.byKU?.get(k)||null;
  root.PAI_SCENE_REVIEW={
    apply(id,keys){return [...new Set((keys||[]).filter(k=>lookup(k)?.s?.kuType==='sense'))].sort((a,b)=>lookup(a).w.rank-lookup(b).w.rank||a.localeCompare(b))},
    evidence(){return null},
    stats(id,keys){return {editoriallyReviewed:0,pending:(keys||[]).length,dictionaryVerified:0}},
    decisions(){return []}
  };
})(typeof window==='undefined'?globalThis:window);
