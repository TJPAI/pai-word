// V2.1 scene compatibility layer. Scene is context metadata, never learning identity.
(function(){
  const core=window.PAI_CORE;if(!core)throw new Error('Core lexicon not loaded');
  const approvedExtras=new Map([
    // apply = 申请 is useful in both work and academic application contexts.
    ['w_0619_apply_ku01',[{scene_id:'academic',relevance:.82,status:'approved',source:'editorial_v2.1'}]]
  ]);
  const index=new Map(Object.keys(SCENES).map(id=>[id,[]]));
  if(!index.has('unclassified'))index.set('unclassified',[]);

  for(const unit of core.byKU.values()){
    const baseScene=unit.s.scene||'unclassified';
    const links=[{scene_id:baseScene,relevance:1,status:'approved',source:'legacy_domain_mapping'}];
    for(const extra of approvedExtras.get(unit.s.ku_id)||[]){
      if(!links.some(x=>x.scene_id===extra.scene_id))links.push({...extra});
    }
    unit.s.scene_links=links;
    for(const link of links){
      if(!index.has(link.scene_id))index.set(link.scene_id,[]);
      index.get(link.scene_id).push(unit);
    }
  }

  function distinctLemmaCount(sceneId){return new Set((index.get(sceneId)||[]).map(u=>u.w.w)).size}
  function unitsForScene(sceneId){return index.get(sceneId)||[]}
  function scenesForKU(kuId){return (core.byKU.get(kuId)?.s.scene_links||[]).map(x=>({...x}))}

  window.PAI_V21_SCENES={index,unitsForScene,distinctLemmaCount,scenesForKU,approvedExtras};
})();
