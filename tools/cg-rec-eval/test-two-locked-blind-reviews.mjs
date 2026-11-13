// Synthetic only: probes locked-human intake without forging any actual human review.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'rec-eval-blind-lock-'));
try{
 const queries=new URL('./scene1341-blind-intake-24.v1.json',import.meta.url).pathname;
 const generate=new URL('./scene1341-blind-reviewer-packets.mjs',import.meta.url).pathname;
 const validator=new URL('./validate-two-locked-blind-reviews.mjs',import.meta.url).pathname;
 const a=path.join(tmp,'A.json'),b=path.join(tmp,'B.json');
 let x=spawnSync(process.execPath,[generate,queries,a,b],{encoding:'utf8'});
 if(x.status!==0)throw Error('SYNTHETIC_PACKET_GENERATION_FAILED '+x.stderr);
 const left=JSON.parse(fs.readFileSync(a,'utf8')),right=JSON.parse(fs.readFileSync(b,'utf8'));
 const invoke=()=>spawnSync(process.execPath,[validator,queries,a,b],{encoding:'utf8'});
 if(invoke().status===0)throw Error('UNLOCKED_BLIND_PACKETS_ACCEPTED');
 for(const [p,id]of [[left,'SYNTHETIC_A'],[right,'SYNTHETIC_B']]){
  for(const c of p.cases){
   c.status='LOCKED';c.assessor_id=id;c.rationale='SYNTHETIC TEST ONLY';
   c.scene_relevance=[{scene_id:'SC50-0001',grade:2}];
   c.none_relevant=false;c.source_catalog_evidence=['SYNTHETIC CATALOG TEST FIXTURE'];
  }
 }
 const write=()=>{fs.writeFileSync(a,JSON.stringify(left));fs.writeFileSync(b,JSON.stringify(right));};
 write();x=invoke();
 if(x.status!==0)throw Error('SYNTHETIC_LOCKED_CONTROL_REJECTED '+x.stderr);
 let result=JSON.parse(x.stdout);
 if(result.independentReviewers!==2||result.casesReadyForAdjudication!==24||
  result.formalGoldCount!==0||result.releaseAllowed!==false)
  throw Error('LOCKED_CONTROL_COUNTS_INVALID');
 right.cases[0].scene_relevance=[];right.cases[0].none_relevant=true;
 write();x=invoke();
 if(x.status!==0)throw Error('PARTIAL_SCENE_POOL_SHOULD_BE_REPORTED '+x.stderr);
 result=JSON.parse(x.stdout);
 if(result.casesNeedingPoolCompletion!==1||result.casesReadyForAdjudication!==23)
  throw Error('PARTIAL_SCENE_POOL_NOT_DETECTED');
 right.cases[0].scene_relevance=[{scene_id:'SC50-0001',grade:2}];
 right.cases[0].none_relevant=false;right.cases[1].scene_relevance[0].grade=3;
 write();x=invoke();if(x.status!==0)throw Error('GRADE_DISAGREEMENT_REJECTED '+x.stderr);
 if(JSON.parse(x.stdout).gradeDisagreementCases!==1)throw Error('GRADE_DISAGREEMENT_NOT_REPORTED');
 right.cases[1].assessor_id='SYNTHETIC_A';write();
 if(invoke().status===0)throw Error('INCONSISTENT_REVIEWER_ID_ACCEPTED');
 right.cases[1].assessor_id='SYNTHETIC_B';
 right.cases[1].integrationTop10=[{scene_id:'SC50-0001'}];write();
 if(invoke().status===0)throw Error('MODEL_PREDICTION_LEAK_ACCEPTED');
 console.log(JSON.stringify({status:'SYNTHETIC_TWO_LOCKED_REVIEW_GATE_PASS',
  syntheticOnly:true,cases:24,detectedIncompletePool:true,
  detectedDisagreement:true,rejectedInconsistentReviewer:true,
  rejectedModelPredictionLeak:true,formalGoldCount:0,releaseAllowed:false}));
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
