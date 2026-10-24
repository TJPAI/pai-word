// B217 optional formal learning-flow boot. Default OFF and zero network requests when OFF.
import {loadApprovedTeachingOverlay,installApprovedTeachingOverlay} from './core20k-approved-overlay-loader.mjs';
const fail=reason=>installApprovedTeachingOverlay({enabled:false,accepted:new Map(),reason},window);
const hex=bytes=>Array.from(bytes).map(x=>x.toString(16).padStart(2,'0')).join('');
export async function bootApprovedOverlay(config=window.PAI_APPROVED_OVERLAY_CONFIG){
 fail('disabled');
 if(config?.enabled!==true)return {enabled:false,reason:'disabled'};
 // No staging switch, URL query or localStorage override is accepted.
 if(config.mode!=='production'||!config.manifestUrl||!config.overlayUrl||!config.packUrl)return fail('invalid_configuration');
 const core=window.PAI_CORE;
 if(!(core?.byKU instanceof Map))return fail('runtime_not_ready');
 const controller=new AbortController();
 const fetchBytes=async url=>{
  const response=await fetch(url,{cache:'no-store',credentials:'same-origin',signal:controller.signal});
  if(!response.ok)throw Error('HTTP_'+response.status);
  return new Uint8Array(await response.arrayBuffer());
 };
 try{
  const [manifestBytes,overlayBytes,runtimeBytes,packBytes]=await Promise.all([
   fetchBytes(config.manifestUrl),fetchBytes(config.overlayUrl),
   fetchBytes('data/core20k-runtime.json.gz'),fetchBytes(config.packUrl)
  ]);
  const parse=bytes=>JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  const manifest=parse(manifestBytes),overlay=parse(overlayBytes);
  if(manifest.status!=='PRODUCTION_READY'||manifest.activation_allowed!==true)return fail('release_gate');
  // The SHA of the manifest and overlay can be pinned by the release channel.
  if(!config.manifestSha256||!config.overlaySha256)return fail('unsigned_distribution');
  const digest=async b=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',b)));
  const [manifestHash,overlayHash]=await Promise.all([digest(manifestBytes),digest(overlayBytes)]);
  if(manifestHash!==config.manifestSha256||overlayHash!==config.overlaySha256)return fail('distribution_hash_mismatch');
  const result=await loadApprovedTeachingOverlay({enabled:true,base:core,runtimeBytes,packBytes,overlay,manifest});
  return installApprovedTeachingOverlay(result,window);
 }catch(e){return fail('load_error:'+String(e?.message||e).slice(0,100))}
}
window.PAI_BOOT_APPROVED_TEACHING_OVERLAY=bootApprovedOverlay;
if(window.PAI_APPROVED_OVERLAY_CONFIG?.enabled===true){
 const onReady=()=>bootApprovedOverlay().then(()=>{if(typeof window.render==='function')window.render()});
 if(window.PAI_CORE?.byKU instanceof Map)onReady();
 else window.addEventListener('pai-core-ready',onReady,{once:true});
}
