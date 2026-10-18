// Safe offline membership validator. Does not load, modify, or activate Core20K content.
export function validateFrozenMembership(payload) {
  const issues=[];
  if(payload?.release!=='Core20K_LongTerm_V2.0.6')issues.push('RELEASE_MISMATCH');
  if(payload?.type!=='MEMBERSHIP_ONLY_NOT_LEARNING_CONTENT')issues.push('NOT_MEMBERSHIP_ONLY');
  const entries=payload?.entries;
  if(!Array.isArray(entries)||entries.length!==20000)return {pass:false,issues:[...issues,'COUNT_NOT_20000']};
  const seen=new Set();
  for(let i=0;i<entries.length;i++){
    const [rank,lemma]=entries[i]||[];
    if(rank!==i+1)issues.push('RANK_MISMATCH:'+i);
    if(typeof lemma!=='string'||!lemma.trim())issues.push('EMPTY_HEADWORD:'+i);
    else {const norm=lemma.toLocaleLowerCase('en');if(seen.has(norm))issues.push('DUPLICATE:'+norm);seen.add(norm)}
  }
  return {pass:issues.length===0,issues,headwords:entries.length,productionReady:false};
}
