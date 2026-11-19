#!/usr/bin/env node
// Read-only, conservative Kaikki IPA eligibility probe; no QA promotion.
import fs from 'node:fs';
const root='tools/scene1341_master/production/';
const idx=JSON.parse(fs.readFileSync(root+'SCENE1341_LIVE_INDEX.json','utf8'));
if(idx.scene_count!==1341||idx.source_associations!==230289)throw Error('frozen index mismatch');
const first=Number(process.argv[2]||1),last=Number(process.argv[3]||150);
if(!Number.isInteger(first)||!Number.isInteger(last)||first<1||last>1341||first>last)throw Error('invalid scene range');
const summary={scenes:0,records:0,already_ipa:0,no_evidence:0,no_candidates:0,identity_mismatch:0,no_ipa_candidates:0,conflicting_ipa:0,eligible_unique_ipa:0,unknown_candidate_shape:0};
const samples={eligible:[],conflict:[],shape:[]};
const sample=(key,item)=>{if(samples[key].length<12)samples[key].push(item);};
for(let i=first;i<=last;i++){
 const id='SC50-'+String(i).padStart(4,'0'),entry=idx.scenes[id];
 const scene=JSON.parse(fs.readFileSync(entry.path,'utf8'));
 if(scene.scene_id!==id||scene.records.length!==entry.records)throw Error('scene mismatch '+id);
 summary.scenes++;
 for(const rec of scene.records){
  summary.records++;
  if(rec.question_page?.ipa_candidate){summary.already_ipa++;continue;}
  const ev=rec.kaikki_full_native_evidence;
  if(!ev){summary.no_evidence++;continue;}
  if(ev.expression_exact!==rec.question_page?.expression||ev.source_final_row!==rec.source_final_row){summary.identity_mismatch++;continue;}
  const candidates=ev.candidates;
  if(!Array.isArray(candidates)||!candidates.length){summary.no_candidates++;continue;}
  const valid=candidates.filter(c=>c.source_word===rec.question_page.expression&&Number.isInteger(c.source_line));
  if(valid.length!==candidates.length){summary.identity_mismatch++;continue;}
  const values=[];
  for(const c of valid){
   const arr=c.ipa_candidates;
   if(!Array.isArray(arr)){summary.unknown_candidate_shape++;sample('shape',{scene:id,row:rec.source_final_row,example:arr});continue;}
   for(const a of arr){
    if(typeof a==='string'&&a.trim())values.push(a.trim());
    else if(a&&typeof a==='object')sample('shape',{scene:id,row:rec.source_final_row,example:a});
   }
  }
  const distinct=[...new Set(values)];
  if(!distinct.length){summary.no_ipa_candidates++;continue;}
  if(distinct.length!==1){summary.conflicting_ipa++;sample('conflict',{scene:id,row:rec.source_final_row,values:distinct.slice(0,8)});continue;}
  summary.eligible_unique_ipa++;
  sample('eligible',{scene:id,row:rec.source_final_row,expression:rec.question_page.expression,ipa:distinct[0],source_lines:valid.map(x=>x.source_line)});
 }
}
console.log(JSON.stringify({range:[first,last],summary,samples,note:'Read-only candidate eligibility; never assigns 1审 or release eligibility.'},null,2));
