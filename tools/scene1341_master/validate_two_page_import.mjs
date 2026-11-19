#!/usr/bin/env node
// Validate complete two-package Sense teaching imports; no writes.
import fs from 'node:fs';
const input=process.argv[2];
if(!input)throw Error('Usage: node validate_two_page_import.mjs <draft.jsonl>');
const fields=['pos','meaning_zh','gloss_en','example_en','example_zh','collocations','usage_note'];
const question=['expression','ipa_candidate'];
const text=v=>typeof v==='string'&&v.trim().length>0;
const idx=JSON.parse(fs.readFileSync('tools/scene1341_master/production/SCENE1341_LIVE_INDEX.json','utf8'));
const rows=fs.readFileSync(input,'utf8').split(/\r?\n/).filter(Boolean);
const seen=new Set(),report={records:0,complete_question:0,complete_answer:0,complete_both:0,incomplete:[],duplicate:[],errors:[]};
for(let i=0;i<rows.length;i++){
 let r;try{r=JSON.parse(rows[i]);}catch{report.errors.push({line:i+1,reason:'INVALID_JSON'});continue;}
 const id=r.scene_id+':'+r.source_final_row;
 if(seen.has(id))report.duplicate.push(id);seen.add(id);
 if(!idx.scenes?.[r.scene_id]||!Number.isInteger(r.source_final_row))report.errors.push({line:i+1,reason:'INVALID_FROZEN_IDENTITY'});
 const q=r.question_page||{},a=r.answer_page||{};
 const qmissing=question.filter(k=>!text(q[k]));
 const amissing=fields.filter(k=>k==='collocations'?!(Array.isArray(a[k])?a[k].length>0:text(a[k])):!text(a[k]));
 const extra=Object.keys(a).filter(k=>!fields.includes(k)&&!['provenance','qa_stage'].includes(k));
 if(extra.some(k=>['expression','ipa_candidate','ipa','word'].includes(k)))report.errors.push({line:i+1,reason:'ANSWER_DUPLICATES_QUESTION_FIELDS'});
 if(!r.provenance?.source||!r.provenance?.source_id)report.errors.push({line:i+1,reason:'MISSING_PROVENANCE'});
 if(r.qa_stage!=='待审')report.errors.push({line:i+1,reason:'UNAUTHORIZED_QA_STATUS'});
 if(r.release_allowed!==false||r.srs_eligible!==false)report.errors.push({line:i+1,reason:'RELEASE_GUARD'});
 report.records++;report.complete_question+=Number(!qmissing.length);report.complete_answer+=Number(!amissing.length);report.complete_both+=Number(!qmissing.length&&!amissing.length);
 if(qmissing.length||amissing.length)report.incomplete.push({line:i+1,id,question_missing:qmissing,answer_missing:amissing});
}
console.log(JSON.stringify({...report,incomplete_count:report.incomplete.length,incomplete:report.incomplete.slice(0,50)},null,2));
if(report.errors.length||report.duplicate.length||report.incomplete.length)process.exitCode=2;
