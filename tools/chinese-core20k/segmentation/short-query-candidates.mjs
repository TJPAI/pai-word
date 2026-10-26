// CG-ZH experimental Chinese Core20K short-query candidate segmentation.
// Pure utility, no dependency on Scene500 ranking or production Runtime.
export function segmentCandidates(query, lexicon, options = {}) {
  if (typeof query !== 'string') throw Error('INVALID_QUERY');
  const normalizedQuery = query.normalize('NFC');
  const chars = Array.from(normalizedQuery);
  if (chars.length < 1 || chars.length > 20) throw Error('QUERY_LENGTH');
  if (lexicon == null || typeof lexicon[Symbol.iterator] !== 'function') throw Error('INVALID_LEXICON');
  const dict = new Set();
  for (const term of lexicon) {
    if (typeof term !== 'string') throw Error('INVALID_LEXICON_TERM');
    if (term.length > 0) dict.add(term.normalize('NFC'));
  }
  if (options === null || typeof options !== 'object' || Array.isArray(options)) throw Error('INVALID_OPTIONS');
  const requested = options.maxCandidates ?? 8;
  if (!Number.isInteger(requested) || requested < 1 || requested > 20) throw Error('INVALID_MAX_CANDIDATES');
  const maxCandidates = requested;
  const perPosition = chars.map((_,i) => {
    const matches=[];
    for(let n=1;n<=Math.min(12,chars.length-i);n++){
      const s=chars.slice(i,i+n).join('');
      if(dict.has(s)) matches.push({text:s,next:i+n,known:true});
    }
    // Fallback preserves punctuation, digits, OOV characters; never silently drops input.
    if(!matches.some(m=>m.next===i+1)) matches.push({text:chars[i],next:i+1,known:false});
    return matches.sort((a,b)=> Number(b.known)-Number(a.known) || b.text.length-a.text.length || a.text.localeCompare(b.text));
  });
  const memo=new Map();
  function solve(i){
    if(i===chars.length) return [{tokens:[],knownChars:0,unknownChars:0}];
    if(memo.has(i)) return memo.get(i);
    const out=[];
    for(const m of perPosition[i]) for(const suffix of solve(m.next)){
      out.push({tokens:[m.text,...suffix.tokens],knownChars:suffix.knownChars+(m.known?Array.from(m.text).length:0),unknownChars:suffix.unknownChars+(m.known?0:Array.from(m.text).length)});
    }
    out.sort((a,b)=>a.unknownChars-b.unknownChars || a.tokens.length-b.tokens.length || a.tokens.join('|').localeCompare(b.tokens.join('|')));
    const dedup=[];const seen=new Set();
    for(const x of out){const key=x.tokens.join('\u0000');if(!seen.has(key)){dedup.push(x);seen.add(key)}if(dedup.length>=maxCandidates)break}
    memo.set(i,dedup);return dedup;
  }
  return {query,normalizedQuery,source:'LEXICON_CANDIDATES_NOT_RANKED_SCENE500',candidates:solve(0)};
}
