#!/usr/bin/env node
// Fail-closed QA: verify composed174 V2 is exactly composed174 V1 + six reviewed corrections.
// Run from repository root: node scripts/test-zh-core20k-pos-composed174-v2.mjs
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const dir='tools/chinese-core20k/pos/';
const paths={
 old:dir+'zh-core20k-pos-editorial-composed174-20261026.json',
 fixes:dir+'zh-pos-composed174-second-pass-six-20261026.json',
 next:dir+'zh-core20k-pos-editorial-composed174-v2-20261026.json'
};
const raw=Object.fromEntries(Object.entries(paths).map(([k,p])=>[k,readFileSync(p)]));
const parsed=Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,JSON.parse(v.toString('utf8'))]));
const gitBlob=b=>createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+'\0'),b])).digest('hex');
const assert=(x,msg)=>{if(!x)throw Error(msg)};
const {old,fixes,next}=parsed;
assert(old.rows.length===174&&next.rows.length===174&&fixes.rows.length===6,'COUNT_MISMATCH');
assert(next.source_composed_v1_git_blob===gitBlob(raw.old),'OLD_BLOB_MISMATCH');
assert(next.second_pass_git_blob===gitBlob(raw.fixes),'FIX_BLOB_MISMATCH');
assert(next.source_runtime_sha256===old.source_runtime_sha256&&next.source_runtime_sha256===fixes.source_runtime_sha256,'SOURCE_MISMATCH');
assert(next.production_ready===false&&next.runtime_mutated===false,'UNSAFE_FLAGS');
const edits=new Map(fixes.rows.map(x=>[x.term_id,x]));
assert(edits.size===6,'DUPLICATE_FIX');
let changed=0;
for(let i=0;i<174;i++){
 const a=old.rows[i],b=next.rows[i],e=edits.get(a.term_id);
 assert(a.term_id===b.term_id&&a.term===b.term&&a.runtime_index===b.runtime_index,'IDENTITY_DRIFT '+a.term);
 assert(a.primary_pos_candidate===b.primary_pos_candidate,'PRIMARY_CHANGED '+a.term);
 if(e){
  assert(e.term===a.term&&e.runtime_index===a.runtime_index&&JSON.stringify(e.previous_secondary)===JSON.stringify(a.other_pos_candidates),'STALE_FIX '+a.term);
  assert(JSON.stringify(b.other_pos_candidates)===JSON.stringify(e.proposed_secondary)&&b.reason_zh===e.linguistic_rationale_zh,'WRONG_EDIT '+a.term);
  assert(b.second_pass_issue_type===e.issue_type&&JSON.stringify(b.prior_secondaries)===JSON.stringify(e.previous_secondary),'NO_AUDIT_TRACE '+a.term);changed++;
 }else{
  assert(JSON.stringify(b)===JSON.stringify(a),'UNAUTHORIZED_EDIT '+a.term);
 }
}
assert(changed===6&&next.rows.filter(x=>x.other_pos_candidates.length).length===65,'DELTA_COUNT_MISMATCH');
console.log(JSON.stringify({status:'PASS',items:174,corrections:changed,multi_pos:65,source_runtime_unchanged:true,production_ready:false}));
