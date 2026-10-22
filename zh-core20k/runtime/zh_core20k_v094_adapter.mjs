/** Candidate Chinese Core20K v0.9.4 adapter — no Scene500 algorithms. */
export function loadZhCore20K(payload, aliasMap = {}) {
  if (!payload || !Array.isArray(payload.terms) || payload.terms.length !== 20000) throw Error('Expected 20000 terms');
  const byTerm = new Map(), byId = new Map();
  for (const row of payload.terms) {
    const id = row.id ?? row.term_id, t = row.t ?? row.term, n = row.n ?? row.normalized_term;
    if (typeof t !== 'string' || typeof n !== 'string' || !/^zh_[0-9a-f]{20}$/.test(id) || byTerm.has(t) || byId.has(id)) throw Error('Invalid lexicon item');
    const value = {term_id:id, term:t, normalized_term:n, frequency_rank:null, frequency_score:null, pos:null, stopword_hint:row.s===1};
    byTerm.set(t,value); byId.set(id,value);
  }
  const aliases = new Map(Object.entries(aliasMap));
  for (const [from,to] of aliases) if(typeof from!=='string'||typeof to!=='string'||from===to||!byTerm.has(to)) throw Error('Invalid alias');
  function candidates(text) {
    if (typeof text!=='string') return [];
    const q = text.normalize('NFC'), results = [];
    const exact = byTerm.get(q); if (exact) results.push({...exact,match_type:'exact'});
    const target = aliases.get(q);
    if (target && target!==q && byTerm.has(target)) results.push({...byTerm.get(target),match_type:'variant_candidate'});
    return results;
  }
  return {version:payload.version,size:byTerm.size,candidates,find:q=>candidates(q)[0]??null,getById:id=>byId.get(id)??null};
}
