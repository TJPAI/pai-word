// Synthetic structural validation only; no human labels and no model predictions.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'scene1341-reviewer-packets-'));
try {
 const source=new URL('./scene1341-blind-intake-24.v1.json',import.meta.url).pathname;
 const script=new URL('./scene1341-blind-reviewer-packets.mjs',import.meta.url).pathname;
 const a=path.join(tmp,'reviewer-A.json'),b=path.join(tmp,'reviewer-B.json');
 const run=spawnSync(process.execPath,[script,source,a,b],{encoding:'utf8'});
 if(run.status!==0)throw Error('PACKET_GENERATION_FAILED '+run.stderr);
 const left=JSON.parse(fs.readFileSync(a,'utf8')),right=JSON.parse(fs.readFileSync(b,'utf8'));
 const src=JSON.parse(fs.readFileSync(source,'utf8'));
 for(const [role,p] of [['annotator_A',left],['annotator_B',right]]){
  if(p.role!==role||p.status!=='UNLABELED_REVIEWER_PACKET_NOT_GOLD'||
    p.cases?.length!==24||p.formalGoldCount!==0||p.releaseAllowed!==false||
    p.modelPredictionsIncluded!==false||p.otherReviewerLabelsIncluded!==false||
    p.adjudicationIncluded!==false)throw Error('REVIEWER_PACKET_GATE_INVALID '+role);
  p.cases.forEach((c,i)=>{
   const original=src.queries[i];
   if(c.query_id!==original.id||c.group!==original.group||c.query!==original.query||
     c.status!=='PENDING'||c.assessor_id!==null||c.none_relevant!==null||
     c.rationale!==null||c.scene_relevance?.length!==0||
     c.source_catalog_evidence?.length!==0)throw Error('PREFILLED_OR_CHANGED_CASE '+role+' '+i);
  });
  const txt=JSON.stringify(p);
  if(/integrationTop10|upstreamTop10|expectedSceneIds|fullOrderAndScoresEqual/.test(txt))
   throw Error('PREDICTION_LEAK '+role);
 }
 const duplicate=spawnSync(process.execPath,[script,source,a,b],{encoding:'utf8'});
 if(duplicate.status===0)throw Error('OVERWRITE_REVIEWER_PACKET_ACCEPTED');
 // Alter a temporary copy to contain a fabricated expected label.
 const tainted=path.join(tmp,'tainted.json'),srcCopy=structuredClone(src);
 srcCopy.queries[0].expected='SC50-0001';
 fs.writeFileSync(tainted,JSON.stringify(srcCopy));
 const poisoned=spawnSync(process.execPath,[script,tainted,path.join(tmp,'x.json'),path.join(tmp,'y.json')],{encoding:'utf8'});
 if(poisoned.status===0)throw Error('PRELABELED_SOURCE_ACCEPTED');
 console.log(JSON.stringify({status:'TWO_INDEPENDENT_QUERY_ONLY_PACKETS_SYNTHETIC_STRUCTURE_PASS',
  casesPerReviewer:24,rejectedOverwrite:true,rejectedLabelLeak:true,formalHumanGold:0}));
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
