// Experimental Core20K teaching candidate gate. No side effects or SRS writes.
// Candidates are never playable by this adapter: promotion requires separately audited runtime integration.
export const TEACHING_FLAG='core20kteaching';
export function teachingCandidatesEnabled(search='') {
 return new URLSearchParams(String(search).replace(/^\?/, '')).get(TEACHING_FLAG)==='1';
}
const allowedTypes=new Set(['sense','grammar','collocation','contrast','pronunciation','usage','risk']);
const REQUIRED_CARD_FIELDS=Object.freeze({sense:['prompt','answer'],grammar:['prompt','answer'],collocation:['prompt','answer'],contrast:['prompt','answer'],pronunciation:['prompt','answer'],usage:['prompt','answer'],risk:['prompt','answer']});
export function validateTeachingCandidatePack(pack,{knownKuIds,knownSenseIds,knownHeadwordIds}={}) {
 const errors=[];
 if(!pack||typeof pack!=='object'||Array.isArray(pack))return {ok:false,errors:['invalid_pack'],accepted:[],quarantined:[]};
 if(pack.schema_version!=='pai-core20k-teaching-candidates-v1')return {ok:false,errors:['schema_version'],accepted:[],quarantined:[],total:Array.isArray(pack.candidates)?pack.candidates.length:0};
 if(!Array.isArray(pack.candidates))return {ok:false,errors:[...errors,'missing_candidates'],accepted:[],quarantined:[]};
 if(!(knownKuIds instanceof Set)||!(knownSenseIds instanceof Set)||!(knownHeadwordIds instanceof Set))return {ok:false,errors:['identity_sets_required'],accepted:[],quarantined:pack.candidates.map((c,index)=>({index,ku_id:c?.ku_id,reasons:['identity_sets_required']})),total:pack.candidates.length};
 const seen=new Set(),accepted=[],quarantined=[];
 for(const [index,c] of pack.candidates.entries()){
  const reason=[];
  if(!c||typeof c!=='object'){quarantined.push({index,reasons:['invalid_candidate']});continue;}
  if(typeof c.ku_id!=='string'||!knownKuIds?.has(c.ku_id))reason.push('unknown_ku');
  if(typeof c.sense_id!=='string'||!knownSenseIds?.has(c.sense_id))reason.push('unknown_sense');
  if(typeof c.headword_id!=='string'||!knownHeadwordIds?.has(c.headword_id))reason.push('unknown_headword');
  if(!allowedTypes.has(c.ku_type))reason.push('unknown_ku_type');
  if(seen.has(c.ku_id))reason.push('duplicate_ku');
  seen.add(c.ku_id);
  if(c.review_status!=='approved'||c.semantic_risk===true)reason.push('unapproved_or_risky');
  if(!c.card||typeof c.card!=='object'||Array.isArray(c.card))reason.push('missing_card');
  else if(allowedTypes.has(c.ku_type)&&REQUIRED_CARD_FIELDS[c.ku_type].some(k=>typeof c.card[k]!=='string'||!c.card[k].trim()))reason.push('incomplete_card');
  if(reason.length)quarantined.push({index,ku_id:c.ku_id,reasons:reason});else accepted.push(c);
 }
 return {ok:errors.length===0,errors,accepted,quarantined,total:pack.candidates.length};
}
export async function loadTeachingCandidates({enabled=false,url,knownKuIds,knownSenseIds,knownHeadwordIds,fetcher=globalThis.fetch}={}){
 if(!enabled)return {enabled:false,reason:'disabled',accepted:[],quarantined:[]};
 if(!url||typeof fetcher!=='function')return {enabled:false,reason:'missing_pack',accepted:[],quarantined:[]};
 try{
  const response=await fetcher(url,{cache:'no-store'});
  if(!response?.ok)return {enabled:false,reason:'http_error',accepted:[],quarantined:[]};
  const result=validateTeachingCandidatePack(await response.json(),{knownKuIds,knownSenseIds,knownHeadwordIds});
  return {...result,enabled:result.ok,reason:result.ok?'validated_candidates_only':'invalid_pack'};
 }catch{return {enabled:false,reason:'load_error',accepted:[],quarantined:[]}}
}
