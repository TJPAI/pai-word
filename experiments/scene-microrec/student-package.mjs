// Browser ESM shared student encoder. UTF8 FNV1a matches train-student.py.
const utf8=new TextEncoder();
function hash(token){let h=2166136261;for(const b of utf8.encode(token))h=Math.imul(h^b,16777619)>>>0;return h;}
function toks(s){const found=String(s??'').toLowerCase().match(/[\u3400-\u9fff]+|[a-z0-9]+/gu)||[],out=new Set();for(const word of found){if(/[\u3400-\u9fff]/u.test(word)){for(let n of [2,3])for(let i=0;i+n<=word.length;i++)out.add(word.slice(i,i+n));}else{out.add(word);for(let i=0;i+3<=word.length;i++)out.add(word.slice(i,i+3));}}return out;}
function decode(base64){const s=atob(base64),out=new Int8Array(s.length);for(let i=0;i<s.length;i++)out[i]=s.charCodeAt(i)>127?s.charCodeAt(i)-256:s.charCodeAt(i);return out;}
export function createTrainedStudent(pkg){
 if(pkg?.schema!=='scene-microrec-int8-student-v1'||pkg.hash!=='fnv1a-utf8-32')throw Error('INVALID_STUDENT_PACKAGE');
 const {buckets,dimension,scene_ids:ids}=pkg;
 if(!Number.isInteger(buckets)||!Number.isInteger(dimension)||buckets<1||dimension<1||!Array.isArray(ids))throw Error('BAD_MODEL_SHAPE');
 const W=decode(pkg.weights_b64),P=decode(pkg.prototypes_b64);
 if(W.length!==buckets*dimension||P.length!==ids.length*dimension)throw Error('WEIGHT_LENGTH_MISMATCH');
 return Object.freeze({sceneCount:ids.length,bytes:W.length+P.length,
 search(query,{limit=5,eligibleSceneIds=null}={}){
  const counts=new Map();
  for(const t of toks(query)){let h=hash(t),j=h%buckets;counts.set(j,(counts.get(j)||0)+((h&256)?1:-1));}
  let n=0;for(const v of counts.values())n+=v*v;n=Math.sqrt(n);if(!n)return[];
  const vector=new Float32Array(dimension);
  for(const [bucket,v] of counts)for(let j=0;j<dimension;j++)vector[j]+=W[bucket*dimension+j]*(v/n);
  let magnitude=Math.hypot(...vector);if(!magnitude)return[];for(let j=0;j<dimension;j++)vector[j]/=magnitude;
  const allowed=eligibleSceneIds?new Set(eligibleSceneIds):null,results=[];
  for(let i=0;i<ids.length;i++){if(allowed&&!allowed.has(ids[i]))continue;let s=0;for(let j=0;j<dimension;j++)s+=vector[j]*P[i*dimension+j];if(s>0)results.push({sceneId:ids[i],score:s/127});}
  return results.sort((a,b)=>b.score-a.score||a.sceneId.localeCompare(b.sceneId)).slice(0,limit);
 }});
}
