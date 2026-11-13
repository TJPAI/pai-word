#!/usr/bin/env node
// Derive independent review queues from exact Kaikki source matches; do NOT certify pronunciation.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import readline from 'node:readline';
const [outputDir,targetsFile]=process.argv.slice(2);
if(!outputDir||!targetsFile)throw Error('Usage: node build-kaikki-ipa-review-queues.mjs <candidate-outdir> <targets.json>');
const root=JSON.parse(fs.readFileSync(targetsFile,'utf8'));
const targets=root.targets;
assert(Array.isArray(targets)&&targets.length===1778);
const byId=new Map(targets.map(t=>[t.id,t]));
assert.equal(byId.size,1778);
const grouped=new Map();
const stream=fs.createReadStream(path.join(outputDir,'ipa-candidates.jsonl'),{encoding:'utf8'});
for await(const raw of readline.createInterface({input:stream,crlfDelay:Infinity})){
 if(!raw.trim())continue;
 const row=JSON.parse(raw);
 if(!byId.has(row.id))throw Error('UNKNOWN_KU');
 if(!grouped.has(row.id))grouped.set(row.id,[]);
 grouped.get(row.id).push(row);
}
assert.equal(grouped.size,1778);
const queue={native_phrase:[],native_word:[],not_found_phrase:[],not_found_word:[]};
const regions={us:0,uk:0,both:0,generic:0,other:0};
let multiple=0,multiPos=0,sourceRows=0;
for(const target of targets){
 const entries=grouped.get(target.id)||[];
 if(!entries.length)throw Error('MISSING_KU_ROW');
 const found=entries.filter(r=>r.status!=='NOT_FOUND');
 const absent=entries.filter(r=>r.status==='NOT_FOUND');
 if(found.length&&absent.length)throw Error('CONTRADICTORY_KU');
 const phrase=target.expression.trim().split(/\s+/).length>1;
 if(found.some(r=>r.pronunciation_scope!==(phrase?'phrase':'word')))throw Error('PRONUNCIATION_SCOPE_MISMATCH');
 const sourceTags=[...new Set(found.flatMap(r=>r.source_tags??[]))].sort();
 const regionTypes=[...new Set(found.map(r=>r.region))].sort();
 const forms=[...new Set(found.map(r=>r.ipa))];
 const poses=[...new Set(found.map(r=>r.part_of_speech).filter(Boolean))];
 const task={
  scene_ku_id:target.id,scene_id:target.scene_id,source_sense_id:target.source_sense_id,
  source_qa_blob:target.source_qa_blob,source_pack_blob:target.source_pack_blob,
  expression:target.expression,source_pronunciation_scope:phrase?'phrase':'word',
  candidate_count:found.length,distinct_ipa_count:forms.length,
  source_ipa_variants:forms,
  candidate_pos:poses,source_tags:sourceTags,region_categories:regionTypes,
  source_line_refs:[...new Set(found.map(r=>r.source_line))],
  ipa_qa_status:found.length?'INDEPENDENT_QA_PENDING':'NATIVE_SOURCE_IPA_NOT_FOUND',
  master_approved:false,qa_approved:false,muse_approved:false,release_allowed:false
 };
 const kind=found.length?(phrase?'native_phrase':'native_word'):(phrase?'not_found_phrase':'not_found_word');
 queue[kind].push(task);
 if(found.length){
  sourceRows+=found.length;
  if(forms.length>1)multiple++;
  if(poses.length>1)multiPos++;
  for(const reg of regionTypes)regions[reg]++;
 }
}
fs.mkdirSync(path.join(outputDir,'qa-queues'),{recursive:true});
for(const [key,rows] of Object.entries(queue))
 fs.writeFileSync(path.join(outputDir,'qa-queues',key+'.jsonl'),rows.map(r=>JSON.stringify(r)).join('\n')+'\n');
const summary={
 schema:'cg-enlex-kaikki-ipa-review-queue-v1',source:'Kaikki candidate extractor',
 source_ipa_sha256:JSON.parse(fs.readFileSync(path.join(outputDir,'manifest.json'),'utf8')).source_compressed_sha256,
 target_ku_count:1778,
 queue_sizes:Object.fromEntries(Object.entries(queue).map(([k,v])=>[k,v.length])),
 source_candidate_rows:sourceRows,ku_with_distinct_ipa_variants_gt1:multiple,
 ku_with_multiple_entry_pos:multiPos,regional_ku_counts_nonexclusive:regions,
 source_native_phrase_only:true,
 warning:'Not-found phrase expression is NOT a certified IPA. Existing Core20K word-by-word display may be used only with explicit fallback label, not Kaikki native phrase attribution.',
 cg_qa_status:'NOT_REVIEWED',muse_status:'NOT_REVIEWED',release_allowed:false
};
fs.writeFileSync(path.join(outputDir,'qa-queues','qa-queue-summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary));
