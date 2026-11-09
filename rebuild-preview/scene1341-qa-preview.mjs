/* Read-only QA annotations for Scene1341 author-draft previews.
 * Not an allowlist. QA status is a reviewer opinion and never release consent.
 */
const KU=/^SC1341-KU-\d{5,}$/;
export function attachScene1341QaPreviewStatus(items,ledger){
 if(ledger?.schema!=='scene1341-answer-only-qa-status-staging-v1'||
    ledger?.release_eligible!==false||
    ledger?.counts?.release_approved!==0||
    !Array.isArray(ledger.flags))throw Error('SCENE1341_QA_LEDGER_INVALID');
 const counts=ledger.counts;
 if((counts.cg_pass||0)+(counts.cg_conditional||0)+(counts.cg_revise||0)!==items.length||
    counts.mu_review_not_verified+counts.two_review_pass_agreed+
      counts.two_review_revise_agreed+counts.two_review_dispute!==items.length)
    throw Error('SCENE1341_QA_LEDGER_COUNT_MISMATCH');
 const ids=new Map(items.map(x=>[x.id,x]));
 if(ids.size!==items.length)throw Error('SCENE1341_QA_DUPLICATE_KU');
 const flagged=new Map();
 for(const f of ledger.flags){
  if(!KU.test(f.ku_id||'')||flagged.has(f.ku_id)||!ids.has(f.ku_id))
    throw Error('SCENE1341_QA_UNKNOWN_OR_DUPLICATE_FLAG');
  const item=ids.get(f.ku_id);
  if(item.sceneId!==f.scene_id||item.rank!==f.rank||
     !['CONDITIONAL','REVISE','PASS'].includes(f.cg_qa))
    throw Error('SCENE1341_QA_IDENTITY_MISMATCH');
  flagged.set(f.ku_id,f);
 }
 if(flagged.size!==counts.cg_conditional+counts.cg_revise)
   throw Error('SCENE1341_QA_FLAG_COUNT_MISMATCH');
 return Object.freeze(items.map(item=>{
  const flag=flagged.get(item.id);
  return Object.freeze({...item,qaPreview:Object.freeze({
   cgVerdict:flag?.cg_qa||'PASS',
   needsReview:Boolean(flag),
   issue:flag?.issue||'',
   dispute:flag?.semantic_status==='TWO_REVIEW_DISPUTE',
   releaseEligible:false
  })});
 }));
}
