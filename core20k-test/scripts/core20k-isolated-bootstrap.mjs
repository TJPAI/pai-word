import {mountDualCatalog,wrapLegacyEnsureUnits} from './core20k-dual-catalog.mjs';
/** Explicit test-only mount after loadLearningCatalog. No production bootstrap import. */
export async function startIsolatedCore20K({core,pack,originalEnsure,legacyCount=16616}) {
  if(!core||!pack||typeof originalEnsure!=='function')throw Error('MISSING_STARTUP_DEPENDENCY');
  const legacyWords=core.words.slice(),legacyIDs=new Set(core.byKU.keys());
  const mounted=mountDualCatalog(core,pack,{isolated:true,legacyCount});
  if(core.words.length!==legacyWords.length||core.words.some((w,i)=>w!==legacyWords[i]))throw Error('LEGACY_WORD_INDEX_CHANGED');
  for(const id of legacyIDs)if(!core.byKU.has(id))throw Error('LEGACY_KU_REMOVED');
  return {...mounted,ensureUnits:wrapLegacyEnsureUnits(originalEnsure,core),legacyIDs:legacyIDs.size};
}
