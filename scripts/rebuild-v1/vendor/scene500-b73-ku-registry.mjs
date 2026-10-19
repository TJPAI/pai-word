// B73 offline-only registry and SRS migration preflight. Never invoked by the app loader.
// Registry identities are explicit, immutable and NOT generated from gloss text.
const nonempty=x=>typeof x==='string'&&x.trim().length>0;
export function verifyRegistry(entries, legacyIds=[]) {
 const issues=[], ku=new Set(legacyIds), semantic=new Set();
 if(ku.size!==legacyIds.length)issues.push('DUPLICATE_LEGACY_ID');
 for(const e of entries) {
  if(!nonempty(e.ku_id)||!nonempty(e.word_id)||!nonempty(e.sense_id)||!nonempty(e.ku_type))issues.push('INCOMPLETE_ENTRY');
  if(!nonempty(e.semantic_key))issues.push('MISSING_SEMANTIC_KEY');
  if(ku.has(e.ku_id))issues.push('KU_ID_COLLISION:'+e.ku_id);
  if(semantic.has(e.semantic_key))issues.push('SEMANTIC_KEY_COLLISION:'+e.semantic_key);
  ku.add(e.ku_id);semantic.add(e.semantic_key);
  if(e.status!=='approved')issues.push('NOT_APPROVED:'+e.ku_id);
 }
 return {pass:issues.length===0,issues,entryCount:entries.length};
}
// No implicit text matching, no implicit remapping, no silent record loss.
// Split needs explicit user-choice or an authorised single destination policy;
// conflicting merges must be quarantined instead of overwriting progress.
export function planSrsMigration(records,oldKnownIds,newKnownIds,transitions=[]) {
 const source=new Set(oldKnownIds),target=new Set(newKnownIds),byFrom=new Map(),issues=[];
 for(const t of transitions) {
  if(!nonempty(t.from)||!Array.isArray(t.to)||t.to.length<1||!['replace','split','merge'].includes(t.type)) {issues.push('INVALID_TRANSITION');continue;}
  if(byFrom.has(t.from))issues.push('DUPLICATE_TRANSITION:'+t.from);
  if(!source.has(t.from))issues.push('UNKNOWN_SOURCE:'+t.from);
  if(t.to.some(id=>!target.has(id)))issues.push('UNKNOWN_TARGET:'+t.from);
  if(t.type==='replace'&&t.to.length!==1)issues.push('REPLACE_REQUIRES_ONE_TARGET:'+t.from);
  byFrom.set(t.from,t);
 }
 const kept={},pending={},proposed=[];
 for(const [id,record] of Object.entries(records)) {
  if(target.has(id)) {kept[id]=record;continue;}
  const tr=byFrom.get(id);
  if(!tr){pending[id]={record,reason:'NO_VERIFIED_MIGRATION'};continue;}
  if(tr.type!=='replace'||tr.to.length!==1){pending[id]={record,reason:'SPLIT_OR_MERGE_REQUIRES_EXPLICIT_RESOLUTION',targets:tr.to};continue;}
  const dest=tr.to[0];
  if(Object.hasOwn(kept,dest)||Object.hasOwn(records,dest)||proposed.some(p=>p.to===dest)){
   pending[id]={record,reason:'DESTINATION_COLLISION',targets:tr.to};continue;
  }
  proposed.push({from:id,to:dest,record});
 }
 // fail closed if transition definitions invalid
 if(issues.length)return {pass:false,issues,records:{...records},pending:{},proposed:[],unchanged:true};
 for(const x of proposed)kept[x.to]=x.record;
 const accounted=new Set([...Object.keys(kept),...Object.keys(pending)]);
 // Keep original source coverage independently: mapped records count as represented.
 const covered=Object.keys(records).every(k=>target.has(k)||Object.hasOwn(pending,k)||proposed.some(p=>p.from===k));
 return {pass:covered,issues:covered?[]:['RECORD_LOSS'],records:kept,pending,proposed:proposed.map(({from,to})=>({from,to})),unchanged:false};
}
