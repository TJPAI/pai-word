// Pure contract for non-lossy, fail-closed 13K-to-20K rich-content migration.
export function classifyLegacyRich({lemma, legacyMatches, targetWord, oldKU, targetKU, rich}) {
  if (!targetWord) return {status:'quarantine_missing_word'};
  if (legacyMatches !== 1) return {status:'quarantine_ambiguous_lemma'};
  if (!oldKU || !targetKU || oldKU.id!==targetKU.id || oldKU.type!==targetKU.type || oldKU.lemma.toLowerCase()!==lemma.toLowerCase() || targetKU.lemma.toLowerCase()!==lemma.toLowerCase()) return {status:'quarantine_ku_identity'};
  const e=Array.isArray(rich?.e)?rich.e:[];
  const c=rich?.c ?? '';
  const x=rich?.x ?? '';
  const collocationCount=Array.isArray(c)?c.length:(String(c).trim()?1:0);
  if (!e.length&&!collocationCount&&!String(x).trim()) return {status:'empty_rich_content'};
  return {status:'review_required',release_eligible:false,content:{e,c,x},source_verified:false};
}
