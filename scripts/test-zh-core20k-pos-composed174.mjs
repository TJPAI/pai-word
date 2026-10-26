#!/usr/bin/env node
// Verify a composed, nonproduction POS overlay exactly equals source batches + locked errata.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root='tools/chinese-core20k/pos/';
const read=(p)=>JSON.parse(readFileSync(p,'utf8'));
const one=read(root+'zh-core20k-pos-editorial-batch01-20261026.json');
const two=read(root+'zh-core20k-pos-editorial-batch02-20261026.json');
const fixes=read(root+'zh-pos-batch01-02-targeted-errata-20261026.json');
const composed=read(root+'zh-core20k-pos-editorial-composed174-20261026.json');
const assert=(x,m)=>{if(!x)throw Error(m)};
assert(composed.production_ready===false&&composed.runtime_mutated===false&&composed.status==='EDITORIAL_PROPOSAL_UNCERTIFIED','UNSAFE_ACTIVATION');
const originals=[...one.rows,...two.rows];
assert(originals.length===174&&composed.rows.length===174&&fixes.rows.length===15,'COUNT');
const sourceId=new Set(originals.map(r=>r.term_id));assert(sourceId.size===174,'SOURCE_DUP');
const changes=new Map(fixes.rows.map(r=>[r.term_id,r]));assert(changes.size===15,'ERRATA_DUP');
for(let i=0;i<originals.length;i++){
 const src=originals[i],dest=composed.rows[i],fix=changes.get(src.term_id);
 assert(src.term===dest.term&&src.term_id===dest.term_id&&src.runtime_index===dest.runtime_index,'SOURCE_IDENTITY_DRIFT '+src.term);
 const wantedPrimary=fix?.proposed_primary??src.primary_pos_candidate;
 const wantedSecondary=fix?.proposed_secondary??src.other_pos_candidates;
 assert(dest.primary_pos_candidate===wantedPrimary&&JSON.stringify(dest.other_pos_candidates)===JSON.stringify(wantedSecondary),'POS_MISMATCH '+src.term);
 if(fix){
  assert(fix.term===src.term&&fix.runtime_index===src.runtime_index&&fix.old_primary===src.primary_pos_candidate&&JSON.stringify(fix.old_secondary)===JSON.stringify(src.other_pos_candidates),'STALE_ERRATUM '+src.term);
  assert(dest.reason_zh===fix.linguistic_rationale_zh&&dest.source_reason_zh===src.reason_zh&&dest.erratum_type===fix.issue_type,'ERRATUM_EVIDENCE_MISMATCH '+src.term);
 }else{
  assert(dest.reason_zh===src.reason_zh&&!('erratum_type' in dest),'UNAUTHORIZED_CHANGE '+src.term);
 }
}
assert(composed.source_runtime_sha256===one.source_runtime_sha256&&composed.source_runtime_sha256===two.source_runtime_sha256&&composed.source_runtime_sha256===fixes.source_runtime_sha256,'RUNTIME_SHA_MISMATCH');
const hash=(content)=>createHash('sha1').update(content).digest('hex');
for(const item of composed.source_git_blobs){
 const b=readFileSync(item.path);
 // Git blob SHA is SHA1 over "blob <length>\0" + bytes
 const h=createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+'\0'),b])).digest('hex');
 assert(h===item.sha,'SOURCE_BLOB_DRIFT '+item.path);
}
console.log(JSON.stringify({status:'PASS',composed:174,errata_applied:15,multi_pos:composed.rows.filter(x=>x.other_pos_candidates.length).length,production_ready:false}));
