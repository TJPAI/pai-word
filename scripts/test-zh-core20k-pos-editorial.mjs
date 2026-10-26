#!/usr/bin/env node
// Read-only validation. Run after V0.10.1 materialization:
// node scripts/test-zh-core20k-pos-editorial.mjs
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const sha = b => createHash('sha256').update(b).digest('hex');
const sourcePath = process.argv[2] || 'scene500-recommendation/zh-core20k-v0101-scene500-runtime.json';
const overlayPath = process.argv[3] || 'tools/chinese-core20k/pos/zh-core20k-pos-editorial-batch01-20261026.json';
const sourceRaw=readFileSync(sourcePath), source=JSON.parse(sourceRaw.toString('utf8'));
const overlay=JSON.parse(readFileSync(overlayPath,'utf8'));
const assert = (yes, msg) => { if (!yes) throw Error(msg); };
assert(sha(sourceRaw)===overlay.source_runtime_sha256,'SOURCE_SHA_MISMATCH');
assert(source.terms.length===20000 && overlay.rows.length===57,'COUNT_MISMATCH');
assert(overlay.status==='EDITORIAL_PROPOSAL_UNCERTIFIED' && overlay.production_ready===false && overlay.runtime_mutated===false,'STATUS_INCONSISTENT');
const indexed=new Map(source.terms.map((t,i)=>[t.term,{...t, index:i+1}]));
assert(indexed.size===20000,'SOURCE_DUPLICATE_TERMS');
const categories=new Set(Object.keys(overlay.label_set));
const seen=new Set(); let ambiguous=0;
for(const row of overlay.rows){
 const t=indexed.get(row.term); assert(t,'UNKNOWN_TERM '+row.term);
 assert(t.term_id===row.term_id && t.index===row.runtime_index,'ID_OR_ORDER_MISMATCH '+row.term);
 const computed='zh_'+sha(Buffer.from(row.term,'utf8')).slice(0,20);
 assert(computed===row.term_id,'SHA_ID_MISMATCH '+row.term);
 assert(!seen.has(row.term_id),'DUPLICATE_OVERLAY_ID '+row.term);seen.add(row.term_id);
 assert(t.pos===null,'UNEXPECTED_SOURCE_POS '+row.term);
 assert(categories.has(row.primary_pos_candidate),'UNKNOWN_PRIMARY_POS '+row.term);
 assert(Array.isArray(row.other_pos_candidates) && row.other_pos_candidates.every(x=>categories.has(x)),'UNKNOWN_SECONDARY_POS '+row.term);
 assert(!row.other_pos_candidates.includes(row.primary_pos_candidate),'REPEATED_PRIMARY_POS '+row.term);
 assert(typeof row.reason_zh==='string' && row.reason_zh.length>=10,'INSUFFICIENT_REASON '+row.term);
 assert(['HIGH','MEDIUM'].includes(row.certainty),'BAD_CERTAINTY '+row.term);
 assert(row.status==='AI_EDITORIAL_PROPOSAL_NOT_CERTIFIED','STATUS_MISMATCH '+row.term);
 if(row.other_pos_candidates.length)ambiguous++;
}
assert(overlay.selection_count===seen.size,'SELECTION_COUNT_MISMATCH');
console.log(JSON.stringify({status:'PASS',source_sha256:sha(sourceRaw),rows:seen.size,with_secondary_pos:ambiguous,source_members:source.terms.length,mutation:false}));
