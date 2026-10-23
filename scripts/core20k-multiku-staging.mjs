// Isolated six-KU preflight. Never mutates PAI_CORE or learner/SRS state.
export const KU_TYPES=Object.freeze(['Sense','Grammar','Collocation','Contrast','Pronunciation','Usage/Risk']);
export function validateTeachingKU(row,{knownSenseIds=null,knownKUIds=new Set()}={}){
 const errors=[];
 for(const field of ['headword_id','headword','sense_id','ku_id','pos','teaching_objective','prompt','correct_answer','explanation_zh','example_en','example_zh','quality_status','evidence_status']){
  if(typeof row?.[field]!=='string'||!row[field].trim())errors.push('MISSING_'+field);
 }
 if(!Number.isInteger(row?.rank)||row.rank<1||row.rank>20000)errors.push('INVALID_RANK');
 if(!KU_TYPES.includes(row?.ku_type))errors.push('UNKNOWN_KU_TYPE');
 if(!Array.isArray(row?.related_ku_ids))errors.push('INVALID_RELATED_KU');
 if(!Array.isArray(row?.source_attribution)||!row.source_attribution.length)errors.push('MISSING_SOURCE');
 if(knownSenseIds&&!knownSenseIds.has(row?.sense_id))errors.push('UNRESOLVED_SENSE_ID');
 if(knownKUIds.has(row?.ku_id))errors.push('KU_ID_COLLISION');
 if(row?.ku_type==='Grammar'&&(!row.grammar?.pattern||!row.grammar?.usage_conditions))errors.push('GRAMMAR_STRUCTURE');
 if(row?.ku_type==='Collocation'&&(!row.collocation?.expression||!row.collocation?.usage_context))errors.push('COLLOCATION_STRUCTURE');
 if(row?.ku_type==='Contrast'&&(!row.contrast?.target||!row.contrast?.comparison||!row.contrast?.distinguishing_rule))errors.push('CONTRAST_STRUCTURE');
 if(row?.ku_type==='Pronunciation'&&(!row.pronunciation?.test_target||!row.pronunciation?.ipa_us))errors.push('PRONUNCIATION_STRUCTURE');
 if(row?.ku_type==='Usage/Risk'&&(!row.usage_risk?.incorrect_form||!row.usage_risk?.correct_form))errors.push('USAGE_STRUCTURE');
 const certified=row?.quality_status==='PRODUCTION_READY'&&row?.evidence_status==='PRODUCTION_READY';
 if(!certified)errors.push('NOT_CERTIFIED');
 if(certified&&(!row.gloss_en?.trim()||!row.gloss_zh?.trim()||!row.us_ipa?.trim()))errors.push('MISSING_RUNTIME_FIELDS');
 return {valid:errors.length===0,certified,errors};
}
export function inspectMultiKUStaging(records,{knownSenseIds=null,knownKUIds=new Set()}={}){
 if(!Array.isArray(records))throw Error('MULTIKU_NOT_ARRAY');
 const seen=new Set(),results=[];
 for(const row of records){
  const r=validateTeachingKU(row,{knownSenseIds,knownKUIds});
  if(seen.has(row?.ku_id))r.errors.push('DUPLICATE_KU_ID');
  seen.add(row?.ku_id);
  results.push({ku_id:row?.ku_id,ku_type:row?.ku_type,valid:r.errors.length===0,errors:r.errors});
 }
 return Object.freeze({total:results.length,eligible:results.filter(r=>r.valid).length,
 blocked:results.filter(r=>!r.valid).length,results});
}
