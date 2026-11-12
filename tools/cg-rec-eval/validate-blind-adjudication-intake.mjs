// Verify frozen independent blind labeling intake is genuinely unlabeled.
// Never convert ranking predictions into gold labels.
import fs from 'node:fs';
const [queriesFile,templateFile]=process.argv.slice(2);
if(!queriesFile||!templateFile)throw Error('TWO_FILES_REQUIRED');
const q=JSON.parse(fs.readFileSync(queriesFile,'utf8'));
const t=JSON.parse(fs.readFileSync(templateFile,'utf8'));
if(q.status!=='QUERY_ONLY_UNADJUDICATED_NO_GOLD'||q.labelsVisible!==false||q.expectedSceneIds!==null)throw Error('QUERY_SET_MUST_BE_UNLABELED');
if(t.schema!=='cg-rec-eval-blind-adjudication-form-v1'||t.status!=='UNLABELED_NO_BLIND_GOLD'||t.officialGold!==false||t.releaseAllowed!==false)throw Error('LABEL_STATUS_INVALID');
if(q.queries.length!==24||t.cases?.length!==24)throw Error('CASE_COUNT_INVALID');
for(let i=0;i<24;i++){
 const source=q.queries[i],entry=t.cases[i];
 if(entry.query_id!==source.id||entry.group!==source.group||entry.query!==source.query)throw Error('QUERY_ID_MISMATCH '+i);
 for(const role of ['annotator_A','annotator_B']){
  const a=entry[role];
  if(a?.status!=='PENDING'||a.assessor_id!==null||a.none_relevant!==null||a.rationale!==null||a.scene_relevance?.length!==0)throw Error('PREJUDGED_BLIND_LABEL '+entry.query_id);
 }
 const a=entry.adjudication;
 if(a?.status!=='PENDING'||a.none_relevant!==null||a.decision_reason!==null||a.scene_relevance?.length!==0)throw Error('PREJUDGED_ADJUDICATION '+entry.query_id);
}
const groups={zh:0,en:0,mixed:0};for(const x of q.queries){if(!(x.group in groups))throw Error('UNKNOWN_GROUP');groups[x.group]++;}
if(Object.values(groups).some(x=>x!==8))throw Error('GROUP_BALANCE_INVALID');
console.log(JSON.stringify({status:'UNLABELED_BLIND_INTAKE_VERIFIED',cases:24,groups,
independentReviewerLabels:0,adjudicatedGold:0,releaseAllowed:false}));
