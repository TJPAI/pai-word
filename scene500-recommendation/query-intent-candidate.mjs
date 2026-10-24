// Experimental light-weight query intent analyzer; not wired into production Hybrid.
// Bounded rules, no model or network dependency. Evidence is deliberately conservative.
export const QUERY_INTENT_VERSION='scene500-query-intent-v0.1-candidate';
const normalize=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/[\s，。！？、；：,.!?;:]+/g,'');
const NEGATORS=['不要','不想','不坐','不乘','不用','别','避免','拒绝','not ','without ','avoid '];
const CONTRAST=['而是','改成','换成','instead of','rather than'];
const EN_NEG=/\b(?:not|without|avoid|never|dont|don't)\b/i;
const ZH_NEG=/(?:不要|不想|不坐|不乘|不用|别|避免|拒绝)/u;
export function analyzeSceneQuery(query){
 const raw=String(query??'').normalize('NFKC').trim();
 const q=raw.toLowerCase();
 const normalized=normalize(raw);
 const clauses=raw.split(/(?:，|,|；|;|。|\bbut\b|但是|不过|而是|改成|换成)/iu).map(x=>x.trim()).filter(Boolean);
 const negated=[];
 for(const clause of clauses){
  const match=ZH_NEG.exec(clause)||EN_NEG.exec(clause);
  if(!match)continue;
  const after=clause.slice(match.index+match[0].length).replace(/^(?:要|去|做|使用|乘坐|乘|坐)/u,'').trim();
  if(after)negated.push(after);
 }
 return Object.freeze({version:QUERY_INTENT_VERSION,normalized,clauses,
  negatedSpans:negated,hasNegation:ZH_NEG.test(raw)||EN_NEG.test(raw),
  hasContrast:CONTRAST.some(x=>q.includes(x)),
  mixedLanguage:/[\u4e00-\u9fff]/u.test(raw)&&/[a-z]/iu.test(raw)});
}
// Conservative lexical gate: block a term only when a negator immediately scopes it.
// This is not a full parser; ambiguous negation should be evaluated before promotion.
export function isLocallyNegatedTerm(query,term){
 const q=normalize(query),t=normalize(term);
 if(!t||!q.includes(t))return false;
 const neg=/^(?:不要|不想|不坐|不乘|不用|别|避免|拒绝|不|没|无|not|without|avoid|never|dont|don't)$/u;
 let start=q.indexOf(t),positive=false,negative=false;
 while(start!==-1){
  const left=q.slice(Math.max(0,start-4),start);
  const scoped=['不要','不想','不坐','不乘','不用','别','避免','拒绝','不','没','无','not','without','avoid','never','dont',"don't"].some(n=>left.endsWith(n));
  if(scoped)negative=true;else positive=true;
  start=q.indexOf(t,start+Math.max(1,t.length));
 }
 return negative&&!positive;
}
