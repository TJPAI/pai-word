// Deterministic safety gate for AI triage queues.
// AI may rank or explain, but cannot approve deletion, replacement, frequency or identity changes.
import {createHash} from 'node:crypto';
export function auditTriageQueue(rows, runtime, {protectedTerms=[]}={}) {
 const byId=new Map((runtime?.terms??[]).map(t=>[t.term_id,t]));
 const guard=new Set(protectedTerms);
 const result={rows:0,unique_ids:0,missing_ids:[],surface_mismatch:[],identity_mismatch:[],protected_high_score:[],score_histogram:{},pending_external_evidence:0};
 const seen=new Set();
 for(const row of rows){
  result.rows++;
  if(seen.has(row.term_id))throw Error('DUPLICATE_QUEUE_ID:'+row.term_id);
  seen.add(row.term_id);
  const t=byId.get(row.term_id);
  if(!t){result.missing_ids.push(row.term_id);continue;}
  if(t.term!==row.term)result.surface_mismatch.push(row.term_id);
  const expected='zh_'+createHash('sha256').update(t.term,'utf8').digest('hex').slice(0,20);
  if(row.term_id!==expected)result.identity_mismatch.push(row.term_id);
  const score=Number(row.triage_score);
  if(!Number.isInteger(score)||score<1||score>5)throw Error('INVALID_TRIAGE_SCORE:'+row.term_id);
  result.score_histogram[score]=(result.score_histogram[score]||0)+1;
  if(score>=4&&guard.has(row.term))result.protected_high_score.push({term_id:row.term_id,term:row.term,score});
  if(row.external_evidence==='NOT_ATTACHED')result.pending_external_evidence++;
  if(row.membership_action!=='NONE')throw Error('UNAUTHORIZED_MEMBERSHIP_ACTION:'+row.term_id);
 }
 result.unique_ids=seen.size;
 result.ok=result.missing_ids.length===0&&result.surface_mismatch.length===0&&result.identity_mismatch.length===0;
 return result;
}
