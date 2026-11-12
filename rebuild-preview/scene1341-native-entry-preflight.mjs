/* Scene1341 -> native Scene500 learner PREFLIGHT ONLY.
 * The native PAI_START_POLICY_SESSION looks up PAI_CORE.byKU and persists the
 * existing SRS. It must NEVER be invoked with unauthorised Scene1341 KU IDs.
 * This contract is deliberately read-only until a separate, audited native
 * Scene1341-v2 registry + SRS namespace is actually implemented.
 */
import {inspectScene1341ProvisionalRecord} from './scene1341-provisional-intake.mjs';
const SCENE=/^SC50-\d{4}$/;
const KU=/^SC1341-KU-\d{5,}$/;
export const SCENE1341_NATIVE_NAMESPACE='scene1341-v2';

export function inspectScene1341NativeEntry({
  sceneId,records=[],authorizations={},nativeRuntime=null
}={}){
  if(!SCENE.test(sceneId||''))throw Error('SCENE1341_NATIVE_INVALID_SCENE');
  if(!Array.isArray(records)||!records.every(r=>r&&typeof r==='object')||
     !authorizations||typeof authorizations!=='object')
    throw Error('SCENE1341_NATIVE_INVALID_INPUT');
  const seen=new Set();
  const decisions=[];
  for(const r of records){
    if(r.scene_id!==sceneId||!KU.test(r.scene_ku_id||'')||seen.has(r.scene_ku_id))
      throw Error('SCENE1341_NATIVE_SCENE_OR_KU_ID_MISMATCH');
    seen.add(r.scene_ku_id);
    const gate=inspectScene1341ProvisionalRecord(
      r,Object.hasOwn(authorizations,r.scene_ku_id)?authorizations[r.scene_ku_id]:null
    );
    decisions.push(Object.freeze({kuId:r.scene_ku_id,
      acceptedForQuarantine:gate.accepted,
      masterAndDisplayStagingEligible:gate.stagingEligible,
      reason:gate.reason}));
  }
  const stagingCandidates=decisions.filter(x=>x.masterAndDisplayStagingEligible).length;
  // Native runtime currently exposes only the Core20K PAI_CORE registry and
  // shared SRS. Even a future CG-MASTER staging PASS must NOT be interpreted
  // as formal production authorization or permission to use that legacy SRS.
  const namespaceImplemented=nativeRuntime?.scene1341Namespace===SCENE1341_NATIVE_NAMESPACE&&
    nativeRuntime?.isolatedSrsVerified===true&&
    nativeRuntime?.v2RegistryVerified===true;
  const blockers=[];
  if(!records.length)blockers.push('NO_SOURCE_VERIFIED_SCENE1341_KU_LOADED');
  if(stagingCandidates!==records.length||!records.length)
    blockers.push('MASTER_ITEM_AUTHORIZATION_OR_DISPLAY_QA_PENDING');
  if(!namespaceImplemented)blockers.push('NATIVE_SCENE1341_REGISTRY_AND_ISOLATED_SRS_NOT_IMPLEMENTED');
  // Formal release is independently blocked for every V2 provisional record.
  blockers.push('FORMAL_RELEASE_NOT_APPROVED');
  return Object.freeze({
    sceneId,sourceRecords:records.length,quarantined:records.length-stagingCandidates,
    provisionalStagingEligible:stagingCandidates,
    nativeRuntimeNamespace:SCENE1341_NATIVE_NAMESPACE,
    nativeRuntimeNamespaceImplemented:namespaceImplemented,
    canEnterNativeLearning:false,canCreateStudyQueue:false,canWriteSrs:false,
    canCallLegacyStartPolicySession:false,productionReleaseAllowed:false,
    blockerCodes:Object.freeze(blockers),decisions:Object.freeze(decisions)
  });
}
