/* Scene1341 five-scene CG-QA stage gate. Review stage is NOT verdict. */
const HASH64=/^[a-f0-9]{64}$/;
const HASH40=/^[a-f0-9]{40}$/;
const VERDICTS=new Set(['PASS','CONDITIONAL','REVISE','HOLD']);
const ELIGIBLE=new Set(['SC50-0001','SC50-0002','SC50-0003','SC50-0004','SC50-0005']);
export function resolveFirstReviewLabel(card){
 if(!ELIGIBLE.has(card?.scene_id))return Object.freeze({visible:false,label:'',verdict:null,reviewed:false});
 const recordId=card.master_record_id;
 const contentSha=card.master_content_sha256;
 const proof=card.qa_first_review;
 // Never trust a bare supplied label or old review on another content revision.
 const valid=typeof recordId==='string'&&/^SC1341-FINAL-SRC-[a-f0-9]{32}$/.test(recordId)&&
   HASH64.test(contentSha||'')&&proof?.reviewer==='CG-QA'&&
   proof.record_id===recordId&&proof.content_sha256===contentSha&&
   HASH40.test(proof.evidence_commit||'')&&
   typeof proof.evidence_path==='string'&&proof.evidence_path.length>3&&
   /^20\d\d-\d\d-\d\d/.test(proof.reviewed_at||'')&&
   VERDICTS.has(proof.verdict);
 return Object.freeze({visible:true,label:valid?'1审':'待审',
  verdict:valid?proof.verdict:null,reviewed:Boolean(valid)});
}
