// B76 opt-in, side-effect-free Core20K runtime catalog adapter.
// Call explicitly from future staging integration after independent content approval.
import {verifyRegistry,planSrsMigration} from './scene500-b73-ku-registry.mjs';
export function buildStagingCatalog(core,entries,sceneLinks,legacyRecords={},options={}) {
 if(!core||!(core.byKU instanceof Map)||!(core.byLemma instanceof Map))throw Error('CORE_CATALOG_REQUIRED');
 if(!options.stagingEnabled)return {enabled:false,reason:'STAGING_DISABLED',core,added:0};
 const approved=entries.filter(e=>e.status==='approved'&&e.production_eligible===true);
 if(approved.length!==entries.length)throw Error('UNAPPROVED_CONTENT_BLOCKED');
 const validation=verifyRegistry(approved,[...core.byKU.keys()]);
 if(!validation.pass)throw Error('REGISTRY_INVALID:'+validation.issues.join(','));
 const units=new Map(core.byKU),byLemma=new Map([...core.byLemma].map(([k,v])=>[k,[...v]]));
 const bindings=new Map(),sceneLinkKeys=new Set();
 for(const e of approved) {
  if(!e.lemma||!e.gloss_zh||!e.pos||!e.ku_type)throw Error('INCOMPLETE_CANONICAL_KU');
  const word={w:e.lemma,rank:e.rank,pos:e.pos,s:{}};
  const sense={sense_id:e.sense_id,ku_id:e.ku_id,kuType:e.ku_type,pos:e.pos,m:e.gloss_zh,scene:'unclassified',c:'',e:[],x:''};
  word.s[e.ku_id]=sense;
  units.set(e.ku_id,{w:word,sid:e.ku_id,s:sense,k:e.ku_id});
  const key=String(e.lemma).toLowerCase();
  if(!byLemma.has(key))byLemma.set(key,[]);
  byLemma.get(key).push(word);
 }
 for(const link of sceneLinks) {
  if(!/^S(00[1-9]|0[1-9][0-9]|[1-4][0-9]{2}|500)$/.test(link.scene_id))throw Error('INVALID_SCENE_ID');
  if(!units.has(link.ku_id)||!approved.some(e=>e.ku_id===link.ku_id))throw Error('UNKNOWN_APPROVED_KU');
  const id=link.scene_id+'|'+link.ku_id;
  if(sceneLinkKeys.has(id))throw Error('DUPLICATE_SCENE_BINDING');
  sceneLinkKeys.add(id);
  if(!bindings.has(link.scene_id))bindings.set(link.scene_id,[]);
  bindings.get(link.scene_id).push(link.ku_id);
 }
 const migration=planSrsMigration(legacyRecords,[...core.byKU.keys()],[...units.keys()],[]);
 if(!migration.pass)throw Error('UNSAFE_SRS_MIGRATION');
 return {enabled:true,byKU:units,byLemma,sceneBindings:bindings,
   srsRecords:migration.records,pendingRecords:migration.pending,added:approved.length,mutatedCore:false};
}
