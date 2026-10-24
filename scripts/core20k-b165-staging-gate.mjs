#!/usr/bin/env node
// Read-only QA gate for unverified Core20K teaching candidates.
import {readFileSync} from 'node:fs';
const input=process.argv[2];
if(!input){console.error('Usage: node scripts/core20k-b165-staging-gate.mjs path/to/staging.jsonl');process.exit(2)}
const rows=readFileSync(input,'utf8').split(/\r?\n/).filter(Boolean).map((line,i)=>{try{return JSON.parse(line)}catch(e){throw Error('Invalid JSON line '+(i+1)+': '+e.message)}});
const seen=new Set(),errors=[],flags={};
for(const [i,r] of rows.entries()){
 const key=r.ku_id||'row-'+(i+1);
 const err=code=>errors.push({ku_id:key,code});
 if(!r.ku_id||!r.sense_id||!r.headword_id||!r.headword)err('MISSING_IDENTITY');
 if(seen.has(r.ku_id))err('DUPLICATE_KU_ID');seen.add(r.ku_id);
 if(r.test_only!==true||r.release_eligible!==false||r.srs_write_allowed!==false)err('UNSAFE_RELEASE_FIELDS');
 if(r.semantic_certification!=='PENDING_INDEPENDENT_REVIEW')err('UNEXPECTED_CERTIFICATION');
 if(r.playable!==false)err('UNAUTHORIZED_PLAYABLE');
 const q=r.question||{},a=r.response?.canonical_answer;
 if(r.render_kind==='cloze'){
  if(typeof q.text!=='string'||q.text.split('___').length!==2)err('CLOZE_SINGLE_BLANK_REQUIRED');
  if(typeof a!=='string'||!a.trim()||q.text.replace('___',a)!==q.context_en)err('CLOZE_RECONSTRUCTION');
  if(typeof a==='string'&&a.length>=3&&q.text.includes(a))err('POSSIBLE_ANSWER_LEAKAGE');
 }
 if(r.rank==null||r.us_ipa==null)err('UNRESOLVED_AUTHORITY_FIELDS');
 for(const f of r.review_flags||[])flags[f]=(flags[f]||0)+1;
}
const blockers=errors.filter(x=>x.code!=='UNRESOLVED_AUTHORITY_FIELDS');
console.log(JSON.stringify({rows:rows.length,unique_ku:seen.size,blockers:blockers.length,authority_unresolved:errors.length-blockers.length,flag_instances:Object.values(flags).reduce((a,b)=>a+b,0),flags,blocker_samples:blockers.slice(0,15),semantic_verified:0,release_eligible:0},null,2));
process.exitCode=blockers.length?1:0;
