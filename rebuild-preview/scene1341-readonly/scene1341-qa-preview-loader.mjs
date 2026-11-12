/* Scene1341 standalone learning preview: EXACT CG-QA V2 source-pinned
 * provisional 1778 answers. "Playable" only inside this isolated UI.
 * Never adds records to original PAI_CORE, durable SRS, or production runtime.
 */
const SOURCE='79ad2a35a3922b70cea00976627935c7d34a3630';
const ROOT='https://raw.githubusercontent.com/TJPAI/pai-word/'+SOURCE+'/';
const PATH='tools/core20k_lexicon/qa/';
const MANIFEST='CG_QA_SCENE1341_V51_STAGING_ANSWER_PROVISIONAL_1778_MANIFEST_20261112.v2.json';
const MANIFEST_SHA='f8967fb97573bbccd89b4c645303dd2c983bb1da';
const SHA=/^[0-9a-f]{40}$/;
async function gitBlob(text){
  if(!globalThis.crypto?.subtle)throw Error('PREVIEW_SOURCE_SHA_VERIFICATION_UNAVAILABLE');
  const encoder=new TextEncoder();
  const bytes=encoder.encode(text);
  const prefix=encoder.encode('blob '+bytes.length+'\0');
  const buf=new Uint8Array(prefix.length+bytes.length);
  buf.set(prefix);buf.set(bytes,prefix.length);
  const digest=await crypto.subtle.digest('SHA-1',buf);
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function readPinned(path,expected,{fetchImpl=fetch}={}){
  if(!path.startsWith(PATH)||path.includes('..')||!SHA.test(expected))throw Error('UNTRUSTED_PREVIEW_PATH');
  const resp=await fetchImpl(ROOT+path,{cache:'force-cache'});
  if(!resp.ok)throw Error('PREVIEW_SOURCE_HTTP_'+resp.status);
  const text=await resp.text();
  if(await gitBlob(text)!==expected)throw Error('PREVIEW_SOURCE_BLOB_MISMATCH_'+path);
  return JSON.parse(text);
}
export async function loadScene1341QAProvisional({fetchImpl=fetch}={}){
 const manifest=await readPinned(PATH+MANIFEST,MANIFEST_SHA,{fetchImpl});
 if(manifest.schema!=='cg-qa-v51-provisional-answer-staging-manifest-v2'||
    manifest.counts?.included_cg_pass_no_known_mu_objection!==1778||
    manifest.counts?.blocked!==260||manifest.counts?.shards!==7||
    manifest.global_checks?.production_release_allowed!==false||
    !Array.isArray(manifest.shards)||manifest.shards.length!==7)
   throw Error('PREVIEW_MANIFEST_GATE_REJECTED');
 const shards=await Promise.all(manifest.shards.map(async(shard)=>{
   const pack=await readPinned(shard.path,shard.blob,{fetchImpl});
   if(pack.shard!==shard.shard||pack.records?.length!==shard.counts.included)
     throw Error('PREVIEW_SHARD_COUNT_MISMATCH_'+shard.shard);
   return pack.records;
 }));
 const items=shards.flat(),ids=new Set(),ranks=new Set(),sceneIds=new Set();
 for(const item of items){
  const key=item.scene_id+':'+item.source_rank;
  if(!/^SC1341-KU-\d{5}$/.test(item.scene_ku_id)||
     !/^SC50-\d{4}$/.test(item.scene_id)||
     !Number.isSafeInteger(item.source_rank)||item.source_rank<1||
     ids.has(item.scene_ku_id)||ranks.has(key)||
     item.cg_qa!=='PASS'||item.release_status!=='PROVISIONAL_PENDING_MUSE'||
     item.source_master_authorization_verified!==false||
     item.production_release_allowed!==false||
     !item.expression||!item.answer?.meaning_zh||
     !item.answer?.example_en||!item.answer?.example_zh||
     !Array.isArray(item.answer?.collocations)||
     item.display?.w!==item.expression||item.display?.m!==item.answer.meaning_zh)
       throw Error('PREVIEW_KU_QUARANTINE_GUARD_'+item.scene_ku_id);
  ids.add(item.scene_ku_id);ranks.add(key);sceneIds.add(item.scene_id);
 }
 if(items.length!==1778||sceneIds.size!==10)throw Error('PREVIEW_ANSWER_TOTAL_MISMATCH');
 items.sort((a,b)=>a.scene_id.localeCompare(b.scene_id)||a.source_rank-b.source_rank);
 return Object.freeze({items:Object.freeze(items),scenes:10,total:items.length,
   source:'CG_QA_STAGING_V2_1778',verifiedGitBlob:MANIFEST_SHA,
   excludedBlocked:260,formalCertification:false,productionRelease:false,
   canWriteSrs:false});
}
