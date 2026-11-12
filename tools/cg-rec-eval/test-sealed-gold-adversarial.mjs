// All data in this test is deliberately SYNTHETIC and must never become gold.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'cg-rec-eval-negative-gold-'));
const scorer=new URL('./score-sealed-blind-gold.mjs',import.meta.url).pathname;
try{
 const q=JSON.parse(fs.readFileSync(new URL('./scene1341-blind-intake-24.v1.json',import.meta.url),'utf8'));
 const gold={status:'LOCKED_ADJUDICATED_GOLD',officialGold:true,cases:q.queries.map(x=>({
  query_id:x.id,group:x.group,query:x.query,
  annotator_A:{status:'LOCKED',assessor_id:'synthetic-reviewer-A',scene_relevance:[{scene_id:'SC50-0001',grade:2}],none_relevant:false,rationale:'SYNTHETIC FIXTURE ONLY'},
  annotator_B:{status:'LOCKED',assessor_id:'synthetic-reviewer-B',scene_relevance:[{scene_id:'SC50-0001',grade:2}],none_relevant:false,rationale:'SYNTHETIC FIXTURE ONLY'},
  adjudication:{status:'LOCKED',scene_relevance:[{scene_id:'SC50-0001',grade:2}],none_relevant:false,decision_reason:'SYNTHETIC FIXTURE ONLY'}
 }))};
 const preds={status:'PREDICTIONS_SEPARATED_FROM_UNADJUDICATED_QUERY_SET',queryCount:24,labeledCount:0,
  upstreamCommit:'SYNTHETIC',manifestSha:'SYNTHETIC',rows:q.queries.map(x=>({id:x.id,group:x.group,query:x.query,integrationTop10:[],upstreamTop10:[]}))};
 const g=path.join(root,'gold.json'),p=path.join(root,'predictions.json');
 fs.writeFileSync(p,JSON.stringify(preds));
 const run=()=>{fs.writeFileSync(g,JSON.stringify(gold));return spawnSync(process.execPath,[scorer,g,p],{encoding:'utf8'});};
 const control=run();
 if(control.status!==0||!control.stdout.includes('SEALED_ADJUDICATED_GOLD_ONLY'))throw Error('SYNTHETIC_CONTROL_FAILED '+control.stderr);
 const tests=[
  ['duplicate_review_scene',()=>gold.cases[0].annotator_A.scene_relevance.push({scene_id:'SC50-0001',grade:3})],
  ['scene_out_of_range',()=>gold.cases[1].annotator_A.scene_relevance[0].scene_id='SC50-9999'],
  ['invalid_grade',()=>gold.cases[2].annotator_B.scene_relevance[0].grade=5],
  ['none_relevant_conflict',()=>gold.cases[3].annotator_A.none_relevant=true],
  ['same_reviewer',()=>gold.cases[4].annotator_B.assessor_id='synthetic-reviewer-A'],
  ['invalid_adjudication',()=>gold.cases[5].adjudication.scene_relevance[0].grade=-1]
 ];
 const outcomes=[];
 for(const [id,mutate] of tests){
  mutate();const result=run();if(result.status===0)throw Error('INVALID_GOLD_ACCEPTED '+id);
  outcomes.push({id,rejected:true});
 }
 console.log(JSON.stringify({status:'SYNTHETIC_NEGATIVE_TESTS_PASS',syntheticOnly:true,
   realGoldCreated:false,positiveFixtureValidated:true,invalidRejected:outcomes.length,outcomes}));
}finally{fs.rmSync(root,{recursive:true,force:true});}
