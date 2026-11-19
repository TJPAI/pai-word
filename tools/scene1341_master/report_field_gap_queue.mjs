#!/usr/bin/env node
/**
 * Read-only full-catalog teaching-gap queue. Never promotes QA or SRS.
 * Usage: node tools/scene1341_master/report_field_gap_queue.mjs > gap_queue.json
 * Emits full per-field coverage and deterministic 3000-row work batches.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve('tools/scene1341_master/production');
const index=JSON.parse(fs.readFileSync(path.join(root,'SCENE1341_LIVE_INDEX.json'),'utf8'));
if(index.scene_count!==1341||index.source_associations!==230289||index.release_allowed!==false||index.srs_eligible!==false)throw Error('frozen index or release gate mismatch');
const fields=['ipa','pos','meaning_zh','gloss_en','example_en','example_zh','collocations','usage_note'];
const tally=Object.fromEntries(fields.map(f=>[f,{present:0,missing:0}]));
const batches=[],sceneTotals=[],seen=new Set();
let batch=[],associations=0,sourceReady=0,ambiguous=0;
const isText=v=>typeof v==='string'&&v.trim().length>0;
const isNonempty=v=>Array.isArray(v)?v.length>0:isText(v);
const gitBlob=buf=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+buf.length+'\\0'),buf])).digest('hex');
function pushBatch(){if(!batch.length)return;batches.push({batch_number:batches.length+1,records:batch.length,first:batch[0],last:batch.at(-1),rows:batch});batch=[];}
for(let i=1;i<=1341;i++){
  const id='SC50-'+String(i).padStart(4,'0'),meta=index.scenes[id];
  if(!meta)throw Error('missing index '+id);
  const raw=fs.readFileSync(path.join(root,'scenes',id+'.json'));
  if(gitBlob(raw)!==meta.git_blob_sha1)throw Error('blob mismatch '+id);
  const scene=JSON.parse(raw);
  if(scene.scene_id!==id||scene.record_count!==meta.records||scene.records?.length!==meta.records||scene.release_allowed!==false||scene.srs_eligible!==false)throw Error('scene contract '+id);
  const local=Object.fromEntries(fields.map(f=>[f,0]));
  for(const r of scene.records){
    if(r.scene_id!==id||!Number.isInteger(r.source_final_row)||seen.has(r.source_final_row)||r.release_allowed!==false||r.srs_eligible!==false)throw Error('row contract '+id);
    seen.add(r.source_final_row);associations++;
    const q=r.question_page||{},a=r.answer_page||{},native=r.kaikki_full_native_evidence;
    if(native)sourceReady++;
    const candidateCount=native?.candidates?.length||0;
    if(candidateCount>1)ambiguous++;
    const ex=Array.isArray(a.examples)?a.examples:[];
    const values={
      ipa:isNonempty(q.ipa_candidate),pos:isNonempty(q.pos)||isNonempty(a.pos),
      meaning_zh:isNonempty(a.meaning_zh),gloss_en:isNonempty(a.gloss_en),
      example_en:isNonempty(a.example_en)||ex.some(x=>isNonempty(x?.en)||isNonempty(x?.example_en)),
      example_zh:isNonempty(a.example_zh)||ex.some(x=>isNonempty(x?.zh)||isNonempty(x?.example_zh)),
      collocations:isNonempty(a.collocations),usage_note:isNonempty(a.usage_note)
    };
    const gaps=fields.filter(f=>!values[f]);
    for(const f of fields){tally[f][values[f]?'present':'missing']++;if(!values[f])local[f]++;}
    if(gaps.length){
      // Source pointers only: no unsupported sense selection or invented teaching text.
      batch.push({scene_id:id,source_final_row:r.source_final_row,expression:q.expression??null,missing_fields:gaps,kaikki_candidates:candidateCount,qa_stage:native?.qa_stage??'待审'});
      if(batch.length===3000)pushBatch();
    }
  }
  sceneTotals.push({scene_id:id,records:meta.records,missing:local});
}
pushBatch();
if(associations!==230289||seen.size!==230289||Object.keys(index.scenes).length!==1341)throw Error('frozen coverage totals mismatch');
const summary={schema:'cgmaster-field-gap-queue/v1',release:index.master_release?.version??null,scenes:1341,associations,source_evidence_records:sourceReady,ambiguous_native_entry_records:ambiguous,fields:tally,incomplete_rows:batches.reduce((s,b)=>s+b.records,0),batch_size:3000,batch_count:batches.length,release_allowed:false,srs_eligible:false};
console.log(JSON.stringify({summary,scene_totals:sceneTotals,batches},null,2));
