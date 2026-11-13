// Independent OPEN/nonblind challenge against the real REC candidate ranker.
// Distinct from author-authored 11 cases and protected BH001-BH024. No gold/accuracy.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadInputs} from '../../scene500-recommendation/scene1341-isolated-search.mjs';
const [catalog,dir,sourceCommit,manifestSha]=process.argv.slice(2);
assert.match(sourceCommit||'',/^[a-f0-9]{40}$/);
assert.match(manifestSha||'',/^[a-f0-9]{40}$/);
const search=loadInputs(catalog,dir,{sourceCommit,manifestSha});
assert.equal(search.sceneCount,1341);assert.equal(search.expressionCount,19371);
// All queries authored independently of the new ranker outputs and the 24 blind holdout.
const cases=[
 ['cn_buy_no','不是退票，是要买票','reverse'],
 ['cn_refund_only','我只需要退车票','refund_no_negated_purchase'],
 ['cn_buy_refund','购票后如何申请退票','refund_without_negation'],
 ['cn_no_buy_refund','不要买票，想退票','negated_buy_refund'],
 ['cn_not_buy_train','我不想买火车票，我要办理退票','negated_buy_refund_variant'],
 ['cn_refund_no_buy','退票不是买票，我要退款','reverse_or_ambiguous'],
 ['cn_cancel_reservation','不是购买商品，我要取消预订','other_domain'],
 ['cn_payment','不是买票，我要支付电费','other_intent'],
 ['cn_refund_goods','不要买衣服，我要退货','other_domain'],
 ['cn_no_ticket','不是车票，是汽车票','not_purchase_refund'],
 ['en_reversed','I am not requesting a refund, I want to buy a train ticket','reverse'],
 ['en_refund_only','Please refund my train ticket','refund_no_negated_purchase'],
 ['en_not_buy_refund','I am not buying a ticket; I want my ticket refunded','negated_buy_refund_variant'],
 ['en_not_purchase_refund','Not purchasing a ticket, I would like a ticket refund','negated_buy_refund_variant'],
 ['en_refund_exchange','I need a ticket exchange, not a refund','reverse'],
 ['en_not_buy_product','Not buying a laptop, I want my money back','other_domain'],
 ['en_not_buy_ticket','I am not buying a train ticket, just checking departure times','other_intent'],
 ['en_buy_refund','How to buy a ticket and request a refund later?','no_negation'],
 ['mix_buy_refund','not buying 车票，想退票','mixed'],
 ['mix_no_refund','不要 refund，我要买票','reverse'],
 ['mix_refund','不是买票，I need a ticket refund','mixed'],
 ['mix_other','不要买票，我要 check in','other_intent'],
 ['zh_standard','不是买咖啡，而是找厕所','other_intent'],
 ['en_standard','I need a dentist appointment tomorrow','other_intent']
];
assert.equal(new Set(cases.map(x=>x[0])).size,cases.length);
const rows=cases.map(([id,query,category])=>{
 const baseline=search.search(query,{limit:10,experimentalContrastiveTicketRefund:false});
 const defaultRun=search.search(query,{limit:10});
 const experimental=search.search(query,{limit:10,experimentalContrastiveTicketRefund:true});
 assert.deepEqual(defaultRun,baseline,'DEFAULT_FLAG_CHANGED '+id);
 for(const results of [baseline,experimental]){
  assert.ok(results.length<=10,'TOO_MANY_SCENES '+id);
  assert.equal(new Set(results.map(x=>x.scene_id)).size,results.length,'DUPLICATE_SCENES '+id);
  for(const result of results){
   assert.match(result.scene_id,/^SC50-\d{4}$/);
   assert.equal(result.release_status,'BLOCKED_PENDING_CG_QA_AND_MUSE');
   assert.equal(result.cg_qa,'NOT_REVIEWED_FOR_THIS_INDEX');
  }
 }
 const markers=experimental.flatMap(x=>x.explanations||[]).filter(x=>x.startsWith('EXPERIMENTAL_UNCERTIFIED_CONTRASTIVE_ACTION:'));
 const changed=JSON.stringify(experimental.map(x=>[x.scene_id,x.score]))!==JSON.stringify(baseline.map(x=>[x.scene_id,x.score]));
 if(!changed)assert.equal(markers.length,0,'MARKER_WITHOUT_EFFECT '+id);
 if(markers.length){assert.equal(markers.length,1,'DUPLICATE_EXPERIMENTAL_MARKER '+id);
  assert.ok(experimental.some(x=>x.scene_id==='SC50-0075'),'WRONG_EXPERIMENTAL_ANCHOR '+id);}
 const top5=rs=>rs.slice(0,5).map(x=>({scene_id:x.scene_id,score:x.score}));
 return {id,query,category,flagDefaultEquivalent:true,changed,changedTop1:baseline[0]?.scene_id!==experimental[0]?.scene_id,
  markerCount:markers.length,baselineTop5:top5(baseline),experimentalTop5:top5(experimental)};
});
const result={schema:'cg-rec-eval-open-contrastive-newquery24-v1',status:'INDEPENDENT_OPEN_NONBLIND_STRUCTURAL_DIAGNOSTIC',
 sourceCommit,manifestSha,recCommit:process.env.CG_REC_EVAL_CANDIDATE_SHA||null,
 cases:rows.length,searches:rows.length*3,distinctQueries:new Set(rows.map(x=>x.query)).size,
 changes:rows.filter(x=>x.changed).length,changedTop1:rows.filter(x=>x.changedTop1).length,
 activatedQueries:rows.filter(x=>x.markerCount).map(x=>x.id),rows,
 goldCount:0,protectedBlind24Used:false,accuracyCertified:false,releaseAllowed:false,
 caveat:'Independent open challenge: changed result or experimental marker does NOT establish correct scene relevance.'};
assert.equal(result.cases,24);assert.equal(result.distinctQueries,24);
assert.equal(result.goldCount,0);assert.equal(result.protectedBlind24Used,false);
console.log(JSON.stringify(result,null,2));
