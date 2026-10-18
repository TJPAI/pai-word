// Canonical Scene500 fine-mapping review support for Core20K FINAL_FROZEN V2.0.6.
// QA/editorial tool only. It never promotes generated candidates to verified automatically.
(function(){
  const VERSION='scene500-fine-review-v1';
  const BASELINE='Core20K_LongTerm_V2.0.6';
  const SCENE_ID=/^S(?:00[1-9]|0[1-9][0-9]|[1-4][0-9]{2}|500)$/;
  const LEGACY_ID=/^cs\d+$/i;
  const VERIFIED=new Set(['source_verified','dictionary_corpus_verified']);
  const REVIEWABLE=new Set(['source_verified','dictionary_corpus_verified','editorial','generated_draft_pending_review']);
  const norm=v=>String(v||'').trim().toLowerCase();
  const core=()=>window.PAI_CORE;
  const source=()=>window.PAI_SCENE500_FINE_MEMBERSHIP||{baselineId:BASELINE,scenes:{}};

  function senseUnitsForLemma(lemma){
    const out=[];
    for(const w of (core()?.byLemma?.get(norm(lemma))||[])){
      for(const [kuId,s] of Object.entries(w.s||{})){
        if(String(s?.kuType||'sense').toLowerCase()!=='sense')continue;
        out.push({
          wordId:String(w.id||w.wordId||w.rank||''),coreRank:Number(w.rank)||null,lemma:w.w||lemma,
          senseId:String(s.senseId||s.id||kuId),kuId:String(kuId),pos:s.pos||w.pos||'',meaningZh:s.m||s.meaningZh||'',
          title:s.kuTitle||'',evidenceStatus:s.evidenceStatus||s.status||null
        });
      }
    }
    return out.sort((a,b)=>(a.coreRank||999999)-(b.coreRank||999999)||a.kuId.localeCompare(b.kuId));
  }

  function validateSceneId(sceneId){
    if(LEGACY_ID.test(String(sceneId||'')))return {ok:false,reason:'legacy_composed_scene_id_forbidden'};
    return SCENE_ID.test(String(sceneId||''))?{ok:true}:{ok:false,reason:'invalid_scene500_id'};
  }

  function candidateRows({sceneId=null,includeReviewed=false,ambiguousOnly=false}={}){
    const rows=[];
    for(const [sid,scene] of Object.entries(source().scenes||{})){
      if(sceneId&&sid!==sceneId)continue;
      const sceneCheck=validateSceneId(sid);
      for(const raw of (scene?.entries||[])){
        const lemma=norm(raw?.lemma);if(!lemma)continue;
        const candidates=senseUnitsForLemma(lemma);
        const reviewed=raw?.review_status==='verified'||raw?.review_status==='reviewed';
        if(!includeReviewed&&reviewed)continue;
        if(ambiguousOnly&&candidates.length<=1)continue;
        rows.push({
          key:`${sid}:${lemma}`,sceneId:sid,sceneValid:sceneCheck.ok,sceneError:sceneCheck.ok?null:sceneCheck.reason,
          lemma,wordId:raw?.word_id||null,currentSenseId:raw?.sense_id||null,currentKuIds:Array.isArray(raw?.ku_ids)?raw.ku_ids:[],
          relevanceScore:Number.isFinite(Number(raw?.relevance_score))?Number(raw.relevance_score):null,
          sceneRank:Number.isInteger(Number(raw?.scene_rank))?Number(raw.scene_rank):null,
          evidenceStatus:raw?.evidence_status||'generated_draft_pending_review',reviewStatus:raw?.review_status||'pending',
          bindingMethod:raw?.binding_method||'generated_candidate',candidateCount:candidates.length,candidates
        });
      }
    }
    return rows.sort((a,b)=>a.sceneId.localeCompare(b.sceneId)||(a.sceneRank||999999)-(b.sceneRank||999999)||a.lemma.localeCompare(b.lemma));
  }

  function validateEntry(sceneId,entry){
    const errors=[],sid=validateSceneId(sceneId);
    if(!sid.ok)errors.push(sid.reason);
    if(!entry||typeof entry!=='object')return ['entry_not_object'];
    if(!norm(entry.lemma))errors.push('lemma_required');
    if(entry.relevance_score!==undefined&&!(Number(entry.relevance_score)>=0&&Number(entry.relevance_score)<=1))errors.push('invalid_relevance_score');
    if(entry.scene_rank!==undefined&&!(Number.isInteger(Number(entry.scene_rank))&&Number(entry.scene_rank)>0))errors.push('invalid_scene_rank');
    if(entry.evidence_status&&!REVIEWABLE.has(entry.evidence_status))errors.push('invalid_evidence_status');
    if(entry.review_status==='verified'&&!VERIFIED.has(entry.evidence_status))errors.push('verified_requires_external_evidence');
    if(entry.binding_method==='generated_candidate'&&entry.review_status==='verified')errors.push('generated_candidate_cannot_be_verified');
    if(entry.review_status==='verified'&&!entry.sense_id)errors.push('verified_requires_real_sense_id');
    return errors;
  }

  function audit(){
    const qa={baselineMismatch:false,sceneCount:0,entryCount:0,legacySceneIds:[],invalidSceneIds:[],invalidEntries:[],duplicateSceneSense:[],headwordOnlyBindings:[],generatedVerifiedContradictions:[],verifiedCount:0,pendingCount:0};
    qa.baselineMismatch=!!source().baselineId&&source().baselineId!==BASELINE;
    const seen=new Set();
    for(const [sid,scene] of Object.entries(source().scenes||{})){
      qa.sceneCount++;
      const check=validateSceneId(sid);
      if(!check.ok)(check.reason==='legacy_composed_scene_id_forbidden'?qa.legacySceneIds:qa.invalidSceneIds).push(sid);
      for(const entry of (scene?.entries||[])){
        qa.entryCount++;
        const errs=validateEntry(sid,entry);if(errs.length)qa.invalidEntries.push({sceneId:sid,lemma:entry?.lemma||'',errors:errs});
        const key=entry?.sense_id?`${sid}:${entry.sense_id}`:null;if(key){if(seen.has(key))qa.duplicateSceneSense.push(key);seen.add(key)}
        if(!entry?.sense_id)qa.headwordOnlyBindings.push(`${sid}:${norm(entry?.lemma)}`);
        if(entry?.binding_method==='generated_candidate'&&entry?.review_status==='verified')qa.generatedVerifiedContradictions.push(`${sid}:${norm(entry?.lemma)}`);
        if(entry?.review_status==='verified')qa.verifiedCount++;else qa.pendingCount++;
      }
    }
    qa.pass=!qa.baselineMismatch&&!qa.legacySceneIds.length&&!qa.invalidSceneIds.length&&!qa.invalidEntries.length&&!qa.duplicateSceneSense.length&&!qa.generatedVerifiedContradictions.length;
    return qa;
  }

  function buildPatch(selections,{reviewedBy='editorial_review',reviewedAt=new Date().toISOString()}={}){
    const patches=[],errors=[];
    for(const [key,selection] of Object.entries(selections||{})){
      const cut=key.indexOf(':'),sceneId=key.slice(0,cut),lemma=norm(key.slice(cut+1));
      const candidates=senseUnitsForLemma(lemma),candidate=candidates.find(x=>x.senseId===selection?.senseId||x.kuId===selection?.kuId);
      if(!validateSceneId(sceneId).ok){errors.push({key,reason:'invalid_scene_id'});continue}
      if(!candidate){errors.push({key,reason:'selected_sense_not_in_core_candidates'});continue}
      const evidenceStatus=selection?.evidenceStatus||'editorial';
      const reviewStatus=selection?.reviewStatus||'reviewed';
      if(reviewStatus==='verified'&&!VERIFIED.has(evidenceStatus)){errors.push({key,reason:'verified_requires_external_evidence'});continue}
      patches.push({scene_id:sceneId,word_id:candidate.wordId,sense_id:candidate.senseId,ku_ids:[candidate.kuId],lemma,
        relevance_score:Number(selection?.relevanceScore),scene_rank:Number(selection?.sceneRank),evidence_status:evidenceStatus,
        review_status:reviewStatus,binding_method:selection?.bindingMethod||'manual_review',reviewed_by:reviewedBy,reviewed_at:reviewedAt});
    }
    return {schema:'pai-word-scene500-fine-patch-v1',baselineId:BASELINE,mutationApplied:false,patches,errors};
  }

  window.PAI_SCENE500_FINE_REVIEW={version:VERSION,baselineId:BASELINE,validateSceneId,senseUnitsForLemma,queue:candidateRows,ambiguous:()=>candidateRows({ambiguousOnly:true}),validateEntry,audit,buildPatch};
})();
