// Deterministic queue audit for existing Chinese Core20K evidence overlay.
// Usage: node zh-core20k/qa/audit-review-overlay.mjs runtime.json queue.jsonl overlay.json
// AI classifications are hypotheses, not independent dictionary or frequency verification.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
export const sha256=b=>createHash('sha256').update(b).digest('hex');
const ID=t=>'zh_'+sha256(Buffer.from(t,'utf8')).slice(0,20);
export function auditReviewOverlay(runtime,queue,overlay){
 const errors=[],notes=[];
 const terms=new Map((runtime?.terms??[]).map(t=>[t.term_id,t]));
 const rows=new Map();
 for(const q of queue){
  if(rows.has(q.term_id))errors.push('DUPLICATE_QUEUE_ID:'+q.term_id);
  rows.set(q.term_id,q);
  const t=terms.get(q.term_id);
  if(!t||t.term!==q.term||ID(q.term)!==q.term_id)errors.push('QUEUE_IDENTITY:'+q.term_id);
 }
 const seen=new Set(),evidenceCounts={};
 for(const item of overlay?.entries??[]){
  if(seen.has(item.term_id))errors.push('DUPLICATE_OVERLAY_ID:'+item.term_id);
  seen.add(item.term_id);
  const original=rows.get(item.term_id),t=terms.get(item.term_id);
  if(!original||!t||original.term!==item.term||t.term!==item.term||ID(item.term)!==item.term_id)errors.push('OVERLAY_IDENTITY:'+item.term_id);
  const grade=item.evidence_grade;
  if(!['AI_PRELIMINARY','CONTEXT_ONLY','COMPONENT_USAGE_ONLY','DIRECT_DICTIONARY_HEADWORD','OFFICIAL_DICTIONARY_HEADWORD','CORPUS_ATTESTED'].includes(grade))errors.push('UNSUPPORTED_GRADE:'+item.term_id);
  if(['DIRECT_DICTIONARY_HEADWORD','OFFICIAL_DICTIONARY_HEADWORD','CORPUS_ATTESTED'].includes(grade)&&!/^https:\/\//.test(item.source_url??''))errors.push('MISSING_SOURCE_URL:'+item.term_id);
  if(item.membership_action && item.membership_action!=='NONE')errors.push('FORBIDDEN_MEMBERSHIP_ACTION:'+item.term_id);
  if(item.frequency_rank!==undefined)errors.push('FORBIDDEN_FREQUENCY_MUTATION:'+item.term_id);
  evidenceCounts[grade]=(evidenceCounts[grade]??0)+1;
 }
 if(runtime?.terms?.length!==20000)errors.push('RUNTIME_SIZE');
 return {ok:errors.length===0,queue_size:queue.length,overlay_size:seen.size,evidence_counts:evidenceCounts,errors,notes};
}
if(process.argv[1]?.endsWith('audit-review-overlay.mjs')){
 const [runtimePath,queuePath,overlayPath]=process.argv.slice(2);
 if(!runtimePath||!queuePath||!overlayPath)throw Error('Usage: runtime.json queue.jsonl overlay.json');
 const rb=fs.readFileSync(runtimePath);
 const q=fs.readFileSync(queuePath,'utf8').trim().split(/\r?\n/).map(JSON.parse);
 const o=JSON.parse(fs.readFileSync(overlayPath,'utf8'));
 const result=auditReviewOverlay(JSON.parse(rb),q,o);
 result.runtime_sha256=sha256(rb);
 if(result.runtime_sha256!=='18adea58a3615935c1b632c22934a91855171063862f7471999f9900415e8093'){result.ok=false;result.errors.push('RUNTIME_SHA256');}
 console.log(JSON.stringify(result,null,2));
 if(!result.ok)process.exitCode=1;
}
