#!/usr/bin/env node
// Read-only readiness audit for strictly matched CG-ENTEACH teaching drafts.
import fs from 'node:fs';
import crypto from 'node:crypto';
const input=process.argv[2];
if(!input)throw Error('usage: audit_enteach_import_readiness.mjs <candidates.jsonl>');
const idx=JSON.parse(fs.readFileSync('tools/scene1341_master/production/SCENE1341_LIVE_INDEX.json','utf8'));
const blob=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const fields=['pos','meaning_zh','gloss_en','example_en','example_zh','collocations','usage_note'];
const complete=v=>Array.isArray(v)?v.length>0&&v.every(x=>typeof x==='string'&&x.trim()):typeof v==='string'&&!!v.trim();
const report={candidates:0,ready_question:0,ready_full_answer:0,ready_both:0,missing_question_ipa:0,missing_answer_fields:Object.fromEntries(fields.map(k=>[k,0])),conflicts:0,identity_errors:0,scenes:0,publication:'NONE_AUDIT_ONLY'};
const scenes=new Map(),seen=new Set(),ready=[],blocked=[];
for(const line of fs.readFileSync(input,'utf8').split(/\r?\n/).filter(Boolean)){
 const d=JSON.parse(line);report.candidates++;
 const meta=idx.scenes[d.scene_id];if(!meta)throw Error('unknown scene '+d.scene_id);
 if(!scenes.has(d.scene_id)){
  const bytes=fs.readFileSync(meta.path);
  if(blob(bytes)!==meta.git_blob_sha1)throw Error('stale scene '+d.scene_id);
  scenes.set(d.scene_id,new Map(JSON.parse(bytes).records.map(r=>[r.source_final_row,r])));
 }
 const key=d.scene_id+':'+d.source_final_row;
 if(seen.has(key))throw Error('duplicate target '+key);seen.add(key);
 const r=scenes.get(d.scene_id).get(d.source_final_row);
 if(!r||r.question_page?.expression!==d.expression||r.release_allowed!==false||r.srs_eligible!==false){report.identity_errors++;blocked.push({scene_id:d.scene_id,source_final_row:d.source_final_row,expression:d.expression,reason:'FROZEN_IDENTITY_OR_RELEASE_GUARD'});continue;}
 const q=complete(r.question_page?.expression)&&complete(r.question_page?.ipa_candidate);
 if(q)report.ready_question++;else report.missing_question_ipa++;
 let answer=true;const missing=[],conflicting=[];
 for(const field of fields){
  const existing=r.answer_page?.[field],incoming=d.fields?.[field];
  if(complete(existing)&&complete(incoming)&&JSON.stringify(existing)!==JSON.stringify(incoming)){report.conflicts++;answer=false;conflicting.push(field);}
  if(!complete(existing)&&!complete(incoming)){report.missing_answer_fields[field]++;answer=false;missing.push(field);}
 }
 // An author candidate must never count as a complete answer unless every field
 // is present either in the frozen Master or the source-pinned author draft.
 if(answer)report.ready_full_answer++;
 if(q&&answer){
  report.ready_both++;
  const answerPage=Object.fromEntries(fields.map(field=>[field,complete(r.answer_page?.[field])?r.answer_page[field]:d.fields[field]]));
  ready.push({scene_id:d.scene_id,source_final_row:d.source_final_row,question_page:{expression:r.question_page.expression,ipa_candidate:r.question_page.ipa_candidate},answer_page:answerPage,provenance:d.provenance,qa_stage:'待审',release_allowed:false,srs_eligible:false});
 }
 else blocked.push({scene_id:d.scene_id,source_final_row:d.source_final_row,expression:d.expression,missing_ipa:!q,missing_fields:missing,conflicting_fields:conflicting});
}
report.scenes=scenes.size;
const base=input.replace(/\.jsonl$/,'');
fs.writeFileSync(base+'-ready.jsonl',ready.map(x=>JSON.stringify(x)).join('\n')+(ready.length?'\n':''));
fs.writeFileSync(base+'-blocked.jsonl',blocked.map(x=>JSON.stringify(x)).join('\n')+(blocked.length?'\n':''));
report.ready_file=base+'-ready.jsonl';report.blocked_file=base+'-blocked.jsonl';
report.ready_records=ready.length;report.blocked_records=blocked.length;
report.blocked_by_field=Object.fromEntries(fields.map(k=>[k,blocked.filter(x=>x.missing_fields?.includes(k)).length]));
report.blocked_by_conflict_field=Object.fromEntries(fields.map(k=>[k,blocked.filter(x=>x.conflicting_fields?.includes(k)).length]));
if(report.identity_errors)process.exitCode=2;
if(report.ready_both+blocked.length+report.identity_errors!==report.candidates)throw Error('readiness accounting mismatch');
console.log(JSON.stringify(report,null,2));
