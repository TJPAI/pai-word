import {createHash} from 'node:crypto';
import fs from 'node:fs';
const id=t=>'zh_'+createHash('sha256').update(t,'utf8').digest('hex').slice(0,20);
const allowed=new Set(['LEXICALIZED','COMPOSITIONAL','DOMAIN_TERM','UNCERTAIN']);
export function certifyDualAI(chatgpt,muse,{sampleRate=0.1}={}){
 const errors=[],output=[],seen=new Set();
 if(!Array.isArray(chatgpt)||!Array.isArray(muse)||!chatgpt.length) return {ok:false,errors:['MISSING_INDEPENDENT_REVIEWS'],rows:[]};
 const other=new Map();
 for(const m of muse){
  if(other.has(m.term_id))errors.push('DUPLICATE_MUSE:'+m.term_id);
  other.set(m.term_id,m);
 }
 for(const a of chatgpt){
  if(seen.has(a.term_id))errors.push('DUPLICATE_CHATGPT:'+a.term_id);
  seen.add(a.term_id);
  const b=other.get(a.term_id);
  if(!a.term||id(a.term)!==a.term_id)errors.push('IDENTITY_CHATGPT:'+a.term_id);
  if(!b||b.term!==a.term||id(b.term)!==b.term_id)errors.push('MISSING_OR_INVALID_MUSE:'+a.term_id);
  for(const [who,r] of [['CHATGPT',a],['MUSE',b]]){
   if(r&&!allowed.has(r.verdict))errors.push('INVALID_VERDICT_'+who+':'+a.term_id);
   if(r&&(!r.review_id||!r.reason||!r.model_run_id))errors.push('INCOMPLETE_'+who+':'+a.term_id);
  }
  if(a.model_run_id&&b?.model_run_id&&a.model_run_id===b.model_run_id)errors.push('NONINDEPENDENT_RUN:'+a.term_id);
  if(b&&!b.independent_review)errors.push('MUSE_INDEPENDENCE_NOT_DECLARED:'+a.term_id);
  if(a.independent_review!==true)errors.push('CHATGPT_INDEPENDENCE_NOT_DECLARED:'+a.term_id);
  const valid=!!b&&allowed.has(a.verdict)&&allowed.has(b.verdict)&&a.verdict===b.verdict&&a.verdict!=='UNCERTAIN'&&a.independent_review===true&&b.independent_review===true&&a.model_run_id!==b.model_run_id&&!!a.reason&&!!b.reason&&!!a.review_id&&!!b.review_id;
  const status=valid?'DUAL_AI_VERIFIED':!b?'MUSE_PENDING':a.verdict!==b.verdict?'DISPUTED':'REVIEW_PENDING';
  output.push({term:a.term,term_id:a.term_id,status,verdict:valid?a.verdict:null,chatgpt_review_id:a.review_id,muse_review_id:b?.review_id??null,requires_external_evidence:valid&&['DOMAIN_TERM'].includes(a.verdict),release_approved:false});
 }
 if(other.size!==seen.size||[...other.keys()].some(k=>!seen.has(k)))errors.push('REVIEW_SET_MISMATCH');
 const verified=output.filter(x=>x.status==='DUAL_AI_VERIFIED');
 const spotcheck=Math.ceil(verified.length*sampleRate);
 return {ok:errors.length===0,errors,counts:{total:output.length,dual_ai_verified:verified.length,disputed:output.filter(x=>x.status==='DISPUTED').length,pending:output.filter(x=>x.status.includes('PENDING')).length,mandatory_spotcheck:spotcheck},rows:output};
}
if(process.argv[1]?.endsWith('certify-dual-ai.mjs')){
 const [a,b]=process.argv.slice(2);
 if(!a||!b)throw Error('Usage: node certify-dual-ai.mjs chatgpt.json muse.json');
 const r=certifyDualAI(JSON.parse(fs.readFileSync(a)),JSON.parse(fs.readFileSync(b)));
 console.log(JSON.stringify(r,null,2));if(!r.ok)process.exitCode=1;
}
