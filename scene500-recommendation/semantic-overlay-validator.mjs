// Scene500 experimental overlay validator. Pure ESM; no runtime changes.
// Accepts a versioned object {schema_version:'scene500-semantic-overlay-v1', scenes:[{scene_id, expressions:[...]}]}.
export function validateSemanticOverlay(payload, validSceneIds) {
  const errors=[];
  if(!payload || typeof payload!=='object'||Array.isArray(payload))return {ok:false,errors:['payload must be an object']};
  if(payload.schema_version!=='scene500-semantic-overlay-v1')errors.push('unsupported schema_version');
  if(!Array.isArray(payload.scenes))return {ok:false,errors:[...errors,'scenes must be an array']};
  if(payload.scenes.length>500)errors.push('too many scenes');
  const valid=validSceneIds instanceof Set?validSceneIds:new Set(validSceneIds||[]);
  const seen=new Set();
  for(const [i,scene] of payload.scenes.entries()){
    if(!scene||typeof scene!=='object'){errors.push('invalid scene at '+i);continue;}
    const id=scene.scene_id;
    if(typeof id!=='string'||!/^S\d{3}$/.test(id)||!valid.has(id))errors.push('unknown scene_id at '+i);
    if(seen.has(id))errors.push('duplicate scene_id '+id);
    seen.add(id);
    if(!Array.isArray(scene.expressions)||scene.expressions.length===0||scene.expressions.length>50){errors.push('invalid expressions for '+id);continue;}
    const terms=new Set();
    for(const value of scene.expressions){
      if(typeof value!=='string'||value.trim().length<2||value.length>120){errors.push('invalid expression for '+id);continue;}
      const normalized=value.normalize('NFKC').trim();
      if(terms.has(normalized))errors.push('duplicate expression for '+id);
      terms.add(normalized);
    }
  }
  return {ok:errors.length===0,errors,scene_count:payload.scenes.length};
}

// V1.2 uses an S001-S500 keyed object, not the pilot's expression array.
export function validateSemanticOverlayV12(payload,validSceneIds){
 const errors=[];if(payload?.schema!=='pai-scene500-semantic-overlay-v1.2'||!payload.scenes||Array.isArray(payload.scenes)||typeof payload.scenes!=='object')return {ok:false,errors:['invalid v1.2 schema']};
 const ids=Object.keys(payload.scenes),valid=new Set(validSceneIds||[]);
 if(ids.length!==500)errors.push('expected 500 scenes');
 for(const id of ids){const s=payload.scenes[id];if(!/^S\d{3}$/.test(id)||!valid.has(id))errors.push('unknown scene '+id);if(!s||['aliases','actions','objects','example_queries'].some(k=>!Array.isArray(s[k])||s[k].some(v=>typeof v!=='string')))errors.push('invalid fields '+id)}
 return {ok:!errors.length,errors,scene_count:ids.length};
}
