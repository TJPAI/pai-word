// B96-B105: read-only compatibility assessment against existing PAI Word learning-unit shape.
// This script never writes state, calls save, or replaces the app catalog.
export function inspectLearningCompatibility(catalog,sceneBindings,legacyRecords={}) {
 const issues=[], seen=new Set(), memberships=new Map();
 if(!(catalog?.byKU instanceof Map)||!(sceneBindings instanceof Map))throw Error('INVALID_CATALOG');
 for(const [id,u] of catalog.byKU) {
  if(seen.has(id))issues.push('DUPLICATE_KU:'+id);
  seen.add(id);
  if(String(u?.sid)!==String(id)||String(u?.k)!==String(id))issues.push('UNIT_KEY_MISMATCH:'+id);
  if(!u?.w || !u?.s || !u.w.s || u.w.s[id]!==u.s)issues.push('WORD_SENSE_REFERENCE:'+id);
  if(String(u?.s?.ku_id)!==String(id))issues.push('SENSE_KU_MISMATCH:'+id);
 }
 for(const [scene,ids] of sceneBindings){
  if(!Array.isArray(ids)) {issues.push('INVALID_SCENE_BINDING:'+scene);continue;}
  const local=new Set();
  for(const id of ids){
   if(!catalog.byKU.has(id))issues.push('MISSING_BOUND_KU:'+scene+':'+id);
   if(local.has(id))issues.push('DUPLICATE_SCENE_KU:'+scene+':'+id);
   local.add(id);memberships.set(id,(memberships.get(id)||0)+1);
  }
 }
 const preserved=Object.entries(legacyRecords).every(([id,r])=>!catalog.records || JSON.stringify(catalog.records[id])===JSON.stringify(r));
 if(!preserved)issues.push('LEGACY_SRS_RECORD_CHANGED');
 return {pass:issues.length===0,issues,kuCount:catalog.byKU.size,
   crossSceneReuse:[...memberships.values()].filter(x=>x>1).length,
   legacyRecordsPreserved:preserved,productionEnabled:false};
}
