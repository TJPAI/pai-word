// Query-only packets for TWO separate independent human reviewers.
// No engine outputs, suggested scenes, confidence scores, or inferred labels.
// Source is the immutable 24-query intake. Packet generation is not adjudication.
import fs from 'node:fs';
const [sourceFile,outputA,outputB]=process.argv.slice(2);
if(!sourceFile||!outputA||!outputB||outputA===outputB)
 throw Error('REQUIRE_QUERY_SOURCE_AND_DISTINCT_REVIEWER_OUTPUTS');
const raw=JSON.parse(fs.readFileSync(sourceFile,'utf8'));
if(raw.status!=='QUERY_ONLY_UNADJUDICATED_NO_GOLD'||raw.labelsVisible!==false||
 raw.expectedSceneIds!==null||raw.queries?.length!==24)
 throw Error('BLIND_SOURCE_NOT_QUERY_ONLY');
const ids=new Set(),groups={zh:0,en:0,mixed:0};
for(const q of raw.queries){
 if(typeof q.id!=='string'||!/^BH\d{3}$/.test(q.id)||ids.has(q.id)||
 !Object.hasOwn(groups,q.group)||typeof q.query!=='string'||!q.query.trim()||
 Object.keys(q).some(k=>!['id','group','query'].includes(k)))
 throw Error('BLIND_QUERY_INTEGRITY');
 ids.add(q.id);groups[q.group]++;
}
if(Object.values(groups).some(n=>n!==8))throw Error('UNBALANCED_BLIND_QUERIES');
function packet(role){
 return {schema:'cg-rec-eval-independent-reviewer-packet-v1',
  status:'UNLABELED_REVIEWER_PACKET_NOT_GOLD',role,
  sourceStatus:raw.status,sourceQueryCount:24,
  instructions:'Use only query and frozen Scene1341 catalog. Never inspect any model output, other reviewer packet, or rankings before personally locking labels. Assign explicit 0-3 grades to assessed scenes; document catalog evidence. No relevant scene is allowed only after actual catalog examination.',
  scoreScale:{0:'irrelevant',1:'weak',2:'relevant',3:'highly relevant'},
  cases:raw.queries.map(q=>({query_id:q.id,group:q.group,query:q.query,
   status:'PENDING',assessor_id:null,scene_relevance:[],none_relevant:null,
   rationale:null,source_catalog_evidence:[]})),
  modelPredictionsIncluded:false,otherReviewerLabelsIncluded:false,
  adjudicationIncluded:false,formalGoldCount:0,releaseAllowed:false};
}
fs.writeFileSync(outputA,JSON.stringify(packet('annotator_A'),null,2)+'\n',{flag:'wx'});
fs.writeFileSync(outputB,JSON.stringify(packet('annotator_B'),null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'TWO_QUERY_ONLY_REVIEWER_PACKETS_CREATED',casesPerReviewer:24,groups,formalGoldCount:0,releaseAllowed:false}));
