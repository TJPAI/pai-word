// Intake gate for TWO independently LOCKED human relevance packets.
// Only use after both reviewers have submitted separately. This is not gold certification.
// No model predictions or inferred labels are accepted.
import fs from 'node:fs';
const [queryFile,reviewerAFile,reviewerBFile]=process.argv.slice(2);
if(!queryFile||!reviewerAFile||!reviewerBFile||reviewerAFile===reviewerBFile)
 throw Error('REQUIRE_TWO_DISTINCT_REVIEWER_PACKETS');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const q=read(queryFile),a=read(reviewerAFile),b=read(reviewerBFile);
if(q.status!=='QUERY_ONLY_UNADJUDICATED_NO_GOLD'||q.labelsVisible!==false||
 q.expectedSceneIds!==null||q.queries?.length!==24)
 throw Error('INVALID_FROZEN_QUERY_SET');
const sceneId=id=>typeof id==='string'&&/^SC50-\d{4}$/.test(id)&&
 Number(id.slice(5))>=1&&Number(id.slice(5))<=1341;
const validPacket=(packet,role)=>{
 if(packet.schema!=='cg-rec-eval-independent-reviewer-packet-v1'||
 packet.role!==role||packet.cases?.length!==24||
 packet.modelPredictionsIncluded!==false||
 packet.otherReviewerLabelsIncluded!==false||
 packet.adjudicationIncluded!==false||
 packet.formalGoldCount!==0||packet.releaseAllowed!==false)
 throw Error('INDEPENDENT_PACKET_CONTRACT_INVALID '+role);
 // Closed schema: unknown keys can conceal engine recommendations under innocuous names.
 const packetKeys=new Set(['schema','status','role','sourceStatus','sourceQueryCount',
  'instructions','scoreScale','cases','modelPredictionsIncluded',
  'otherReviewerLabelsIncluded','adjudicationIncluded','formalGoldCount','releaseAllowed']);
 if(Object.keys(packet).some(k=>!packetKeys.has(k)))
  throw Error('UNKNOWN_REVIEWER_PACKET_FIELD '+role);
 if(packet.status!=='UNLABELED_REVIEWER_PACKET_NOT_GOLD'||
  packet.sourceStatus!=='QUERY_ONLY_UNADJUDICATED_NO_GOLD'||
  packet.sourceQueryCount!==24)
  throw Error('REVIEWER_PACKET_SOURCE_STATUS_INVALID '+role);
 const ids=new Set(),reviewerIds=new Set();
 for(let i=0;i<24;i++){
  const c=packet.cases[i],src=q.queries[i];
  if(c.query_id!==src.id||c.group!==src.group||c.query!==src.query||
   ids.has(c.query_id)||c.status!=='LOCKED'||
   typeof c.assessor_id!=='string'||!c.assessor_id.trim()||
   typeof c.rationale!=='string'||!c.rationale.trim()||
   typeof c.none_relevant!=='boolean'||!Array.isArray(c.scene_relevance)||
   !Array.isArray(c.source_catalog_evidence))
   throw Error('INCOMPLETE_LOCKED_CASE '+role+' '+src.id);
  ids.add(c.query_id);reviewerIds.add(c.assessor_id);
  const caseKeys=new Set(['query_id','group','query','status','assessor_id',
   'scene_relevance','none_relevant','rationale','source_catalog_evidence']);
  if(Object.keys(c).some(k=>!caseKeys.has(k)))
   throw Error('UNKNOWN_REVIEWER_CASE_FIELD '+role+' '+src.id);
  const seen=new Set();
  for(const item of c.scene_relevance){
   if(!item||!sceneId(item.scene_id)||!Number.isInteger(item.grade)||
    item.grade<0||item.grade>3||seen.has(item.scene_id))
    throw Error('INVALID_SCENE_GRADE '+role+' '+src.id);
   seen.add(item.scene_id);
  }
  if(c.none_relevant===c.scene_relevance.some(x=>x.grade>=2))
   throw Error('NONE_RELEVANT_CONFLICT '+role+' '+src.id);
  if(!c.source_catalog_evidence.length)
   throw Error('CATALOG_EVIDENCE_REQUIRED '+role+' '+src.id);
 }
 if(reviewerIds.size!==1)throw Error('REVIEWER_ID_INCONSISTENT '+role);
 return [...reviewerIds][0];
};
const assessorA=validPacket(a,'annotator_A'),assessorB=validPacket(b,'annotator_B');
if(assessorA===assessorB)throw Error('NOT_TWO_DISTINCT_REVIEWERS');
const cases=[];
for(let i=0;i<24;i++){
 const left=new Map(a.cases[i].scene_relevance.map(x=>[x.scene_id,x.grade]));
 const right=new Map(b.cases[i].scene_relevance.map(x=>[x.scene_id,x.grade]));
 const union=new Set([...left.keys(),...right.keys()]);
 let bothJudged=0,gradeDisagreements=0,missingLeft=0,missingRight=0;
 for(const id of union){
  if(!left.has(id))missingLeft++;
  else if(!right.has(id))missingRight++;
  else{bothJudged++;if(left.get(id)!==right.get(id))gradeDisagreements++;}
 }
 cases.push({query_id:q.queries[i].id,group:q.queries[i].group,
  unionSceneCount:union.size,bothJudged,missingLeft,missingRight,
  gradeDisagreements,noneRelevantDisagrees:a.cases[i].none_relevant!==b.cases[i].none_relevant,
  readyForAdjudication:missingLeft===0&&missingRight===0});
}
const incomplete=cases.filter(x=>!x.readyForAdjudication);
console.log(JSON.stringify({status:incomplete.length?'TWO_LOCKED_REVIEWS_REQUIRE_POOL_COMPLETION':'TWO_LOCKED_REVIEWS_READY_FOR_ADJUDICATION',
 sourceQueries:24,independentReviewers:2,
 casesReadyForAdjudication:24-incomplete.length,
 casesNeedingPoolCompletion:incomplete.length,
 gradeDisagreementCases:cases.filter(x=>x.gradeDisagreements>0).length,
 noneRelevantDisagreementCases:cases.filter(x=>x.noneRelevantDisagrees).length,
 cases,formalGoldCount:0,releaseAllowed:false},null,2));
