// Isolated dual-catalog adapter. Legacy words remain indexed by their original chunk rank.
export function mountDualCatalog(core, pack, {isolated=false, legacyCount=16616}={}) {
 if(!isolated)throw Error('ISOLATION_REQUIRED');
 if(pack?.schema!=='pai-word-core20k-registered-isolated-v1'||pack.activation_allowed!==false||pack.runtime_accepted!==false)throw Error('UNSAFE_PACK');
 if(!Array.isArray(pack.records)||!pack.records.length)throw Error('EMPTY_PACK');
 if(core?.byKU?.size!==legacyCount||!Array.isArray(core.words)||!(core.byLemma instanceof Map)||!(core.byScene instanceof Map))throw Error('LEGACY_CATALOG_NOT_READY');
 const staged=[],ids=new Set(),lemmas=new Set(),ranks=new Set();
 for(const r of pack.records){
  if(!r.ku_id?.startsWith('ku20k_')||!r.evidence_locator||!r.gloss_en||!r.gloss_zh||!r.lemma||!r.pos||!Number.isInteger(r.rank))throw Error('INCOMPLETE_RECORD');
  const norm=r.lemma.toLocaleLowerCase('en');
  if(ids.has(r.ku_id)||core.byKU.has(r.ku_id))throw Error('KU_COLLISION');
  if(lemmas.has(norm)||[...core.byLemma.keys()].some(x=>x.toLocaleLowerCase('en')===norm))throw Error('LEMMA_COLLISION');
  if(ranks.has(r.rank))throw Error('RANK_COLLISION');
  ids.add(r.ku_id);lemmas.add(norm);ranks.add(r.rank);
  const w={rank:r.rank,w:r.lemma,pos:r.pos,ipa:'',ipaUS:'',ipaUK:'',loaded:true,core20kIncremental:true,s:{}};
  const s={sense_id:r.evidence_locator,ku_id:r.ku_id,scene:'unclassified',pos:r.pos,kuType:'sense',kuTitle:'释义',m:r.gloss_zh,glossEN:r.gloss_en,c:'',e:[],x:''};
  w.s[r.ku_id]=s;staged.push({w,sid:r.ku_id,k:r.ku_id,s,core20kIncremental:true});
 }
 const bucket=core.byScene.get('unclassified');if(bucket&&!Array.isArray(bucket))throw Error('BAD_SCENE_BUCKET');
 if(!bucket)core.byScene.set('unclassified',[]);
 for(const u of staged){core.byKU.set(u.k,u);core.byLemma.set(u.w.w,[u.w]);core.byScene.get('unclassified').push(u)}
 return {incrementalUnits:staged,oldWordIndexUnchanged:true,legacyKUCount:legacyCount,previewOnly:true};
}
export function wrapLegacyEnsureUnits(oldEnsure,core){
 if(typeof oldEnsure!=='function')throw Error('ENSURE_REQUIRED');
 return async keys=>oldEnsure(keys.filter(k=>{const u=core.byKU.get(k);return u&&!u.core20kIncremental}));
}
