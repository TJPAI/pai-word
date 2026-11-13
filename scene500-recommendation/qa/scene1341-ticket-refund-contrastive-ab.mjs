// Isolated contrastive ticket refund A/B. Source catalog anchor ONLY; no certified Sense–Scene evidence.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadInputs} from '../scene1341-isolated-search.mjs';
const [catalog,dir,sourceCommit,manifestSha,priorFactorial]=process.argv.slice(2);
assert.ok(catalog&&dir&&priorFactorial&&/^[a-f0-9]{40}$/.test(sourceCommit||'')&&/^[a-f0-9]{40}$/.test(manifestSha||''));
const prior=JSON.parse(fs.readFileSync(priorFactorial,'utf8'));
assert.equal(prior.stats.queries,59);assert.equal(prior.formalHumanGold,0);assert.equal(prior.release_allowed,false);
const index=loadInputs(catalog,dir,{sourceCommit,manifestSha});
assert.equal(index.sceneCount,1341);assert.equal(index.expressionCount,19371);
const cases=[
 {id:'refund_contrast',query:'不是买票，我要退票',target:'SC50-0075'},
 {id:'refund_positive',query:'我要退票',target:null},
 {id:'refund_buy',query:'我要买票',target:null},
 {id:'refund_other',query:'不是买咖啡，而是想找厕所',target:null},
 {id:'refund_english',query:'not buying a ticket, I need a ticket refund',target:'SC50-0075'}
];
const results=cases.map(c=>{
 const baseline=index.search(c.query,{limit:10,experimentalContrastiveTicketRefund:false});
 const candidate=index.search(c.query,{limit:10,experimentalContrastiveTicketRefund:true});
 const saved=prior.records.find(r=>r.query===c.query);
 if(saved)assert.deepEqual(baseline.map((x,i)=>({rank:i+1,scene_id:x.scene_id,name:x.name,score:x.score,explanations:x.explanations,has_ranked_data:x.has_ranked_data})),saved.arms.baseline,'default parity vs PR96');
 const hints=candidate.flatMap(x=>x.explanations.filter(z=>z.startsWith('EXPERIMENTAL_UNCERTIFIED_CONTRASTIVE_ACTION:')));
 assert.equal(hints.length,c.target?1:0,'narrow experimental activation');
 if(c.target){assert.equal(candidate[0].scene_id,c.target);assert.ok(candidate.some(x=>x.scene_id===c.target));}
 else assert.deepEqual(candidate,baseline,'untriggered query must be byte identical');
 for(const rows of [baseline,candidate])for(const r of rows){
  assert.equal(r.release_status,'BLOCKED_PENDING_CG_QA_AND_MUSE');assert.equal(r.cg_qa,'NOT_REVIEWED_FOR_THIS_INDEX');
 }
 const project=rows=>rows.slice(0,5).map(x=>({scene_id:x.scene_id,name:x.name,score:x.score,explanations:x.explanations}));
 return {id:c.id,query:c.query,baselineTop5:project(baseline),candidateTop5:project(candidate),
  changedTop1:baseline[0]?.scene_id!==candidate[0]?.scene_id, activation:hints,
  editorialRelevance:'NOT_ADJUDICATED'};
});
console.log(JSON.stringify({
 schema:'cg-rec-sc1341-opt-in-ticket-refund-contrastive-nonblind-v1',
 sourceCommit,manifestSha,queries:results.length,searches:results.length*2,results,
 hypothesisScope:'UNVERIFIED_CATALOG_TITLE_ONLY',sourceSenseCertified:false,
 independentHumanGold:0,protectedBlind24Accessed:false,defaultBehaviorUnchanged:true,
 release_allowed:false,production_eligible:false,
 caveat:'Returning ticket scene at Top1 in an experiment is not evidence of semantic correctness. Candidate scene has no verified refund Sense–Scene association.'
},null,2));
