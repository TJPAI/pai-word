// Batch 136 experimental, read-only teaching fixture gate.
// No SRS writes, no persistence, no modification of PAI_CORE or existing learning screens.
const KINDS=new Set(['cloze','structure_recognition','special_recognition','sense_recognition']);
export function validateBatch136Fixture(pack,{knownKuIds,knownSenseIds,knownHeadwordIds}={}){
 const errors=[],accepted=[],quarantined=[];
 if(!pack||typeof pack!=='object'||Array.isArray(pack))return {ok:false,errors:['invalid_pack'],accepted,quarantined};
 if(pack.schema_version!=='core20k-runtime-fixture-v1-test-guarded')errors.push('schema_version');
 if(pack.test_only!==true||pack.release_eligible!==false||pack.default_enabled!==false)errors.push('unsafe_pack_flags');
 if(!Array.isArray(pack.records))errors.push('missing_records');
 if(errors.length)return {ok:false,errors,accepted,quarantined,total:pack.records?.length||0};
 if(!(knownKuIds instanceof Set)||!(knownSenseIds instanceof Set)||!(knownHeadwordIds instanceof Set))
  return {ok:false,errors:['identity_sets_required'],accepted,quarantined:pack.records.map((r,index)=>({index,ku_id:r?.ku_id,reasons:['identity_sets_required']})),total:pack.records.length};
 const seen=new Set();
 for(const [index,r] of pack.records.entries()){
  const reasons=[];
  if(!r||typeof r!=='object'||Array.isArray(r)){quarantined.push({index,reasons:['invalid_record']});continue;}
  if(typeof r.ku_id!=='string'||!knownKuIds.has(r.ku_id))reasons.push('unknown_ku');
  if(typeof r.sense_id!=='string'||!knownSenseIds.has(r.sense_id))reasons.push('unknown_sense');
  if(typeof r.headword_id!=='string'||!knownHeadwordIds.has(r.headword_id))reasons.push('unknown_headword');
  if(seen.has(r.ku_id))reasons.push('duplicate_ku');
  seen.add(r.ku_id);
  if(r.test_only!==true||r.release_eligible!==false||r.semantic_verified!==false||r.requires_review!==true)reasons.push('unsafe_record_flags');
  if(!KINDS.has(r.render_kind))reasons.push('unsupported_render_kind');
  if(!r.ku_type||typeof r.ku_type!=='string')reasons.push('missing_ku_type');
  if(typeof r.question!=='string'||!r.question.trim())reasons.push('missing_question');
  if(!r.response||typeof r.response!=='object'||Array.isArray(r.response))reasons.push('missing_response');
  if(!Array.isArray(r.risk_flags)||r.risk_flags.length>0||r.triage?.risk_flags?.length>0)reasons.push('risk_flags');
  if(r.render_kind==='cloze'){
   if(typeof r.response?.answer!=='string'||!r.response.answer.trim())reasons.push('missing_answer');
   if(typeof r.response?.example_en!=='string'||!r.response.example_en.trim()||typeof r.response?.example_zh!=='string'||!r.response.example_zh.trim())reasons.push('missing_bilingual_context');
  }
  // Test-only data can be previewed, but never promoted to an SRS-scored queue.
  if(reasons.length)quarantined.push({index,ku_id:r.ku_id,reasons});
  else accepted.push({...r,automated_srs_scoring_enabled:false,render_only:true});
 }
 return {ok:true,errors,accepted,quarantined,total:pack.records.length,release_eligible:false,test_only:true};
}
export async function loadBatch136Fixture({enabled=false,url,identity,fetcher=globalThis.fetch}={}){
 if(!enabled)return {enabled:false,reason:'disabled',accepted:[],quarantined:[]};
 if(!url)return {enabled:false,reason:'missing_fixture',accepted:[],quarantined:[]};
 try{
  const res=await fetcher(url,{cache:'no-store'});
  if(!res?.ok)return {enabled:false,reason:'http_error',accepted:[],quarantined:[]};
  const result=validateBatch136Fixture(await res.json(),identity);
  return {...result,enabled:result.ok,reason:result.ok?'test_only_render_only':'invalid_fixture'};
 }catch{return {enabled:false,reason:'load_error',accepted:[],quarantined:[]}}
}
