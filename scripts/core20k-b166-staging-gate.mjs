#!/usr/bin/env node
// Read-only fail-closed QA. Never grants semantic certification.
import {readFileSync} from 'node:fs';
const path=process.argv[2];
if(!path){console.error('Usage: node scripts/core20k-b166-staging-gate.mjs candidates.jsonl');process.exit(2)}
const rows=readFileSync(path,'utf8').split(/\r?\n/).filter(Boolean).map((s,i)=>{try{return JSON.parse(s)}catch(e){throw Error('JSON line '+(i+1)+': '+e.message)}});
const seen=new Set(),errors=[],flags={},unresolved={rank:0,us_ipa:0,answer_variants:0};
for(const [i,r] of rows.entries()){
 const id=r.ku_id||'row:'+String(i+1),err=code=>errors.push({ku_id:id,code});
 if(!r.ku_id||!r.sense_id||!r.headword_id||!r.headword)err('MISSING_IDENTITY');
 if(seen.has(r.ku_id))err('DUPLICATE_KU_ID');seen.add(r.ku_id);
 if(r.test_only!==true||r.release_eligible!==false||r.srs_write_allowed!==false||r.playable!==false)err('UNSAFE_STAGING_FLAGS');
 if(r.semantic_certification!=='PENDING_INDEPENDENT_REVIEW')err('UNEXPECTED_CERTIFICATION');
 if(r.rank==null)unresolved.rank++;
 if(!r.us_ipa)unresolved.us_ipa++;
 if(r.response?.variant_review_status!=='REVIEWED')unresolved.answer_variants++;
 if(r.render_kind==='cloze'){
  const q=r.question?.text,context=r.question?.context_en,answer=r.response?.canonical_answer;
  if(typeof q!=='string'||q.split('___').length!==2)err('CLOZE_BLANK_COUNT');
  if(typeof answer!=='string'||!answer.trim()||typeof q!=='string'||q.replace('___',answer)!==context)err('CLOZE_RECONSTRUCTION');
  if(typeof answer==='string'&&answer.length>=3&&typeof q==='string'){
    // Match complete answers, not substrings of longer words.
    const toks=q.toLocaleLowerCase().match(/[\p{L}]+/gu)||[];
    if(toks.includes(answer.toLocaleLowerCase()))err('ANSWER_LEAKAGE');
  }
 }
 for(const f of r.review_flags||[])flags[f]=(flags[f]||0)+1;
}
console.log(JSON.stringify({rows:rows.length,unique_ku:seen.size,blockers:errors.length,unresolved,flag_instances:Object.values(flags).reduce((a,b)=>a+b,0),flags,errors:errors.slice(0,30),semantic_certified:0,release_eligible:0},null,2));
process.exitCode=errors.length?1:0;
