// Batch77: evidence receipt gate; unreviewed flags alone never certify a KU.
const REQUIRED=['source_claim_reviewed','sense_alignment_signed','bilingual_signed','ipa_pos_context_signed','unique_answer_signed','independent_editorial_signoff','runtime_e2e_signed'];
export function checkEvidenceReceipts(row,receipts={}){
 const missing=[];
 for(const field of REQUIRED){
  const p=receipts[field];
  if(!p||p.approved!==true||typeof p.reviewer!=='string'||!p.reviewer.trim()||
     typeof p.evidence_ref!=='string'||!p.evidence_ref.trim()||
     typeof p.reviewed_at!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(p.reviewed_at))
    missing.push(field);
 }
 if(!row?.sense_id)missing.push('sense_id');
 if(!row?.ku_id||!row?.headword_id||!Number.isInteger(row.rank))missing.push('immutable_identity');
 if(!row?.source_url)missing.push('direct_grammar_source');
 return {eligible:missing.length===0,missing};
}
export function certifyAllOrBlock(rows,receiptIndex={}){
 const ids=new Set(),accepted=[],rejected=[];
 for(const row of rows){
  if(ids.has(row.ku_id))throw Error('DUPLICATE_KU_ID:'+row.ku_id);
  ids.add(row.ku_id);
  const decision=checkEvidenceReceipts(row,receiptIndex[row.ku_id]||{});
  (decision.eligible?accepted:rejected).push({...row,certification:decision});
 }
 return {accepted,rejected};
}
