// B217: formal learning-flow integration. Default OFF; no staging activation path.
import {validateApprovedOverlay} from './core20k-approved-teaching-overlay.mjs';
export async function loadApprovedTeachingOverlay({enabled=false,base,runtimeBytes,packBytes,overlay,manifest}={}){
 const disabled={enabled:false,accepted:new Map(),reason:'disabled'};
 if(!enabled)return disabled;
 const deny=reason=>({enabled:false,accepted:new Map(),reason});
 if(!globalThis.crypto?.subtle)return deny('crypto_unavailable');
 if(!(runtimeBytes instanceof Uint8Array)||!(packBytes instanceof Uint8Array))return deny('source_bytes_missing');
 const sha=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');
 try{
  const [runtimeHash,packHash]=await Promise.all([sha(runtimeBytes),sha(packBytes)]);
  return validateApprovedOverlay({enabled:true,base,overlay,manifest,verifiedRuntimeSha256:runtimeHash,verifiedPackSha256:packHash});
 }catch{return deny('hash_verification_failed')}
}
export function installApprovedTeachingOverlay(result,scope=globalThis){
 // Explicitly clear any previous approved overlay on failed activation.
 const safe=result?.enabled===true&&result.accepted instanceof Map?result:{enabled:false,accepted:new Map(),reason:result?.reason||'not_approved'};
 scope.PAI_APPROVED_TEACHING_OVERLAY=safe;
 return safe;
}
