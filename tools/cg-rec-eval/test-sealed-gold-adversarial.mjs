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
 const pristine=structuredClone(gold);
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
  gold.cases=structuredClone(pristine.cases);
  mutate();const result=run();if(result.status===0)throw Error('INVALID_GOLD_ACCEPTED '+id);
  outcomes.push({id,rejected:true});
 }
 // A finalized adjudication must not silently insert a scene missing from one reviewer.
 gold.cases=structuredClone(pristine.cases);
 gold.cases[0].adjudication.scene_relevance.push({scene_id:'SC50-0002',grade:0});
 const incomplete=run();
 if(incomplete.status===0||!incomplete.stderr.includes('DOUBLE_BLIND_SCENE_POOL_INCOMPLETE'))
  throw Error('SINGLE_REVIEWER_SCENE_POOL_ACCEPTED '+incomplete.stderr);
 outcomes.push({id:'incomplete_double_blind_scene_pool',rejected:true});
 gold.cases=structuredClone(pristine.cases);
 // An engine-returned scene with no adjudicated grade must never default to irrelevant.
 gold.cases=structuredClone(pristine.cases);
 fs.writeFileSync(g,JSON.stringify(gold));
 preds.rows[0].integrationTop10=[{scene_id:'SC50-0002'}];
 fs.writeFileSync(p,JSON.stringify(preds));
 const unjudged=spawnSync(process.execPath,[scorer,g,p],{encoding:'utf8'});
 if(unjudged.status===0||!unjudged.stderr.includes('UNJUDGED_PREDICTED_SCENE'))
  throw Error('UNJUDGED_PREDICTION_NOT_REJECTED '+unjudged.stderr);
 outcomes.push({id:'unjudged_prediction',rejected:true});
 // The scorer must not silently consume only the first duplicate row (Array.find hazard).
 preds.rows[0].integrationTop10=[];
 preds.rows[1].id=preds.rows[0].id;
 fs.writeFileSync(p,JSON.stringify(preds));
 const duplicate=spawnSync(process.execPath,[scorer,g,p],{encoding:'utf8'});
 if(duplicate.status===0||!duplicate.stderr.includes('DUPLICATE_OR_INVALID_PREDICTION_QUERY'))
  throw Error('DUPLICATE_PREDICTION_NOT_REJECTED '+duplicate.stderr);
 outcomes.push({id:'duplicate_prediction_query',rejected:true});
 // Also reject a valid-looking but unrelated query id in place of an expected gold id.
 preds.rows[1].id='BH999';
 fs.writeFileSync(p,JSON.stringify(preds));
 const replacement=spawnSync(process.execPath,[scorer,g,p],{encoding:'utf8'});
 if(replacement.status===0||!replacement.stderr.includes('PREDICTION_GOLD_QUERY_SET_MISMATCH'))
  throw Error('QUERY_SET_MISMATCH_NOT_REJECTED '+replacement.stderr);
 outcomes.push({id:'prediction_gold_query_set_mismatch',rejected:true});
 console.log(JSON.stringify({status:'SYNTHETIC_NEGATIVE_TESTS_PASS',syntheticOnly:true,
   realGoldCreated:false,positiveFixtureValidated:true,invalidRejected:outcomes.length,outcomes}));
}finally{fs.rmSync(root,{recursive:true,force:true});}
