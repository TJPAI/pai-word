/* Scene1341 answer-only learning queue / bookmark projection.
 * This is an isolated pure-data engine. It intentionally cannot bypass
 * release-gate decisions or mutate the existing PAI Word user session.
 */
import {sceneKuKey,SCENE1341_SRS_SCOPE} from './scene1341-srs-v2.mjs';
const safeScene=id=>/^SC50-\d{4}$/.test(id||'');
const validQueue=q=>Array.isArray(q)&&q.every(x=>typeof x==='string'&&/^SC1341-KU-\d{5,}$/.test(x));
const asInt=(n,def=0)=>Number.isSafeInteger(n)&&n>=0?n:def;
export const SCENE1341_SESSION_SCOPE='scene1341-learning-v2';
export const SCENE1341_BOOKMARK_SCOPE='scene1341-bookmark-v2';
export function buildScene1341StudyQueue({sceneId,items=[],releaseIndex,limit=10,records=new Map(),now=Date.now()}={}){
 if(!safeScene(sceneId))throw Error('SCENE1341_STUDY_SCENE_INVALID');
 if(!releaseIndex||typeof releaseIndex.get!=='function')throw Error('SCENE1341_STUDY_RELEASE_INDEX_REQUIRED');
 if(!Number.isSafeInteger(limit)||limit<1||limit>100)throw Error('SCENE1341_STUDY_LIMIT_INVALID');
 if(!(records instanceof Map))throw Error('SCENE1341_STUDY_RECORDS_INVALID');
 if(!Number.isSafeInteger(now)||now<=0)throw Error('SCENE1341_STUDY_TIME_INVALID');
 const eligible=items.filter(x=>x?.scene_id===sceneId&&releaseIndex.get(x.scene_ku_id).eligible===true);
 const ids=new Set();
 for(const item of eligible){
  sceneKuKey(item.scene_ku_id);
  if(ids.has(item.scene_ku_id))throw Error('SCENE1341_STUDY_DUPLICATE_KU');
  ids.add(item.scene_ku_id);
 }
 eligible.sort((a,b)=>a.source_rank-b.source_rank);
 const due=[],fresh=[];
 for(const item of eligible){
  const k=sceneKuKey(item.scene_ku_id),saved=records.get(k);
  if(saved){
   if(saved.namespace!==SCENE1341_SRS_SCOPE||saved.kuId!==item.scene_ku_id)
    throw Error('SCENE1341_STUDY_FOREIGN_RECORD');
   if(Number(saved.due)<=now)due.push(item.scene_ku_id);
  }else fresh.push(item.scene_ku_id);
 }
 return Object.freeze({sceneId,scope:SCENE1341_SESSION_SCOPE,releaseFiltered:true,
  available:eligible.length,due:due.length,newCount:fresh.length,
  queue:Object.freeze([...due,...fresh].slice(0,limit))});
}
export function createScene1341StudySession({sceneId,queue=[],releaseIndex,bookmark=null}={}){
 if(!safeScene(sceneId)||!validQueue(queue)||new Set(queue).size!==queue.length)
  throw Error('SCENE1341_SESSION_INVALID_QUEUE');
 if(!releaseIndex||typeof releaseIndex.get!=='function')throw Error('SCENE1341_SESSION_RELEASE_INDEX_REQUIRED');
 for(const id of queue)if(releaseIndex.get(id).eligible!==true)throw Error('SCENE1341_SESSION_UNRELEASED_KU');
 let index=0,revealed=false,ratingPending=false;
 if(bookmark){
  if(bookmark.scope!==SCENE1341_BOOKMARK_SCOPE||bookmark.sceneId!==sceneId||
     !queue.includes(bookmark.kuId))throw Error('SCENE1341_BOOKMARK_INVALID');
  index=queue.indexOf(bookmark.kuId);
 }
 const view=()=>Object.freeze({
  scope:SCENE1341_SESSION_SCOPE,sceneId,index,total:queue.length,
  kuId:queue[index]||null,revealed,ratingPending,complete:index>=queue.length
 });
 const check=()=>{const id=queue[index];if(id&&releaseIndex.get(id).eligible!==true)
  throw Error('SCENE1341_SESSION_APPROVAL_REVOKED');return id||null};
 const bookmarkState=()=>{
  const id=check();return id?Object.freeze({scope:SCENE1341_BOOKMARK_SCOPE,sceneId,kuId:id}):null;
 };
 return Object.freeze({
  view,bookmark:bookmarkState,
  reveal(){if(ratingPending)throw Error('SCENE1341_SESSION_RATING_PENDING');check();if(queue.length)revealed=true;return view()},
  next(){if(ratingPending)throw Error('SCENE1341_SESSION_RATING_PENDING');check();index=Math.min(queue.length,index+1);revealed=false;return view()},
  previous(){if(ratingPending)throw Error('SCENE1341_SESSION_RATING_PENDING');index=Math.max(0,index-1);check();revealed=false;return view()},
  async rate({grade,now,attemptId,srs}={}){
   if(ratingPending)throw Error('SCENE1341_SESSION_RATING_PENDING');
   const id=check();if(!id)throw Error('SCENE1341_SESSION_NO_CURRENT_KU');
   if(!revealed)throw Error('SCENE1341_SESSION_ANSWER_NOT_REVEALED');
   if(!srs||srs.namespace!==SCENE1341_SRS_SCOPE||typeof srs.rate!=='function')
    throw Error('SCENE1341_SESSION_SRS_INVALID');
   ratingPending=true;
   try{
    const saved=await srs.rate({kuId:id,grade,now,attemptId,
      kuReleaseEligible:releaseIndex.get(id).eligible===true});
    // Approval may be revoked while the asynchronous store is committing.
    // Never move the study cursor onto a revoked or unverified next KU.
    if(releaseIndex.get(id).eligible!==true)throw Error('SCENE1341_SESSION_APPROVAL_REVOKED_AFTER_COMMIT');
    index++;revealed=false;return Object.freeze({record:saved,view:view(),bookmark:bookmarkState()});
   }finally{ratingPending=false;}
  }
 });
}
