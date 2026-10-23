// Core20K v1 additive release gate. No runtime or SRS mutation occurs here.
// An incomplete or unverified producer payload is rejected, not silently promoted.
export const PACK_SCHEMA='pai-core20k-teaching-pack-v1';
export function validateCore20KPack(manifest,pack,{existingKUIds=new Set(),knownHeadwordIds=null}={}){
 if(!manifest||manifest.schema_version!==PACK_SCHEMA||!pack||pack.schema_version!==PACK_SCHEMA)
  throw Error('CORE20K_PACK_SCHEMA');
 if(!/^[a-f0-9]{40}$/.test(manifest.source_commit_sha||'')||!manifest.pack_version||
    !manifest.frozen_membership_version||!Array.isArray(pack.records))
  throw Error('CORE20K_PACK_MANIFEST');
 if(manifest.pack_version!==pack.pack_version||manifest.frozen_membership_version!==pack.frozen_membership_version)
  throw Error('CORE20K_PACK_VERSION_MISMATCH');
 const seen=new Set(),identity=new Set(),eligible=[],blocked=[];
 for(const row of pack.records){
  if(!row||!row.headword_id||!row.headword||!Number.isInteger(row.rank)||row.rank<1||
     !row.sense_id||!row.ku_id||!row.ku_type||!row.pos)
   throw Error('CORE20K_PACK_ROW_IDENTITY');
  if(seen.has(row.ku_id))throw Error('CORE20K_PACK_DUPLICATE_KU');
  seen.add(row.ku_id);
  if(knownHeadwordIds&&!knownHeadwordIds.has(row.headword_id))
   throw Error('CORE20K_PACK_UNKNOWN_HEADWORD');
  // Existing IDs may be referenced, but may never be silently overwritten.
  if(existingKUIds.has(row.ku_id)){blocked.push({ku_id:row.ku_id,reason:'EXISTING_ID_REQUIRES_REVIEWED_CROSSWALK'});continue}
  if(row.quality_status!=='PRODUCTION_READY'||row.evidence_status!=='PRODUCTION_READY'||
    !row.gloss_zh?.trim()||!row.gloss_en?.trim()||
    !row.us_ipa?.trim()||!Array.isArray(row.source_attribution)||!row.source_attribution.length){
   blocked.push({ku_id:row.ku_id,reason:'NOT_CERTIFIED'});continue
  }
  const id=row.headword_id+'|'+row.sense_id+'|'+row.ku_id;
  if(identity.has(id))throw Error('CORE20K_PACK_DUPLICATE_IDENTITY');
  identity.add(id);eligible.push(row)
 }
 if(manifest.record_count!==pack.records.length)throw Error('CORE20K_PACK_COUNT_MISMATCH');
 if(manifest.release_eligible!==true || eligible.length===0)throw Error('CORE20K_PACK_NOT_RELEASE_ELIGIBLE');
 if(blocked.length)throw Error('CORE20K_PACK_CONTAINS_BLOCKED_KU');
 if(manifest.production_ready_ku_count!==eligible.length)throw Error('CORE20K_PACK_ELIGIBLE_COUNT_MISMATCH');
 return Object.freeze({eligible,blocked,total:pack.records.length,packVersion:pack.pack_version,
   sourceCommitSha:manifest.source_commit_sha});
}
export async function verifyPackSHA256(bytes,expected){
 if(!/^[a-f0-9]{64}$/.test(expected||''))throw Error('CORE20K_PACK_HASH_FORMAT');
 if(!globalThis.crypto?.subtle)throw Error('CORE20K_PACK_CRYPTO_UNAVAILABLE');
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 const actual=[...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');
 if(actual!==expected)throw Error('CORE20K_PACK_SHA256_MISMATCH');
 return true
}
export async function inspectCore20KRelease({manifestUrl,fetcher=fetch,existingKUIds=new Set()}={}){
 if(!manifestUrl)return {mode:'stable_runtime',reason:'NO_CERTIFIED_PACK'};
 try{
  const mr=await fetcher(manifestUrl,{cache:'no-store'});if(!mr.ok)throw Error('CORE20K_MANIFEST_HTTP_'+mr.status);
  const manifest=await mr.json();
  if(!manifest?.pack_url||!manifest?.pack_sha256)throw Error('CORE20K_MANIFEST_ASSET');
  const url=new URL(manifest.pack_url,manifestUrl).href;
  const r=await fetcher(url,{cache:'no-store'});if(!r.ok)throw Error('CORE20K_PACK_HTTP_'+r.status);
  const bytes=await r.arrayBuffer();
  await verifyPackSHA256(bytes,manifest.pack_sha256);
  const pack=JSON.parse(new TextDecoder().decode(bytes));
  return {mode:'validated_staging_only',...validateCore20KPack(manifest,pack,{existingKUIds})};
 }catch(error){return {mode:'stable_runtime',reason:String(error?.message||error)}}
}
