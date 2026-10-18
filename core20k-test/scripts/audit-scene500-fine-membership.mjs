#!/usr/bin/env node
// Audit canonical S001-S500 fine membership. Fails on legacy scene IDs, fake verification, duplicate bindings or malformed ranks.
import fs from 'node:fs';
const BASELINE='Core20K_LongTerm_V2.0.6';
const file=process.argv[2];if(!file)throw new Error('Usage: node scripts/audit-scene500-fine-membership.mjs <membership.json>');
const doc=JSON.parse(fs.readFileSync(file,'utf8'));
const sceneId=/^S(?:00[1-9]|0[1-9][0-9]|[1-4][0-9]{2}|500)$/;
const external=new Set(['source_verified','dictionary_corpus_verified']);
const report={file,baselineId:doc.baselineId||null,sceneCount:0,entryCount:0,errors:[],warnings:[],qaWindows:{top100:0,top300:0,top1000:0}};
if(doc.baselineId!==BASELINE)report.errors.push(`baseline_mismatch:${doc.baselineId}`);
const scenes=doc.scenes||{};
for(const [sid,scene] of Object.entries(scenes)){
  report.sceneCount++;
  if(/^cs/i.test(sid))report.errors.push(`legacy_scene_id:${sid}`);else if(!sceneId.test(sid))report.errors.push(`invalid_scene_id:${sid}`);
  const seenSense=new Set(),seenRank=new Set();
  for(const e of (scene?.entries||[])){
    report.entryCount++;
    if(!e?.lemma)report.errors.push(`${sid}:lemma_required`);
    if(!e?.sense_id)report.errors.push(`${sid}:${e?.lemma||'?'}:sense_id_required`);
    if(!e?.word_id)report.errors.push(`${sid}:${e?.lemma||'?'}:word_id_required`);
    if(!Number.isFinite(Number(e?.relevance_score))||Number(e.relevance_score)<0||Number(e.relevance_score)>1)report.errors.push(`${sid}:${e?.lemma||'?'}:invalid_relevance_score`);
    const rank=Number(e?.scene_rank);if(!Number.isInteger(rank)||rank<1)report.errors.push(`${sid}:${e?.lemma||'?'}:invalid_scene_rank`);
    else {if(seenRank.has(rank))report.errors.push(`${sid}:duplicate_scene_rank:${rank}`);seenRank.add(rank)}
    if(e?.sense_id){if(seenSense.has(e.sense_id))report.errors.push(`${sid}:duplicate_sense:${e.sense_id}`);seenSense.add(e.sense_id)}
    if(e?.review_status==='verified'&&!external.has(e?.evidence_status))report.errors.push(`${sid}:${e?.lemma||'?'}:verified_without_external_evidence`);
    if(e?.binding_method==='generated_candidate'&&e?.review_status==='verified')report.errors.push(`${sid}:${e?.lemma||'?'}:generated_candidate_marked_verified`);
  }
  const n=(scene?.entries||[]).length;report.qaWindows.top100+=Math.min(n,100);report.qaWindows.top300+=Math.min(n,300);report.qaWindows.top1000+=Math.min(n,1000);
}
if(report.sceneCount!==500)report.warnings.push(`scene_count_is_${report.sceneCount}_not_500`);
report.pass=report.errors.length===0;
console.log(JSON.stringify(report,null,2));
if(!report.pass)process.exitCode=1;
