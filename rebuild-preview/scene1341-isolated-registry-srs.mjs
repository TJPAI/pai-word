/* Scene1341 V2 independent KU registry and SRS storage boundary.
 * This is a quarantine-facing contract, NOT a new learning runtime.
 * It cannot produce a native study queue or modify ANY storage. The existing
 * Scene500 native UI/gesture/audio/state machine remains the sole owner.
 *
 * Future activation requires audited per-KU Master approvals, QA on visible
 * teaching content, formal release, and a separately verified SRS adapter.
 */
import {inspectScene1341ProvisionalRecord} from './scene1341-provisional-intake.mjs';

export const SC1341_KU_NAMESPACE='scene1341-v2';
export const SC1341_SRS_STORAGE_KEY='pai-word:scene1341-v2:srs:v1';
export const SC1341_SRS_SNAPSHOT_SCHEMA='pai-word-scene1341-v2-srs-v1';
const KU=/^SC1341-KU-\d{5,}$/;
const SCENE=/^SC50-\d{4}$/;
const LEGACY_SRS_KEYWORDS=/^(?:pai-word-(?:preview|core20k|scene500|learning)|pai-word:scene500)/i;
const hasOwn=(obj,k)=>Object.prototype.hasOwnProperty.call(obj,k);

function assertQuarantineRecord(record){
  if(!record||!KU.test(record.scene_ku_id||'')||
    !SCENE.test(record.scene_id||'')||
    !Number.isSafeInteger(record.source_rank)||record.source_rank<1)
    throw Error('SC1341_REGISTRY_INVALID_KU_SOURCE');
  return record;
}

/** Build a separate, non-native registry from quarantine records only. */
export function createScene1341QuarantineRegistry({records=[],authorizations={}}={}){
  if(!Array.isArray(records)||!authorizations||typeof authorizations!=='object')
    throw Error('SC1341_REGISTRY_INVALID_INPUT');
  const byId=new Map(),sceneRanks=new Set(),sceneCounts=new Map();
  for(const item of records){
    const r=assertQuarantineRecord(item);
    const key=r.scene_id+':'+r.source_rank;
    if(byId.has(r.scene_ku_id)||sceneRanks.has(key))
      throw Error('SC1341_REGISTRY_DUPLICATE_ID_OR_RANK');
    const result=inspectScene1341ProvisionalRecord(
      r,hasOwn(authorizations,r.scene_ku_id)?authorizations[r.scene_ku_id]:null);
    byId.set(r.scene_ku_id,Object.freeze({
      kuId:r.scene_ku_id,sceneId:r.scene_id,sourceRank:r.source_rank,
      sourceSenseId:r.source_sense_id,sourcePackBlob:r.source_pack_blob,
      acceptedForQuarantine:result.accepted,stagingEligible:result.stagingEligible,
      decision:result.reason
    }));
    sceneRanks.add(key);
    sceneCounts.set(r.scene_id,(sceneCounts.get(r.scene_id)||0)+1);
  }
  const entries=Object.freeze([...byId.values()]);
  // Explicitly no "byKU" alias: PAI_START_POLICY_SESSION expects
  // PAI_CORE.byKU native units, which these quarantined drafts are NOT.
  return Object.freeze({
    namespace:SC1341_KU_NAMESPACE,records:entries.length,
    scenes:sceneCounts.size,quarantined:entries.filter(x=>!x.stagingEligible).length,
    item:(kuId)=>byId.get(kuId)||null,
    listScene:(sceneId)=>Object.freeze(entries.filter(x=>x.sceneId===sceneId)),
    getNativeStudyUnits:()=>Object.freeze([]),
    createStudyQueue:()=>{throw Error('SC1341_REGISTRY_FORMAL_RELEASE_REQUIRED')},
    canCreateStudyQueue:false,canWriteSrs:false,productionReleaseAllowed:false,
    isolatedFromCore20K:true
  });
}

/** Parse a *separate* SRS JSON format without importing or hydrating it. */
export function validateScene1341SrsSnapshot(raw){
  let data;
  try{data=typeof raw==='string'?JSON.parse(raw):raw;}
  catch{throw Error('SC1341_SRS_INVALID_JSON')}
  if(!data||typeof data!=='object'||Array.isArray(data)||
    data.schema!==SC1341_SRS_SNAPSHOT_SCHEMA||
    data.namespace!==SC1341_KU_NAMESPACE||
    !Array.isArray(data.items))
    throw Error('SC1341_SRS_WRONG_NAMESPACE_OR_SCHEMA');
  const seen=new Set();
  for(const item of data.items){
    if(!item||!KU.test(item.kuId||'')||seen.has(item.kuId)||
      !SCENE.test(item.sceneId||'')||
      typeof item.due!=='number'||!Number.isFinite(item.due)||item.due<0||
      !Number.isSafeInteger(item.repetitions)||item.repetitions<0||
      !Number.isFinite(item.intervalDays)||item.intervalDays<0)
      throw Error('SC1341_SRS_INVALID_ITEM_OR_DUPLICATE');
    seen.add(item.kuId);
  }
  return Object.freeze({namespace:SC1341_KU_NAMESPACE,entries:seen.size,
    schemaValid:true,restorable:false});
}

/** Storage is inspected under a distinct key; never mutates localStorage. */
export function createScene1341SrsStorageBoundary({storage=null}={}){
  if(storage!=null&&typeof storage.getItem!=='function')
    throw Error('SC1341_SRS_STORAGE_INVALID');
  if(LEGACY_SRS_KEYWORDS.test(SC1341_SRS_STORAGE_KEY))
    throw Error('SC1341_SRS_STORAGE_COLLISION');
  return Object.freeze({
    namespace:SC1341_KU_NAMESPACE,key:SC1341_SRS_STORAGE_KEY,
    canReadForDiagnostics:storage!==null,
    canRestoreForLearning:false,canWriteSrs:false,isolatedSrsVerified:false,
    inspect(){
      if(storage===null)return Object.freeze({present:false,valid:false,restorable:false});
      const raw=storage.getItem(SC1341_SRS_STORAGE_KEY);
      if(raw==null)return Object.freeze({present:false,valid:false,restorable:false});
      try{
        const summary=validateScene1341SrsSnapshot(raw);
        return Object.freeze({present:true,valid:true,entries:summary.entries,restorable:false});
      }catch(error){
        return Object.freeze({present:true,valid:false,reason:String(error.message),restorable:false});
      }
    },
    restore(){throw Error('SC1341_SRS_RELEASE_NOT_APPROVED')},
    write(){throw Error('SC1341_SRS_RELEASE_NOT_APPROVED')},
    clear(){throw Error('SC1341_SRS_RELEASE_NOT_APPROVED')}
  });
}
