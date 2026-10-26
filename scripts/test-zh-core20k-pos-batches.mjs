#!/usr/bin/env node
// Node-only, read-only QA for the fixed-source, nonproduction Chinese POS editorial batches.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const hash=b=>createHash('sha256').update(b).digest('hex');
const assert=(v,s)=>{if(!v)throw Error(s)};
const runtimePath=resolve(process.argv[2]??'scene500-recommendation/zh-core20k-v0101-scene500-runtime.json');
const overlayPaths=(process.argv.slice(3).length?process.argv.slice(3):[
 'tools/chinese-core20k/pos/zh-core20k-pos-editorial-batch01-20261026.json',
 'tools/chinese-core20k/pos/zh-core20k-pos-editorial-batch02-20261026.json']);
const bytes=readFileSync(runtimePath),runtime=JSON.parse(bytes.toString('utf8'));
const sha=hash(bytes); assert(sha==='18adea58a3615935c1b632c22934a91855171063862f7471999f9900415e8093','RUNTIME_HASH_DRIFT');
assert(runtime.terms?.length===20000,'RUNTIME_SIZE');
const byText=new Map(runtime.terms.map((t,i)=>[t.term,{...t,index:i+1}]));
assert(byText.size===20000,'RUNTIME_TERMS_NOT_UNIQUE');
const all=new Set();const results=[];
for(const file of overlayPaths){
 const d=JSON.parse(readFileSync(resolve(file),'utf8'));
 assert(d.schema==='pai-word-zh-core20k-pos-editorial-batch-v1','BAD_OVERLAY_SCHEMA');
 assert(d.source_runtime_sha256===sha && d.source_data_version===runtime.data_version,'SOURCE_VERSION_MISMATCH');
 assert(d.contract_version===runtime.contract_version,'CONTRACT_VERSION_MISMATCH');
 assert(d.status==='EDITORIAL_PROPOSAL_UNCERTIFIED' && d.production_ready===false && d.runtime_mutated===false,'INVALID_PUBLICATION_FLAGS');
 assert(d.selection_count===d.rows.length,'COUNT_MISMATCH');
 const accepted=new Set(Object.keys(d.label_set));let ambiguous=0;
 for(const r of d.rows){
  const source=byText.get(r.term);
  assert(source && source.term_id===r.term_id && source.index===r.runtime_index,'RUNTIME_IDENTITY_MISMATCH '+r.term);
  assert('zh_'+hash(Buffer.from(r.term)).slice(0,20)===r.term_id,'TERM_HASH_MISMATCH '+r.term);
  assert(source.pos===null && r.source_pos===null,'FORMAL_POS_ALREADY_PRESENT '+r.term);
  assert(!all.has(r.term_id),'CROSS_BATCH_DUPLICATE '+r.term);all.add(r.term_id);
  assert(accepted.has(r.primary_pos_candidate),'INVALID_POS '+r.term);
  assert(Array.isArray(r.other_pos_candidates) && new Set(r.other_pos_candidates).size===r.other_pos_candidates.length && r.other_pos_candidates.every(t=>accepted.has(t)&&t!==r.primary_pos_candidate),'INVALID_SECONDARY_POS '+r.term);
  assert(typeof r.reason_zh==='string' && r.reason_zh.length>=6,'EMPTY_REASON '+r.term);
  assert(['HIGH','MEDIUM'].includes(r.certainty) && r.status==='AI_EDITORIAL_PROPOSAL_NOT_CERTIFIED','INVALID_REVIEW_STATUS '+r.term);
  if(r.other_pos_candidates.length)ambiguous++;
 }
 results.push({file,rows:d.rows.length,multi_pos:ambiguous});
}
console.log(JSON.stringify({status:'PASS',source_sha256:sha,term_count:runtime.terms.length,reviewed_distinct:all.size,batches:results,runtime_mutated:false}));
