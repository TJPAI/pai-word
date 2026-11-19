#!/usr/bin/env node
// Read-only evidence coverage audit. No guessing, no source identity mutations.
import fs from 'node:fs';
const root='tools/scene1341_master/production/';
const index=JSON.parse(fs.readFileSync(root+'SCENE1341_LIVE_INDEX.json','utf8'));
if(index.scene_count!==1341||index.source_associations!==230289)throw Error('immutable index totals mismatch');
const start=Number(process.argv[2]||1),end=Number(process.argv[3]||150);
if(!Number.isInteger(start)||!Number.isInteger(end)||start<1||end>1341||start>end)throw Error('invalid range');
const totals={scenes:0,records:0,missing_evidence:0,with_evidence:0,missing_pos:0,missing_ipa:0,missing_gloss:0};
const samples={missing_evidence:[],candidate_shape:[],available_ipa:[]};
const add=(key,obj)=>{if(samples[key].length<12)samples[key].push(obj);};
for(let i=start;i<=end;i++){
 const id='SC50-'+String(i).padStart(4,'0'),entry=index.scenes[id];
 const scene=JSON.parse(fs.readFileSync(entry.path,'utf8'));
 if(scene.scene_id!==id||scene.records.length!==entry.records)throw Error('scene mismatch '+id);
 totals.scenes++;
 for(const row of scene.records){
  totals.records++;
  const ev=row.kaikki_full_native_evidence;
  if(!ev){totals.missing_evidence++;add('missing_evidence',{scene:id,row:row.source_final_row,expression:row.question_page?.expression});}
  else {totals.with_evidence++;if(ev.candidates?.length)add('candidate_shape',{scene:id,row:row.source_final_row,keys:Object.keys(ev.candidates[0]),pos:ev.candidates[0].pos,sounds:ev.candidates[0].sounds?.slice?.(0,2)});}
  if(!row.answer_page?.pos)totals.missing_pos++;
  if(!row.question_page?.ipa_candidate)totals.missing_ipa++;
  if(!row.answer_page?.gloss_en)totals.missing_gloss++;
 }
}
console.log(JSON.stringify({range:[start,end],totals,samples},null,2));
