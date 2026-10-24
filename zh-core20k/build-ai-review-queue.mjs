// Generate reproducible row-level review from the original V0.10.12 JSONL and frozen runtime.
// node zh-core20k/build-ai-review-queue.mjs runtime.json queue.jsonl [limit=200]
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
export function buildReview(runtime, lines, limit=200){
 const index=new Map(runtime.terms.map(t=>[t.term_id,t]));
 const rows=lines.filter(Boolean).slice(0,limit).map((line,i)=>{
  const r=typeof line==='string'?JSON.parse(line):line;
  const t=index.get(r.term_id);
  const identity_valid=!!(t&&t.term===r.term&&r.term_id==='zh_'+sha(Buffer.from(r.term,'utf8')).slice(0,20));
  return {queue_row:i+1,term_id:r.term_id,term:r.term,triage_score:r.triage_score,structural_signals:r.signals,identity_valid,evidence_status:'NOT_ATTACHED',linguistic_disposition:'PENDING_INDEPENDENT_REVIEW',membership_action:'NONE'};
 });
 if(rows.some(x=>!x.identity_valid)||new Set(rows.map(x=>x.term_id)).size!==rows.length)throw Error('QUEUE_IDENTITY_INVALID');
 return {schema:'zh-core20k-ai-review-queue-v1',counts:{rows:rows.length,identity_failures:0,external_evidence_attached:0},rows};
}
if(process.argv[1]?.endsWith('build-ai-review-queue.mjs')){
 const [runtimeFile,queueFile,max='200']=process.argv.slice(2);
 if(!runtimeFile||!queueFile)throw Error('Usage: node build-ai-review-queue.mjs runtime.json queue.jsonl [limit]');
 const bytes=fs.readFileSync(runtimeFile);
 const obj=buildReview(JSON.parse(bytes.toString()),fs.readFileSync(queueFile,'utf8').trim().split(/\r?\n/),Number(max));
 obj.runtime_sha256=sha(bytes);
 console.log(JSON.stringify(obj,null,2));
}
