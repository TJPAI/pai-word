// Independent V0.9.4 RC2 runtime adapter. Never merges exact and variant identities.
// Compact payload rows: {id,t,n,s}, matching zh_core20k_v094_adapter.mjs.
export const CHINESE_V094_CONTRACT='1.1';
export function createChineseV094Index(payload,{aliases={}}={}){
 if(!payload||!Array.isArray(payload.terms)||payload.terms.length!==20000)throw Error('ZH_V094_INVALID_PAYLOAD');
 const byId=new Map(),byTerm=new Map(),byNorm=new Map();
 for(const row of payload.terms){
  const term=row.t??row.term,id=row.id??row.term_id,n=row.n??row.normalized_term;
  if(typeof term!=='string'||!term||typeof n!=='string'||!n||
     typeof id!=='string'||!/^zh_[0-9a-f]{20}$/.test(id)||byId.has(id)||byTerm.has(term))throw Error('ZH_V094_INVALID_IDENTITY');
  const obj={term_id:id,term,normalized_term:n,frequency_rank:null,frequency_score:null,pos:null,
    aliases:[],source_version:String(payload.version??'0.9.4-rc.2'),stopword_hint:row.s===1};
  byId.set(id,obj);byTerm.set(term,obj);
  if(!byNorm.has(n))byNorm.set(n,[]);
  byNorm.get(n).push(obj);
 }
 const entries=Object.entries(aliases);
 const aliasIndex=new Map();
 for(const [from,to] of entries){
  const dest=Array.isArray(to)?to:[to];
  if(!from||!dest.length||dest.some(x=>!byTerm.has(x)))throw Error('ZH_V094_INVALID_ALIAS');
  aliasIndex.set(from,dest);
 }
 function candidates(raw){
  if(typeof raw!=='string')return [];
  const q=raw.normalize('NFC'),out=[],seen=new Set();
  const push=(t,kind)=>{if(t&&!seen.has(t.term_id)){seen.add(t.term_id);out.push({...t,match_type:kind});}};
  push(byTerm.get(q),'exact');
  // Align with Chinese branch exact-first lookup: never mix normalized/variant
  // candidates into a confirmed exact lexical identity.
  if(out.length)return out;
  for(const t of byNorm.get(q)||[])push(t,'normalized_candidate');
  for(const target of aliasIndex.get(q)||[])push(byTerm.get(target),'variant_candidate');
  return out;
 }
 // Overlapping candidate extraction: Trie built on demand, not on initial Home render.
 let trie=null;
 function extract(text,{maxTerms=10}={}){
  if(typeof text!=='string'||!text)return [];
  if(!trie){
   trie=new Map();
   for(const term of byTerm.keys()){
    let node=trie;for(const ch of term){if(!node.has(ch))node.set(ch,new Map());node=node.get(ch);}
    node.set('',term);
   }
  }
  const q=text.normalize('NFC'),spans=[];
  for(let start=0;start<q.length;start++){
   let node=trie;
   for(let end=start;end<q.length;end++){
    node=node.get(q[end]);if(!node)break;
    if(node.has(''))spans.push({start,end:end+1,term:node.get(''),candidates:candidates(node.get(''))});
   }
  }
  // Rank meaningful multi-character spans first. Retain single-character spans only
  // as a fallback when no multi-character candidates exist; keep overlaps visible.
  const multi=spans.filter(x=>x.end-x.start>1);
  const selected=multi.length?multi:spans.filter(x=>!byTerm.get(x.term)?.stopword_hint);
  return selected.sort((a,b)=>(b.end-b.start)-(a.end-a.start)||a.start-b.start).slice(0,Math.min(10,Math.max(0,maxTerms)));
 }
 return Object.freeze({version:String(payload.version??'0.9.4-rc.2'),size:byId.size,candidates,extract,
   find:query=>candidates(query)[0]??null,getById:id=>byId.get(id)??null});
}
