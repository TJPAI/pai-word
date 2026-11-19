#!/usr/bin/env node
/**
 * Read-only coverage report across the complete frozen Scene1341 master.
 * node tools/scene1341_master/report_master_coverage.mjs
 * Does not modify scene, identity, labels or release metadata.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const base=path.resolve('tools/scene1341_master/production');
const idx=JSON.parse(fs.readFileSync(path.join(base,'SCENE1341_LIVE_INDEX.json'),'utf8'));
if(idx.scene_count!==1341||idx.source_associations!==230289)throw Error('master frozen totals mismatch');
const tally={scenes:0,associations:0,ipa:0,part_of_speech:0,chinese_meaning:0,english_gloss:0,english_example:0,chinese_example:0,collocations:0,usage_note:0,all_core_answer_fields:0,kaikki_evidence:0,ambiguous_native_candidates:0,unreviewed:0,first_review:0,srs_eligible:0,source_identity_duplicates:0,index_sha_mismatches:0};
const seen=new Set(),missing=[];
const sceneCompleteness={fully_complete:0,incomplete:0,complete_scene_ids:[],incomplete_scene_samples:[],fully_complete_question_pages:0,fully_complete_answer_pages:0,complete_both_pages_records:0};
const shaBlob=bytes=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+bytes.length),Buffer.from([0]),bytes])).digest('hex');
const present=v=>typeof v==='string'?v.trim().length>0:Array.isArray(v)?v.length>0:v!==null&&v!==undefined;
for(let n=1;n<=1341;n++){
 const id='SC50-'+String(n).padStart(4,'0'), meta=idx.scenes[id];
 if(!meta)throw Error('missing scene '+id);
 const file=path.join(base,'scenes',id+'.json'),raw=fs.readFileSync(file);
 if(shaBlob(raw)!==meta.git_blob_sha1){tally.index_sha_mismatches++;missing.push(id);}
 const scene=JSON.parse(raw);
 if(scene.scene_id!==id||scene.records?.length!==meta.records||scene.record_count!==meta.records)throw Error('scene count/identity '+id);
 if(scene.release_allowed!==false||scene.srs_eligible!==false)throw Error('scene release guard '+id);
 tally.scenes++;
 let sceneAll=true;
 for(const r of scene.records){
  if(r.scene_id!==id||!Number.isInteger(r.source_final_row))throw Error('record identity '+id);
  if(seen.has(r.source_final_row))tally.source_identity_duplicates++;
  seen.add(r.source_final_row);tally.associations++;
  if(r.release_allowed!==false||r.srs_eligible!==false)throw Error('record release guard '+id);
  const q=r.question_page||{},a=r.answer_page||{},e=r.kaikki_full_native_evidence;
  const ipa=present(q.ipa_candidate),pos=present(a.pos)||present(q.pos),zh=present(a.meaning_zh);
  const gloss=present(a.gloss_en),enEx=present(a.example_en)||present(a.examples?.filter(v=>present(v.en)||present(v.example_en))),zhEx=present(a.example_zh)||present(a.examples?.filter(v=>present(v.zh)||present(v.example_zh))),coll=present(a.collocations),usage=present(a.usage_note);
  tally.ipa+=Number(ipa);tally.part_of_speech+=Number(pos);tally.chinese_meaning+=Number(zh);tally.english_gloss+=Number(gloss);tally.english_example+=Number(enEx);tally.chinese_example+=Number(zhEx);tally.collocations+=Number(coll);tally.usage_note+=Number(usage);
  const questionComplete=present(q.expression)&&ipa;
  const answerComplete=pos&&zh&&gloss&&enEx&&zhEx&&coll&&usage;
  const bothComplete=questionComplete&&answerComplete;
  sceneCompleteness.fully_complete_question_pages+=Number(questionComplete);
  sceneCompleteness.fully_complete_answer_pages+=Number(answerComplete);
  sceneCompleteness.complete_both_pages_records+=Number(bothComplete);
  if(!bothComplete)sceneAll=false;
  tally.all_core_answer_fields+=Number(ipa&&pos&&zh&&gloss&&enEx&&zhEx&&coll&&usage);
  tally.kaikki_evidence+=Number(!!e);
  tally.ambiguous_native_candidates+=Number((e?.candidates?.length||0)>1);
  tally.first_review+=Number(e?.qa_stage==='1审'&&e.first_review===true);
  tally.unreviewed+=Number(e?.qa_stage==='待审'||!e);
  tally.srs_eligible+=Number(r.srs_eligible===true);
 }
 if(sceneAll) {sceneCompleteness.fully_complete++;sceneCompleteness.complete_scene_ids.push(id);}
 else {sceneCompleteness.incomplete++;if(sceneCompleteness.incomplete_scene_samples.length<20)sceneCompleteness.incomplete_scene_samples.push(id);}
}
if(tally.scenes!==1341||tally.associations!==230289||tally.source_identity_duplicates)throw Error('frozen coverage contract failed');
const percentage=Object.fromEntries(Object.entries(tally).filter(([k])=>!['scenes','associations','index_sha_mismatches','source_identity_duplicates'].includes(k)).map(([k,v])=>[k,Number((v/230289*100).toFixed(2))]));
console.log(JSON.stringify({release:idx.master_release?.version,counts:tally,scene_completeness:sceneCompleteness,percent:percentage,sha_mismatch_ids:missing},null,2));
if(missing.length)process.exitCode=2;
