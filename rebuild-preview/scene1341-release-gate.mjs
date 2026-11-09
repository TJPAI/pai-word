/* Explicit release gate for Scene1341 Answer-only KU.
 * A QA opinion is not publication permission. Both independent verdicts
 * and Master approval must match the exact source and authored pack blob.
 */
const KU=/^SC1341-KU-\d{5,}$/;
const SHA=/^[a-f0-9]{40}$/;
const PASS='PASS';
export function evaluateScene1341Release({item,manifest,sourceBlob,packBlob}={}){
  const denied=(reason)=>Object.freeze({eligible:false,reason});
  if(!item||!KU.test(item.scene_ku_id||''))return denied('INVALID_KU_ID');
  if(!manifest||manifest.schema_version!=='scene1341-answer-only-release-v1')
    return denied('NO_APPROVED_MANIFEST');
  if(!SHA.test(sourceBlob||'')||!SHA.test(packBlob||''))
    return denied('SOURCE_OR_PACK_BLOB_MISSING');
  if(manifest.source_git_blob!==sourceBlob||manifest.master_approved!==true||
     manifest.master_release_status!=='APPROVED')
    return denied('MASTER_NOT_APPROVED_OR_SOURCE_MISMATCH');
  if(manifest.production_approved!==true)return denied('RELEASE_NOT_APPROVED');
  const entry=(Array.isArray(manifest.entries)?manifest.entries:[]).find(x=>x.scene_ku_id===item.scene_ku_id);
  if(!entry)return denied('KU_NOT_APPROVED');
  if(entry.scene_id!==item.scene_id||entry.source_sense_id!==item.source_sense_id||
     Number(entry.source_rank)!==item.source_rank||entry.pack_git_blob!==packBlob)
    return denied('KU_IDENTITY_OR_PACK_MISMATCH');
  if(entry.cg_qa!=='PASS'||entry.mu_qa!=='PASS'||entry.resolution_status!=='CLOSED')
    return denied('QA_NOT_BOTH_PASS');
  if(entry.approved_for_learning!==true||item.activation_allowed!==true)
    return denied('KU_NOT_ACTIVATED');
  if(Object.hasOwn(item,'question')||!item.answer?.example_en||!item.answer?.example_zh)
    return denied('NOT_ANSWER_ONLY');
  return Object.freeze({eligible:true,reason:'APPROVED'});
}
export function createScene1341ReleaseIndex({manifest,sourceBlob,packBlobsByKu={},items=[]}={}){
  const decisions=new Map();
  for(const item of items){
    if(decisions.has(item.scene_ku_id))throw Error('SCENE1341_RELEASE_DUPLICATE_KU');
    decisions.set(item.scene_ku_id,evaluateScene1341Release({
      item,manifest,sourceBlob,packBlob:packBlobsByKu[item.scene_ku_id]
    }));
  }
  return Object.freeze({count:decisions.size,
    approved:[...decisions.values()].filter(x=>x.eligible).length,
    get:id=>decisions.get(id)||Object.freeze({eligible:false,reason:'UNKNOWN_KU'})});
}
