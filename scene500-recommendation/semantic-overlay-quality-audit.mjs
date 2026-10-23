// Audit experimental Scene500 overlay quality without changing Hybrid ranking.
// Heuristics are screening signals, NOT independent semantic verification.
const templatePatterns=[
  /^我想学习.+相关的英语表达$/,
  /^在.+的情况下如何沟通$/,
  /^.+时关于.+的问题$/
];
export function auditSemanticOverlayQuality(payload){
  const scenes=Array.isArray(payload?.scenes)?payload.scenes:[];
  let total=0,template=0,short=0,identical=0;
  const flagged=[];
  for(const s of scenes){
    const name=String(s?.name??'');
    let sceneTotal=0,sceneTemplate=0;
    for(const raw of Array.isArray(s?.expressions)?s.expressions:[]){
      if(typeof raw!=='string')continue;
      total++;sceneTotal++;
      const x=raw.trim();
      if(templatePatterns.some(re=>re.test(x))){template++;sceneTemplate++;}
      if(x.length<5)short++;
      if(name&&x===name)identical++;
    }
    if(sceneTotal>0&&sceneTemplate/sceneTotal>=0.5)flagged.push(s.scene_id);
  }
  return {
    status:'screening_only_not_semantic_certification',
    scene_count:scenes.length,expression_count:total,
    generic_template_count:template,generic_template_ratio:total?template/total:0,
    short_expression_count:short,identical_to_scene_name_count:identical,
    high_template_scene_ids:flagged,
    requires_independent_relevance_review:true
  };
}
