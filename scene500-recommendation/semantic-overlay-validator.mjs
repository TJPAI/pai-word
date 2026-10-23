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
    if(!Array.isArray(scene.expressions)||scene.expressions.length>50){errors.push('invalid expressions for '+id);continue;}
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
