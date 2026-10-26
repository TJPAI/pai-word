// B217 optional formal learning-flow boot. Default OFF and zero network requests when OFF.
import {loadApprovedTeachingOverlay,installApprovedTeachingOverlay} from './core20k-approved-overlay-loader.mjs';
const fail=reason=>installApprovedTeachingOverlay({enabled:false,accepted:new Map(),reason},window);
let bootEpoch=0;
export function approvedOverlaySourceUrl(raw,baseUrl){
 try{
  const u=new URL(raw,baseUrl),base=new URL(baseUrl);
  if(u.origin!==base.origin||u.username||u.password||u.search||u.hash||!['http:','https:'].includes(u.protocol))return null;
  return u.href;
 }catch{return null}
}
const hex=bytes=>Array.from(bytes).map(x=>x.toString(16).padStart(2,'0')).join('');
export async function bootApprovedOverlay(config=window.PAI_APPROVED_OVERLAY_CONFIG){
 const epoch=++bootEpoch;
 fail('disabled');
 if(config?.enabled!==true)return {enabled:false,reason:'disabled'};
 // No staging switch, URL query or localStorage override is accepted.
 if(config.mode!=='production'||!config.manifestUrl||!config.overlayUrl||!config.packUrl)return fail('invalid_configuration');
 const urls=[config.manifestUrl,config.overlayUrl,config.packUrl].map(x=>approvedOverlaySourceUrl(x,import.meta.url));
 if(urls.some(x=>!x))return fail('unsafe_source_url');
 const core=window.PAI_CORE;
 if(!(core?.byKU instanceof Map))return fail('runtime_not_ready');
 const controller=new AbortController();
 const fetchBytes=async url=>{
  const response=await fetch(url,{cache:'no-store',credentials:'same-origin',signal:controller.signal});
  if(!response.ok)throw Error('HTTP_'+response.status);
  if(response.redirected===true||!response.url||approvedOverlaySourceUrl(response.url,import.meta.url)!==url)throw Error('RESOURCE_REDIRECT_OR_MISMATCH');
  return new Uint8Array(await response.arrayBuffer());
 };
 try{
  const [manifestBytes,overlayBytes,runtimeBytes,packBytes]=await Promise.all([
   fetchBytes(urls[0]),fetchBytes(urls[1]),
   fetchBytes(new URL('../data/core20k-runtime.json.gz',import.meta.url).href),fetchBytes(urls[2])
  ]);
  const parse=bytes=>JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  const manifest=parse(manifestBytes),overlay=parse(overlayBytes);
  if(manifest.status!=='PRODUCTION_READY'||manifest.activation_allowed!==true)return epoch===bootEpoch?fail('release_gate'):{enabled:false,reason:'superseded'};
  // The SHA of the manifest and overlay can be pinned by the release channel.
  if(!config.manifestSha256||!config.overlaySha256)return epoch===bootEpoch?fail('unsigned_distribution'):{enabled:false,reason:'superseded'};
  const digest=async b=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',b)));
  const [manifestHash,overlayHash]=await Promise.all([digest(manifestBytes),digest(overlayBytes)]);
  if(manifestHash!==config.manifestSha256||overlayHash!==config.overlaySha256)return epoch===bootEpoch?fail('distribution_hash_mismatch'):{enabled:false,reason:'superseded'};
  const result=await loadApprovedTeachingOverlay({enabled:true,base:core,runtimeBytes,packBytes,overlay,manifest});
  if(epoch!==bootEpoch)return {enabled:false,reason:'superseded'};
  return installApprovedTeachingOverlay(result,window);
 }catch(e){if(epoch!==bootEpoch)return {enabled:false,reason:'superseded'};return fail('load_error:'+String(e?.message||e).slice(0,100))}
}
window.PAI_BOOT_APPROVED_TEACHING_OVERLAY=bootApprovedOverlay;
if(window.PAI_APPROVED_OVERLAY_CONFIG?.enabled===true){
 const onReady=()=>bootApprovedOverlay().then(()=>{if(typeof window.render==='function')window.render()});
 if(window.PAI_CORE?.byKU instanceof Map)onReady();
 else window.addEventListener('pai-core-ready',onReady,{once:true});
}
