// Explicit, in-memory isolated test adapter. NEVER auto-import from production bootstrap.
export function mountIsolatedRegisteredPack(core, pack, opts = {}) {
  if (opts.isolated !== true) throw Error('ISOLATED_MODE_REQUIRED');
  if (pack?.schema !== 'pai-word-core20k-registered-isolated-v1' || pack.activation_allowed !== false || pack.runtime_accepted !== false) throw Error('PACK_NOT_ISOLATED');
  if (!(core?.byKU instanceof Map) || !(core?.byLemma instanceof Map) || !(core?.byScene instanceof Map)) throw Error('INVALID_ACTIVE_CORE');
  if (!Array.isArray(pack.records) || pack.records.length === 0) throw Error('EMPTY_PACK');
  const seen = new Set(), lemmas = new Set(), newUnits = [];
  for (const r of pack.records) {
    if (!r.ku_id?.startsWith('ku20k_') || !r.lemma || !Number.isInteger(r.rank) || !r.pos || !r.gloss_zh || !r.gloss_en || !r.evidence_locator) throw Error('INCOMPLETE_RECORD');
    if (seen.has(r.ku_id) || core.byKU.has(r.ku_id)) throw Error('KU_ID_COLLISION');
    if (lemmas.has(r.lemma) || core.byLemma.has(r.lemma)) throw Error('LEMMA_COLLISION');
    seen.add(r.ku_id); lemmas.add(r.lemma);
    const w = {rank:r.rank, w:r.lemma, pos:r.pos, ipa:'', ipaUS:'', ipaUK:'', root:'', s:{}, loaded:true, isolatedCore20K:true};
    const s = {ku_id:r.ku_id, sense_id:r.evidence_locator, pos:r.pos, scene:'unclassified', kuType:'sense', kuTitle:'释义', m:r.gloss_zh, glossEN:r.gloss_en, c:'',e:[],x:''};
    w.s[r.ku_id] = s;newUnits.push({w,sid:r.ku_id,k:r.ku_id,s,isolatedCore20K:true});
  }
  const scene = core.byScene.get('unclassified') || [];
  if (!Array.isArray(scene)) throw Error('INVALID_SCENE_BUCKET');
  core.byScene.set('unclassified',scene);
  for (const u of newUnits) {core.byKU.set(u.k,u);core.byLemma.set(u.w.w,[u.w]);scene.push(u)}
  return {units:newUnits,allRegistered:seen.size,runtimeAccepted:false,releaseActive:false};
}
