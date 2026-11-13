// Independent relevance evaluation. REQUIRE separately sealed double-review and adjudication.
// Never infer gold labels from an engine prediction or from query words alone.
import fs from 'node:fs';
const [goldFile,predictionsFile,mode]=process.argv.slice(2);
if(!goldFile||!predictionsFile)throw Error('GOLD_AND_PREDICTIONS_REQUIRED');
const g=JSON.parse(fs.readFileSync(goldFile,'utf8'));
const p=JSON.parse(fs.readFileSync(predictionsFile,'utf8'));
const refuse=msg=>{if(mode==='--expect-unsealed'){console.log(JSON.stringify({status:'EXPECTED_UNSEALED_GOLD_REJECTED',reason:msg}));process.exit(0);}throw Error(msg);};
if(g.status!=='LOCKED_ADJUDICATED_GOLD'||g.officialGold!==true||g.cases?.length!==24)
 refuse('GOLD_NOT_ADJUDICATED');
if(p.status!=='PREDICTIONS_SEPARATED_FROM_UNADJUDICATED_QUERY_SET'||p.rows?.length!==24||
 p.queryCount!==24||p.labeledCount!==0)throw Error('PREDICTION_CONTRACT_INVALID');
// Enforce a one-to-one prediction/gold join; Array.find() alone hides duplicated rows.
const predictionIds=p.rows.map(row=>row?.id);
if(predictionIds.some(id=>typeof id!=='string'||!id.trim())||
 new Set(predictionIds).size!==24)throw Error('DUPLICATE_OR_INVALID_PREDICTION_QUERY');
const goldIds=g.cases.map(row=>row?.query_id);
if(goldIds.some(id=>typeof id!=='string'||!id.trim())||
 new Set(goldIds).size!==24||
 predictionIds.some(id=>!goldIds.includes(id)))
 throw Error('PREDICTION_GOLD_QUERY_SET_MISMATCH');
for(const row of p.rows){
 if(typeof row.query!=='string'||!row.query.trim()||
 !['zh','en','mixed'].includes(row.group)||
 !Array.isArray(row.integrationTop10)||!Array.isArray(row.upstreamTop10))
 throw Error('MALFORMED_PREDICTION_ROW '+row.id);
}
const predictionsById=new Map(p.rows.map(row=>[row.id,row]));
const expectedGroup={zh:8,en:8,mixed:8};
const sceneIdValid=id=>typeof id==='string'&&/^SC50-\d{4}$/.test(id)&&Number(id.slice(5))>=1&&Number(id.slice(5))<=1341;
function validateReview(review,id,role){
 if(!review||review.status!=='LOCKED'||typeof review.assessor_id!=='string'||!review.assessor_id.trim()||
   !Array.isArray(review.scene_relevance)||typeof review.none_relevant!=='boolean'||
   typeof review.rationale!=='string'||!review.rationale.trim())
   throw Error('INDEPENDENT_REVIEW_INCOMPLETE '+id+' '+role);
 const seen=new Set();
 for(const item of review.scene_relevance){
   if(!item||!sceneIdValid(item.scene_id)||!Number.isInteger(item.grade)||item.grade<0||item.grade>3||seen.has(item.scene_id))
    throw Error('INVALID_REVIEW_LABEL '+id+' '+role);
   seen.add(item.scene_id);
 }
 const positive=review.scene_relevance.some(x=>x.grade>=2);
 if(review.none_relevant===positive)throw Error('REVIEW_NONE_RELEVANT_CONFLICT '+id+' '+role);
}
const usedIds=new Set(),data=[];
for(const entry of g.cases){
 if(usedIds.has(entry.query_id))throw Error('DUPLICATE_GOLD_QUERY');
 usedIds.add(entry.query_id);
 const pred=predictionsById.get(entry.query_id);
 if(!pred||entry.query!==pred.query||entry.group!==pred.group)throw Error('QUERY_IDENTITY_MISMATCH '+entry.query_id);
 for(const role of ['annotator_A','annotator_B'])validateReview(entry[role],entry.query_id,role);
 if(entry.annotator_A.assessor_id===entry.annotator_B.assessor_id)throw Error('DUPLICATE_REVIEWERS '+entry.query_id);
 const a=entry.adjudication;
 if(a?.status!=='LOCKED'||typeof a.none_relevant!=='boolean'||!Array.isArray(a.scene_relevance)||
 !a.decision_reason?.trim())throw Error('GOLD_ADJUDICATION_MISSING '+entry.query_id);
 const relevant=new Map();
 for(const item of a.scene_relevance){
  if(!/^SC50-\d{4}$/.test(item.scene_id)||+item.scene_id.slice(5)<1||+item.scene_id.slice(5)>1341||
    !Number.isInteger(item.grade)||item.grade<0||item.grade>3||relevant.has(item.scene_id))throw Error('BAD_ADJUDICATED_LABEL '+entry.query_id);
  relevant.set(item.scene_id,item.grade);
 }
 // Every adjudicated candidate must have been independently assessed by both reviewers.
 // This does not require reviewer agreement on grade; differences belong in adjudication.
 const finalPool=new Set(relevant.keys());
 for(const role of ['annotator_A','annotator_B']){
  const reviewed=new Set(entry[role].scene_relevance.map(x=>x.scene_id));
  if(reviewed.size!==finalPool.size||[...finalPool].some(id=>!reviewed.has(id)))
   throw Error('DOUBLE_BLIND_SCENE_POOL_INCOMPLETE '+entry.query_id+' '+role);
 }
 const n=[...relevant.values()].filter(x=>x>=2).length;
 if(a.none_relevant!==(n===0))throw Error('NONE_RELEVANT_INCONSISTENT '+entry.query_id);
 const ranks={};
 for(const engine of ['integration','upstream']){
  const top=pred[engine+'Top10'].map(x=>x.scene_id);
  if(top.length>10||new Set(top).size!==top.length)throw Error('INVALID_TOP10 '+entry.query_id);
  // Unjudged is NOT irrelevant. Require complete adjudication for every returned scene.
  // This prevents optimistic/deflated metrics when a model surfaces unreviewed candidates.
  for(const sceneId of top){
   if(!sceneIdValid(sceneId))throw Error('INVALID_PREDICTED_SCENE '+entry.query_id+' '+engine);
   if(!relevant.has(sceneId))throw Error('UNJUDGED_PREDICTED_SCENE '+entry.query_id+' '+engine+' '+sceneId);
  }
  const rel=top.map(id=>relevant.get(id)),binary=rel.map(v=>v>=2?1:0);
  const first=binary.findIndex(Boolean);
  const dcg=rel.slice(0,5).reduce((s,v,k)=>s+(2**v-1)/Math.log2(k+2),0);
  const ideal=[...relevant.values()].sort((x,y)=>y-x).slice(0,5).reduce((s,v,k)=>s+(2**v-1)/Math.log2(k+2),0);
  ranks[engine]={top1:binary[0]||0,recall5:n?binary.slice(0,5).reduce((s,v)=>s+v,0)/n:null,
    mrr5:n?(first<0||first>=5?0:1/(first+1)):null,
    ndcg5:ideal?dcg/ideal:null,empty:top.length===0};
 }
 data.push({id:entry.query_id,group:entry.group,none_relevant:a.none_relevant,
   relevantSceneCount:n,metrics:ranks});
}
if(data.length!==24||Object.keys(expectedGroup).some(g=>data.filter(x=>x.group===g).length!==expectedGroup[g]))throw Error('GROUPS_INCOMPLETE');
const aggregate=(rows,engine)=>{
 const eligible=rows.filter(x=>!x.none_relevant);
 const metric=k=>eligible.length?eligible.reduce((s,x)=>s+x.metrics[engine][k],0)/eligible.length:null;
 const unanswerable=rows.filter(x=>x.none_relevant);
 const emptyUnanswerable=unanswerable.filter(x=>x.metrics[engine].empty).length;
 const returnedUnanswerable=unanswerable.length-emptyUnanswerable;
 return {n:rows.length,eligible:eligible.length,unanswerable:unanswerable.length,
 top1:metric('top1'),recall5:metric('recall5'),mrr5:metric('mrr5'),ndcg5:metric('ndcg5'),
 empty:rows.filter(x=>x.metrics[engine].empty).length,
 // Report non-abstention separately: relevance accuracy excludes no-answer queries by design.
 // Returning any result for a no-answer query is NOT a false-positive label without
 // an explicit rejection/abstention policy; this metric is coverage, not semantic accuracy.
 unanswerableReturned:returnedUnanswerable,
 unanswerableEmpty:emptyUnanswerable,
 unanswerableReturnRate:unanswerable.length?returnedUnanswerable/unanswerable.length:null};
};
const result={schema:'cg-rec-eval-24-sealed-gold-score-v1',status:'SEALED_ADJUDICATED_GOLD_ONLY',
 sourcePredictionCommit:p.upstreamCommit,sourceManifest:p.manifestSha,
 overall:{integration:aggregate(data,'integration'),upstream:aggregate(data,'upstream')},
 byGroup:Object.fromEntries(['zh','en','mixed'].map(k=>[k,{integration:aggregate(data.filter(x=>x.group===k),'integration'),upstream:aggregate(data.filter(x=>x.group===k),'upstream')}])),
 rows:data,releaseAllowed:false};
if(mode==='--expect-unsealed')throw Error('UNSEALED_CHECK_UNEXPECTEDLY_PASSED');
console.log(JSON.stringify(result,null,2));
