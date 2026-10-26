#!/usr/bin/env node
// Read-only QA: verify an errata file is identity-anchored and does not silently mutate candidate batches.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const [runtimePath, firstPath, secondPath, errataPath] = [
  process.argv[2] ?? 'scene500-recommendation/zh-core20k-v0101-scene500-runtime.json',
  process.argv[3] ?? 'tools/chinese-core20k/pos/zh-core20k-pos-editorial-batch01-20261026.json',
  process.argv[4] ?? 'tools/chinese-core20k/pos/zh-core20k-pos-editorial-batch02-20261026.json',
  process.argv[5] ?? 'tools/chinese-core20k/pos/zh-pos-batch01-02-targeted-errata-20261026.json'];
const read=p=>JSON.parse(readFileSync(resolve(p),'utf8'));
const assert=(v,m)=>{if(!v)throw Error(m)};
const raw=readFileSync(resolve(runtimePath));const sha=createHash('sha256').update(raw).digest('hex');
const runtime=JSON.parse(raw.toString('utf8'));const originals=[read(firstPath),read(secondPath)];const edits=read(errataPath);
assert(runtime.terms.length===20000 && sha==='18adea58a3615935c1b632c22934a91855171063862f7471999f9900415e8093','INVALID_RUNTIME');
assert(edits.source_runtime_sha256===sha && edits.rows.length===15,'ERRATA_SCOPE_OR_SOURCE');
assert(edits.release.production_ready===false && edits.release.runtime_mutated===false && edits.release.term_ids_mutated===false,'UNSAFE_PUBLICATION');
const byId=new Map();for(const batch of originals){assert(batch.production_ready===false && batch.runtime_mutated===false,'BAD_CANDIDATE_STATUS');for(const row of batch.rows){assert(!byId.has(row.term_id),'DUPLICATE_BATCH_ID');byId.set(row.term_id,row)}}
assert(byId.size===174,'ORIGINAL_COUNT');let removalCount=0;const seen=new Set();
for(const e of edits.rows){
 assert(!seen.has(e.term_id),'ERRATA_DUPLICATE');seen.add(e.term_id);
 const old=byId.get(e.term_id);assert(old && old.term===e.term && old.runtime_index===e.runtime_index,'ERRATA_IDENTITY_MISMATCH '+e.term);
 const t=runtime.terms[e.runtime_index-1];assert(t?.term_id===e.term_id && t?.term===e.term,'RUNTIME_IDENTITY_MISMATCH '+e.term);
 assert(e.old_primary===old.primary_pos_candidate && JSON.stringify(e.old_secondary)===JSON.stringify(old.other_pos_candidates),'ERRATA_OLD_VALUES_MISMATCH '+e.term);
 assert(e.proposed_primary===old.primary_pos_candidate,'UNREVIEWED_PRIMARY_CHANGE '+e.term);
 const good=new Set(Object.keys(originals.find(b=>b.rows.some(r=>r.term_id===e.term_id)).label_set));
 assert(e.proposed_secondary.every(p=>good.has(p) && p!==e.proposed_primary),'INVALID_NEW_POS '+e.term);
 assert(e.proposed_secondary.every(p=>old.other_pos_candidates.includes(p)),'UNJUSTIFIED_NEW_SECONDARY_POS '+e.term);
 assert(typeof e.linguistic_rationale_zh==='string' && e.linguistic_rationale_zh.length>=12,'INSUFFICIENT_RATIONALE '+e.term);
 assert(e.status==='CG_ZH_TARGETED_SEMANTIC_ERRATUM_NOT_CERTIFIED','MISLEADING_CERTIFICATION_STATUS');
 if(e.issue_type==='REMOVE_UNSUPPORTED_SECONDARY'){assert(e.proposed_secondary.length<old.other_pos_candidates.length,'REMOVAL_NOT_APPLIED '+e.term);removalCount++}
}
assert(removalCount===9 && edits.counts.proposed_secondary_removals===9,'REMOVAL_COUNT_MISMATCH');
console.log(JSON.stringify({status:'PASS',runtime_sha256:sha,original_rows:byId.size,errata_rows:seen.size,secondary_removal_rows:removalCount,production_mutation:false}));
