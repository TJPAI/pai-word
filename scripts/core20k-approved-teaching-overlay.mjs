// B217 formal teaching overlay: pure, fail-closed, no SRS or global state writes.
export const OVERLAY_SCHEMA='pai-core20k-approved-overlay-v1';
const isText=x=>typeof x==='string'&&x.trim().length>0;
export function normalizeChineseAnswer(value){
 return String(value??'').normalize('NFKC').trim().replace(/[\s\u3000，。！？；：、,.!?;:（）()]/g,'');
}
export function gradeChineseEquivalent(answer,policy){
 if(!policy||policy.certified!==true||!Array.isArray(policy.accepted)||!policy.accepted.length)return {graded:false,reason:'uncertified_answer_policy'};
 const normalized=normalizeChineseAnswer(answer);
 if(!normalized)return {graded:true,correct:false};
 const accepted=policy.accepted.filter(isText).map(normalizeChineseAnswer);
 return {graded:true,correct:accepted.includes(normalized)};
}
// The answer policy is an explicitly approved allowlist, not a semantic inference engine.
export function validateApprovedOverlay({base,overlay,manifest,enabled=false,verifiedRuntimeSha256,verifiedPackSha256}={}){
 if(!enabled)return {enabled:false,accepted:new Map(),reason:'disabled'};
 const deny=reason=>({enabled:false,accepted:new Map(),reason});
 if(!base?.byKU||!(base.byKU instanceof Map))return deny('base_runtime_missing');
 if(overlay?.schema_version!==OVERLAY_SCHEMA||!Array.isArray(overlay.records))return deny('overlay_schema');
 if(manifest?.schema_version!=='pai-core20k-overlay-manifest-v1')return deny('manifest_schema');
 if(manifest.activation_allowed!==true||manifest.status!=='PRODUCTION_READY'||manifest.authority?.registrar_signed!==true||manifest.authority?.semantic_certified!==true||manifest.authority?.license_approved!==true||manifest.authority?.release_signed!==true)return deny('release_gate');
 if(overlay.records.length===0)return deny('empty_overlay');
 if(!isText(manifest.runtime_sha256)||!isText(manifest.pack_sha256)||!isText(manifest.version)||!isText(manifest.authority?.registrar_id)||!isText(manifest.authority?.release_id))return deny('manifest_incomplete');
 if(manifest.runtime_sha256!==overlay.runtime_sha256||manifest.pack_sha256!==overlay.pack_sha256||manifest.version!==overlay.version)return deny('version_pin_mismatch');
 // Hashes must come from verified raw bytes, never from untrusted manifest self-claims.
 if(verifiedRuntimeSha256!==manifest.runtime_sha256||verifiedPackSha256!==manifest.pack_sha256)return deny('unverified_source_bytes');
 if(!Array.isArray(manifest.reviewed_crosswalk)||manifest.reviewed_crosswalk.length!==overlay.records.length)return deny('crosswalk_missing');
 const crosswalk=new Map();
 for(const row of manifest.reviewed_crosswalk){
  if(!isText(row.ku_id)||crosswalk.has(row.ku_id)||!isText(row.sense_binding)||!isText(row.lemma)||!Number.isInteger(row.rank)||!isText(row.pos)||row.ku_type!=='sense'||row.registrar_approved!==true)return deny('crosswalk_invalid');
  crosswalk.set(row.ku_id,row);
 }
 const accepted=new Map();
 for(const record of overlay.records){
  const id=record?.ku_id,unit=base.byKU.get(id),row=crosswalk.get(id);
  if(!isText(id)||accepted.has(id)||!unit||!row)return deny('identity_mismatch');
  if(unit.w.w!==row.lemma||unit.w.rank!==row.rank||String(unit.w.pos).trim()!==row.pos||unit.s.kuType!=='sense'||record.sense_binding!==row.sense_binding)return deny('ownership_mismatch');
  if(record.content_certified!==true||record.production_ready!==true||!isText(record.example_en)||!isText(record.example_zh)||!isText(record.gloss_zh))return deny('content_gate');
  if(!record.answer_policy||record.answer_policy.certified!==true||!Array.isArray(record.answer_policy.accepted)||!record.answer_policy.accepted.length)return deny('answer_policy');
  // Optional approved teaching fields are display-only; reject malformed values instead
  // of silently displaying incomplete or unreviewed metadata.
  const optional={};
  for(const field of ['collocation','grammar_note','contrast_note']){
   const value=record[field];
   if(value===undefined||value===null||value===''){optional[field]='';continue}
   if(typeof value!=='string'||value.length>1500||!isText(value))return deny('optional_teaching_field_invalid:'+field);
   optional[field]=value.trim();
  }
  accepted.set(id,Object.freeze({ku_id:id,example_en:record.example_en,example_zh:record.example_zh,gloss_zh:record.gloss_zh,gloss_en:record.gloss_en||'',us_ipa:record.us_ipa||'',...optional,answer_policy:record.answer_policy}));
 }
 return {enabled:true,accepted,reason:'approved'};
}
export function teachingDisplay(unit,approved){
 const card=approved?.accepted?.get(unit?.s?.ku_id);
 if(!approved?.enabled||!card)return null;
 return {example_en:card.example_en,example_zh:card.example_zh,gloss_zh:card.gloss_zh,gloss_en:card.gloss_en,us_ipa:card.us_ipa,collocation:card.collocation,grammar_note:card.grammar_note,contrast_note:card.contrast_note};
}
