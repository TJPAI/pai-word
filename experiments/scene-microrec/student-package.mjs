// Browser-compatible runtime for trained scene-microrec-int8-student-v1.
// Production suitability and semantic quality are NOT certified.
function bytes(b64){if(typeof atob==='function'){const raw=atob(b64),a=new Int8Array(raw.length);for(let i=0;i<a.length;i++)a[i]=(raw.charCodeAt(i)<<24)>>24;return a;}throw Error('Base64 decoder missing');}
function hexHash(text){throw Error('BLAKE2s32_NOT_AVAILABLE_IN_BROWSER');}
export function validateStudentPackage(p){
 if(p?.schema!=='scene-microrec-int8-student-v1')throw Error('INVALID_STUDENT_SCHEMA');
 if(p.hash!=='blake2s-32')throw Error('UNSUPPORTED_HASH');
 if(!Number.isInteger(p.buckets)||!Number.isInteger(p.dimension))throw Error('INVALID_DIMENSIONS');
 if(!Array.isArray(p.scene_ids)||!p.scene_ids.length)throw Error('MISSING_SCENES');
 const w=bytes(p.weights_b64),proto=bytes(p.prototypes_b64);
 if(w.length!==p.buckets*p.dimension||proto.length!==p.scene_ids.length*p.dimension)throw Error('WEIGHT_SHAPE_MISMATCH');
 return {weights:w,prototypes:proto};
}
