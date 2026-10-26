import {applyObservedQueryCorrections} from './observed-query-corrections.mjs';
// Reviewed routing hypotheses for seven bare academic/public subjects.
// These are generic Scene500 learning/discussion scenes, NOT subject-specific scenes.
// Exact single-subject queries only: do not infer a user's intent from substrings.
export const SUBJECT_INTENT_VERSION='scene500-subject-intent-v0.1';
const SCENE_PRIORITY=Object.freeze({
 '数学':['S126','S141','S137','S151','S132'],
 '物理':['S134','S126','S151','S137','S132'],
 '化学':['S134','S126','S156','S137','S132'],
 '天文':['S137','S126','S151','S122','S132'],
 '哲学':['S132','S137','S126','S151','S144'],
 '政治':['S418','S421','S132','S137','S474'],
 '经济':['S421','S132','S137','S126','S151'],
 '人工智能':['S137','S151','S132','S126','S296'],
 'ai':['S137','S151','S132','S126','S296'],
 '量子计算':['S137','S151','S132','S126','S134'],
 'quantum computing':['S137','S151','S132','S126','S134'],
 'artificial intelligence':['S137','S151','S132','S126','S296']
});
const normalize=s=>String(s??'').normalize('NFKC').trim().toLowerCase();
export function getSubjectSceneCandidates(query,{catalog,eligibleSceneIds=null}={}){
 const key=normalize(query);
 const ids=SCENE_PRIORITY[key];
 if(!ids||!catalog?.scenes)return [];
 const allowed=eligibleSceneIds==null?null:new Set(eligibleSceneIds);
 return ids.filter(id=>catalog.scenes[id]&&(!allowed||allowed.has(id)))
  .map((sceneId,i)=>({
   sceneId,name:catalog.scenes[sceneId].name,score:12-i*1.5,
   quality:catalog.scenes[sceneId].quality,
   matchedTerms:[key],reason:['subject_intent_curated'],
   evidenceStatus:'editorial_mapping_unverified',
   mappingVersion:SUBJECT_INTENT_VERSION
  }));
}
export function mergeSubjectCandidates(snapshot,query,{catalog,eligibleSceneIds=null,limit=20}={}){
 const candidates=getSubjectSceneCandidates(query,{catalog,eligibleSceneIds});
 if(!candidates.length){
  const n=Number.isFinite(Number(limit))?Math.max(0,Math.min(500,Math.floor(Number(limit)))):20;
  return applyObservedQueryCorrections(snapshot,query,{catalog,eligibleSceneIds,limit:n});
 }
 const map=new Map((snapshot.results??[]).map(x=>[x.sceneId,{...x}]));
 for(const x of candidates){
  const prev=map.get(x.sceneId);
  if(prev){
   prev.score=Math.max(prev.score,x.score);
   prev.reason=[...new Set([...(prev.reason??[]),...x.reason])];
  }else map.set(x.sceneId,x);
 }
 const rows=[...map.values()].sort((a,b)=>b.score-a.score||a.sceneId.localeCompare(b.sceneId));
 rows.forEach((row,i)=>{row.rank=i+1;});
 const n=Number.isFinite(Number(limit))?Math.max(0,Math.min(500,Math.floor(Number(limit)))):20;
 return applyObservedQueryCorrections({...snapshot,total:rows.length,results:rows},query,{catalog,eligibleSceneIds,limit:n});
}
