/* Scene1341 Phase-1 CG-QA review stage gate.
 * NEVER trust a QA label or self-declared review embedded by an author.
 * Only a separately fetched, commit-pinned CG-QA review register qualifies.
 */
const HASH64=/^[a-f0-9]{64}$/;
const HASH40=/^[a-f0-9]{40}$/;
const RECORD=/^SC1341-FINAL-SRC-[a-f0-9]{32}$/;
const VERDICTS=new Set(['PASS','CONDITIONAL','REVISE','HOLD']);
const ELIGIBLE=new Set(['SC50-0001','SC50-0002','SC50-0003','SC50-0004','SC50-0005']);
const qaRepo='https://raw.githubusercontent.com/TJPAI/pai-word/';
const qaBranch='cg-qa-enlex-review-20261026';
const fail=reason=>{throw Error('SC1341_QA_STAGE_'+reason)};
export function createTrustedFirstReviewIndex(report,{commit}={}){
 if(!HASH40.test(commit||'')||!report||report.schema!=='scene1341-phase1-independent-first-review/v1'||
    report.reviewer!=='CG-QA'||report.formal_ready!==0||report.srs_eligible!==false||
    !Array.isArray(report.reviews))fail('REPORT');
 // The independent report itself is pinned by commit. Evidence commits may
 // predate that report; demanding equality creates an impossible self-hash.
 const index=new Map();
 for(const proof of report.reviews){
  if(!RECORD.test(proof?.record_id||'')||!ELIGIBLE.has(proof.scene_id)||
     !HASH64.test(proof.content_sha256||'')||!VERDICTS.has(proof.verdict)||
     proof.reviewer!=='CG-QA'||!/^20\d\d-\d\d-\d\d/.test(proof.reviewed_at||'')||
     typeof proof.evidence_path!=='string'||!/^tools\//.test(proof.evidence_path)||
     !HASH40.test(proof.evidence_commit||''))fail('PROOF');
  const key=proof.record_id+':'+proof.content_sha256;
  if(index.has(key))fail('DUPLICATE');
  index.set(key,Object.freeze({...proof}));
 }
 return index;
}
export async function fetchIndependentFirstReviews({fetchImpl=fetch}={}){
 const branchResponse=await fetchImpl('https://api.github.com/repos/TJPAI/pai-word/branches/'+qaBranch,
  {cache:'no-store',headers:{Accept:'application/vnd.github+json'}});
 if(!branchResponse.ok)fail('BRANCH_HTTP_'+branchResponse.status);
 const branch=await branchResponse.json();
 const commit=branch?.commit?.sha;
 if(!HASH40.test(commit||''))fail('COMMIT');
 const path='tools/core20k_lexicon/qa/SC1341_PHASE1_INDEPENDENT_FIRST_REVIEW.json';
 const response=await fetchImpl(qaRepo+commit+'/'+path,{cache:'no-store'});
 if(!response.ok)fail('REPORT_HTTP_'+response.status);
 const report=await response.json();
 return Object.freeze({commit,index:createTrustedFirstReviewIndex(report,{commit})});
}
export function resolveFirstReviewLabel(card,trustedReviews){
 if(!ELIGIBLE.has(card?.scene_id))return Object.freeze({visible:false,label:'',verdict:null,reviewed:false});
 const recordId=card.master_record_id;
 const contentSha=card.master_content_sha256;
 // An embedded author-provided qa_first_review is deliberately ignored.
 const proof=trustedReviews instanceof Map&&RECORD.test(recordId||'')&&
   HASH64.test(contentSha||'')?trustedReviews.get(recordId+':'+contentSha):null;
 const valid=Boolean(proof&&proof.scene_id===card.scene_id&&
   proof.content_sha256===contentSha&&proof.record_id===recordId&&
   proof.reviewer==='CG-QA'&&VERDICTS.has(proof.verdict));
 return Object.freeze({visible:true,label:valid?'1审':'待审',
  verdict:valid?proof.verdict:null,reviewed:valid});
}
