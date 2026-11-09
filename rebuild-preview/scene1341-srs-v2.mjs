/* Scene1341-only SRS projection. DOES NOT import or touch legacy PAI state.
 * This engine must be wired to a separately named durable store on release;
 * author drafts are never eligible for commits.
 */
export const SCENE1341_SRS_SCOPE='scene1341-v2';
export const SCENE1341_DURABLE_STORE='pai-word-scene1341-v2';
const DAY=86400000;
const grades=new Set(['again','hard','good']);
export const sceneKuKey=id=>{
  if(!/^SC1341-KU-\d{5,}$/.test(id||''))throw Error('SCENE1341_SRS_INVALID_KU');
  return SCENE1341_SRS_SCOPE+':'+id;
};
// Identical interval policy to memory-schedulers.js basic/session-retrieval-v3.
export function projectScene1341Grade({kuId,grade,previous=null,now,attemptId,repeat=false,sessionKind='scene'}){
  if(!grades.has(grade))throw Error('SCENE1341_SRS_GRADE_INVALID');
  const key=sceneKuKey(kuId);
  if(!Number.isSafeInteger(now)||now<=0)throw Error('SCENE1341_SRS_TIME_INVALID');
  if(typeof attemptId!=='string'||attemptId.length<8)throw Error('SCENE1341_SRS_ATTEMPT_INVALID');
  if(typeof repeat!=='boolean'||!['scene','free'].includes(sessionKind))
    throw Error('SCENE1341_SRS_REVIEW_MODE_INVALID');
  if(previous&&(previous.kuId!==kuId||previous.namespace!==SCENE1341_SRS_SCOPE))
    throw Error('SCENE1341_SRS_FOREIGN_RECORD');
  const prior=previous?.lastStableInterval||previous?.interval||0;
  const record={...(previous||{}),namespace:SCENE1341_SRS_SCOPE,storageKey:key,kuId,
    last:now,lastKnown:grade==='good',lastGrade:grade,
    reps:(previous?.reps||0)+1,learningPending:repeat,srsPolicy:'session-retrieval-v3',
    lastAttemptId:attemptId};
  if(repeat){record.due=now;record.interval=0}
  else{
    const days=sessionKind==='free'&&prior>0?prior/DAY:prior<DAY?1:prior<3*DAY?3:
      Math.max(3,Math.round(prior/DAY*(previous?.lastGrade==='hard'?1.5:2.3)));
    record.interval=days*DAY;record.lastStableInterval=record.interval;
    record.due=sessionKind==='free'&&previous?.due>now?previous.due:now+record.interval;
  }
  if(repeat&&previous?.interval>0)record.lastStableInterval=grade==='again'?0:previous.interval;
  record.intervalMs=record.interval;
  return Object.freeze(record);
}
export function createScene1341Srs({store,releaseApproved=false}={}){
  // The store must be explicitly bound to the separate Scene1341 namespace.
  if(store&& (store.namespace!==SCENE1341_SRS_SCOPE||
      store.storeName!==SCENE1341_DURABLE_STORE||
      typeof store.read!=='function'||typeof store.commit!=='function'))
    throw Error('SCENE1341_SRS_STORE_CONTRACT_INVALID');
  const get=async kuId=>{
    const key=sceneKuKey(kuId);
    if(!store)return null;
    const value=await store.read(key);
    if(value&&(value.namespace!==SCENE1341_SRS_SCOPE||value.kuId!==kuId))
      throw Error('SCENE1341_SRS_FOREIGN_RECORD');
    return value||null;
  };
  async function rate({kuId,grade,now,attemptId,kuReleaseEligible=false,repeat=false,sessionKind='scene'}){
    if(!releaseApproved||!kuReleaseEligible)throw Error('SCENE1341_SRS_NOT_APPROVED');
    if(!store)throw Error('SCENE1341_SRS_STORE_UNAVAILABLE');
    const previous=await get(kuId);
    if(previous?.lastAttemptId===attemptId)return previous;
    const next=projectScene1341Grade({kuId,grade,previous,now,attemptId,repeat,sessionKind});
    // Adapters must implement durable atomic commit and reject attempt replays.
    await store.commit(next.storageKey,next,{expectedAttemptId:previous?.lastAttemptId||null});
    return next;
  }
  return Object.freeze({namespace:SCENE1341_SRS_SCOPE,
    storeName:SCENE1341_DURABLE_STORE,
    releaseApproved,read:get,rate});
}
