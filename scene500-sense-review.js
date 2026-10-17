// Scene500 Sense/KU review support. QA-only: never changes playable bindings automatically.
(function(){
  const PRIMARY_SCENES=new Set(['cs018','cs043','cs044','cs046','cs047','cs049','cs057','cs062','cs064','cs073','cs076','cs079','cs081','cs088','cs090','cs092','cs096','cs468']);
  const HINTS=Object.freeze({
    'cs043:book':'预订（酒店房间）','cs043:room':'酒店房间、客房',
    'cs044:check':'办理入住、核对入住信息','cs044:key':'房门钥匙、房卡','cs044:front':'前台（front desk）','cs044:desk':'前台（front desk）','cs044:service':'酒店服务','cs044:stay':'住宿、入住',
    'cs046:check':'值机、检查','cs046:security':'机场安检、安全检查','cs046:gate':'登机口','cs046:board':'登机',
    'cs047:board':'登机','cs047:gate':'登机口','cs047:change':'改签、更改航班',
    'cs049:declare':'向海关申报','cs049:officer':'海关或边检官员',
    'cs062:note':'课堂笔记、记笔记','cs062:class':'课程、课堂',
    'cs064:partner':'合作伙伴、组员',
    'cs073:position':'职位、岗位','cs073:candidate':'求职候选人','cs073:strength':'个人优势、长处',
    'cs076:report':'会议汇报、报告','cs076:update':'进展更新、汇报最新情况',
    'cs079:issue':'客户问题、故障或待解决事项','cs079:support':'客户支持','cs079:request':'客户请求、需求',
    'cs081:screen':'电子设备屏幕','cs081:update':'软件更新','cs081:install':'安装软件或应用','cs081:connect':'连接设备或网络',
    'cs088:model':'人工智能或机器学习模型','cs088:application':'人工智能应用、用途',
    'cs090:control':'生产或质量控制','cs090:process':'生产流程、工艺过程',
    'cs092:paper':'学术论文','cs092:study':'研究、研究工作','cs092:result':'研究结果','cs092:evidence':'研究证据',
    'cs096:paper':'学术论文','cs096:present':'作学术报告、展示研究','cs096:session':'会议分会、学术场次','cs096:speaker':'会议报告人、演讲者',
    'cs468:resource':'自然资源、能源资源','cs468:risk':'气候或环境风险'
  });
  const membership=()=>window.PAI_SCENE500_MEMBERSHIP||{};
  const core=()=>window.PAI_CORE;
  function candidateSenses(lemma){
    const out=[];
    for(const w of (core()?.byLemma?.get(String(lemma||'').toLowerCase())||[])){
      for(const [kuId,s] of Object.entries(w.s||{})){
        if(String(s?.kuType||'sense').toLowerCase()!=='sense')continue;
        out.push({coreRank:w.rank??null,lemma:w.w||lemma,kuId,pos:s.pos||w.pos||'',meaningZh:s.m||s.meaningZh||'',title:s.kuTitle||'',scene:s.scene||''});
      }
    }
    return out;
  }
  function currentResolved(sceneId,lemma){
    return (window.PAI_SCENE500?.membershipByScene?.[sceneId]||[]).find(x=>String(x.lemma||'').toLowerCase()===String(lemma||'').toLowerCase())||null;
  }
  function buildQueue(){
    const rows=[];
    for(const [sceneId,scene] of Object.entries(membership().scenes||{})){
      if(!PRIMARY_SCENES.has(sceneId))continue;
      for(const raw of (scene?.entries||[])){
        if(typeof raw!=='object'||!raw)continue;
        const lemma=String(raw.lemma||'').toLowerCase();if(!lemma)continue;
        const candidates=candidateSenses(lemma),resolved=currentResolved(sceneId,lemma);
        const explicit=!!(raw.kuId||raw.senseId);
        const hint=raw.senseHintZh||HINTS[`${sceneId}:${lemma}`]||'';
        const needsReview=!explicit||raw.senseBindingReviewed!==true;
        if(!needsReview)continue;
        rows.push({sceneId,sceneName:SCENES?.[sceneId]||sceneId,sceneRank:Number(raw.sceneRank)||null,lemma,targetSenseZh:hint,currentKuId:resolved?.kuId||null,currentBindingMethod:resolved?.bindingMethod||null,currentSenseBindingStatus:resolved?.senseBindingStatus||null,candidateCount:candidates.length,candidates});
      }
    }
    return rows.sort((a,b)=>a.sceneId.localeCompare(b.sceneId)||(a.sceneRank||999999)-(b.sceneRank||999999));
  }
  window.PAI_SCENE500_SENSE_REVIEW={
    version:'sense-review-v1',
    hints:HINTS,
    candidateSenses,
    queue:buildQueue,
    summary(){const q=buildQueue();return {entries:q.length,withTargetHint:q.filter(x=>x.targetSenseZh).length,ambiguous:q.filter(x=>x.candidateCount>1).length,noCandidate:q.filter(x=>x.candidateCount===0).length,singleCandidate:q.filter(x=>x.candidateCount===1).length}},
    export(){return {schema:'pai-word-scene500-sense-review-v1',generatedAt:new Date().toISOString(),note:'QA-only candidate review. No row is Sense-verified until membership explicitly records kuId/senseId and senseBindingReviewed=true.',summary:this.summary(),rows:buildQueue()}}
  };
})();