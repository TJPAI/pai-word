// B85: non-production grouped-word staging adapter.
// Explicitly import this module in isolated tests; no app bootstrap integration.
import {verifyRegistry,planSrsMigration} from './scene500-b73-ku-registry.mjs';
export function buildGroupedStagingCatalog(core,entries,links,records={},enabled=false){
 if(!enabled)return {enabled:false,reason:'STAGING_DISABLED'};
 if(!core?.byKU || !(core.byKU instanceof Map))throw Error('MISSING_CORE');
 if(entries.some(e=>e.status!=='approved'||e.production_eligible!==true))throw Error('UNAPPROVED');
 const check=verifyRegistry(entries,[...core.byKU.keys()]);
 if(!check.pass)throw Error('REGISTRY_INVALID:'+check.issues.join('|'));
 const byKU=new Map(core.byKU),byLemma=new Map([...core.byLemma].map(([k,v])=>[k,[...v]])),byWordId=new Map(),scenes=new Map();
 const ranks=new Map(),kuSet=new Set(entries.map(e=>e.ku_id));
 for(const e of entries){
  if(!e.lemma||!e.pos||!e.gloss_zh||!Number.isInteger(e.rank)||e.rank<1)throw Error('INVALID_WORD_METADATA');
  if(ranks.has(e.rank)&&ranks.get(e.rank)!==e.word_id)throw Error('RANK_COLLISION');
  ranks.set(e.rank,e.word_id);
  let w=byWordId.get(e.word_id);
  if(w&&(w.w!==e.lemma||w.pos!==e.pos||w.rank!==e.rank))throw Error('WORD_IDENTITY_CONFLICT');
  if(!w){w={rank:e.rank,w:e.lemma,pos:e.pos,s:{}};byWordId.set(e.word_id,w);
   const key=e.lemma.toLowerCase(),arr=byLemma.get(key)||[];byLemma.set(key,[...arr,w]);}
  const s={sense_id:e.sense_id,ku_id:e.ku_id,kuType:e.ku_type,pos:e.pos,m:e.gloss_zh,scene:'unclassified',c:'',e:[],x:''};
  w.s[e.ku_id]=s;byKU.set(e.ku_id,{w,sid:e.ku_id,s,k:e.ku_id});
 }
 const dedupe=new Set();
 for(const x of links){
  if(!/^S(00[1-9]|0[1-9][0-9]|[1-4][0-9]{2}|500)$/.test(x.scene_id)||!kuSet.has(x.ku_id))throw Error('INVALID_SCENE_BINDING');
  const key=x.scene_id+'|'+x.ku_id;if(dedupe.has(key))throw Error('DUPLICATE_SCENE_BINDING');dedupe.add(key);
  scenes.set(x.scene_id,[...(scenes.get(x.scene_id)||[]),x.ku_id]);
 }
 const mig=planSrsMigration(records,[...core.byKU.keys()],[...byKU.keys()],[]);
 if(!mig.pass)throw Error('UNSAFE_MIGRATION');
 return {enabled:true,byKU,byLemma,byWordId,sceneBindings:scenes,records:mig.records,pending:mig.pending,addedKU:entries.length,addedWords:byWordId.size};
}
