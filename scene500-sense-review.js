// Scene500 Sense/KU review support. QA-only: never changes playable bindings automatically.
(function(){
  const VERSION='sense-review-v2';
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
  const norm=value=>String(value||'').trim().toLowerCase();
  const selectionKey=(sceneId,lemma)=>`${sceneId}:${norm(lemma)}`;

  function candidateSenses(lemma){
    const out=[];
    for(const w of (core()?.byLemma?.get(norm(lemma))||[])){
      for(const [kuId,s] of Object.entries(w.s||{})){
        if(String(s?.kuType||'sense').toLowerCase()!=='sense')continue;
        out.push({coreRank:w.rank??null,lemma:w.w||lemma,kuId:String(kuId),pos:s.pos||w.pos||'',meaningZh:s.m||s.meaningZh||'',title:s.kuTitle||'',scene:s.scene||''});
      }
    }
    return out.sort((a,b)=>(Number(a.coreRank)||999999)-(Number(b.coreRank)||999999)||String(a.kuId).localeCompare(String(b.kuId)));
  }
  function currentResolved(sceneId,lemma){
    return (window.PAI_SCENE500?.membershipByScene?.[sceneId]||[]).find(x=>norm(x.lemma)===norm(lemma))||null;
  }
  function reviewState(raw,candidates){
    const explicit=!!(raw?.kuId||raw?.senseId);
    if(explicit&&raw?.senseBindingReviewed===true)return 'explicit_binding_reviewed';
    if(candidates.length===0)return 'unresolved';
    if(explicit)return 'explicit_binding_needs_review';
    if(candidates.length===1)return 'single_candidate_needs_review';
    return 'needs_candidate_selection';
  }
  function buildRows({includeReviewed=false,sceneId=null,ambiguousOnly=false}={}){
    const rows=[];
    for(const [sid,scene] of Object.entries(membership().scenes||{})){
      if(!PRIMARY_SCENES.has(sid)||sceneId&&sid!==sceneId)continue;
      for(const raw of (scene?.entries||[])){
        if(typeof raw!=='object'||!raw)continue;
        const lemma=norm(raw.lemma);if(!lemma)continue;
        const candidates=candidateSenses(lemma),resolved=currentResolved(sid,lemma),state=reviewState(raw,candidates);
        if(!includeReviewed&&state==='explicit_binding_reviewed')continue;
        if(ambiguousOnly&&candidates.length<=1)continue;
        rows.push({
          key:selectionKey(sid,lemma),sceneId:sid,sceneName:SCENES?.[sid]||sid,sceneRank:Number(raw.sceneRank)||null,lemma,
          targetSenseZh:raw.senseHintZh||HINTS[selectionKey(sid,lemma)]||'',reviewState:state,
          currentKuId:raw.kuId||resolved?.kuId||null,currentBindingMethod:resolved?.bindingMethod||null,
          currentSenseBindingStatus:resolved?.senseBindingStatus||null,candidateCount:candidates.length,candidates
        });
      }
    }
    return rows.sort((a,b)=>a.sceneId.localeCompare(b.sceneId)||(a.sceneRank||999999)-(b.sceneRank||999999)||a.lemma.localeCompare(b.lemma));
  }
  function findRow(sceneId,lemma){return buildRows({includeReviewed:true}).find(x=>x.key===selectionKey(sceneId,lemma))||null}
  function validateSelection(row,kuId){
    if(!row)return {ok:false,reason:'review_row_not_found'};
    const id=String(kuId||'');if(!id)return {ok:false,reason:'ku_id_required'};
    const candidate=row.candidates.find(x=>String(x.kuId)===id);
    if(!candidate)return {ok:false,reason:'ku_id_not_in_candidates'};
    return {ok:true,candidate};
  }
  function buildMembershipPatch(selections,{reviewedBy='editorial_review',reviewNote='',reviewedAt=null}={}){
    if(!selections||typeof selections!=='object'||Array.isArray(selections))throw Error('selections must be an object keyed by sceneId:lemma');
    const rows=buildRows({includeReviewed:true}),byKey=new Map(rows.map(r=>[r.key,r])),patches=[],errors=[];
    for(const [key,kuId] of Object.entries(selections).sort(([a],[b])=>a.localeCompare(b))){
      const row=byKey.get(key),check=validateSelection(row,kuId);
      if(!check.ok){errors.push({key,kuId:String(kuId||''),reason:check.reason});continue}
      const c=check.candidate;
      patches.push({sceneId:row.sceneId,lemma:row.lemma,sceneRank:row.sceneRank,coreRank:c.coreRank??null,kuId:c.kuId,
        senseBindingReviewed:true,senseBindingMethod:'manual_review',senseReviewNote:reviewNote||row.targetSenseZh||'',
        senseReviewedAt:reviewedAt||new Date().toISOString(),senseReviewedBy:reviewedBy});
    }
    return {schema:'pai-word-scene500-membership-patch-v1',mutationApplied:false,note:'Review output only. Apply to membership V2 in a separate explicit edit after validating errors and selected KU meanings.',patches,errors};
  }

  window.PAI_SCENE500_SENSE_REVIEW={
    version:VERSION,hints:HINTS,selectionKey,candidateSenses,reviewState,
    queue:options=>buildRows(options||{}),ambiguous:()=>buildRows({ambiguousOnly:true}),find:findRow,validateSelection,buildMembershipPatch,
    summary(){const q=buildRows();return {entries:q.length,withTargetHint:q.filter(x=>x.targetSenseZh).length,needsCandidateSelection:q.filter(x=>x.reviewState==='needs_candidate_selection').length,explicitNeedsReview:q.filter(x=>x.reviewState==='explicit_binding_needs_review').length,unresolved:q.filter(x=>x.reviewState==='unresolved').length,singleCandidateNeedsReview:q.filter(x=>x.reviewState==='single_candidate_needs_review').length}},
    export(){return {schema:'pai-word-scene500-sense-review-v2',generatedAt:new Date().toISOString(),note:'QA-only candidate review. Single-candidate rows are not auto-approved. No row is Sense-reviewed until an explicit selected KU is written to membership with senseBindingReviewed=true.',summary:this.summary(),rows:buildRows()}}
  };
})();
