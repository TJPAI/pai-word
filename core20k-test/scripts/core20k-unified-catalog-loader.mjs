// Unified Core20K catalog loader. Catalog-only KUs are NOT yet playable.
export function buildUnifiedCore(data,{legacyRequiredIds=[]}={}){
 if(data?.schema!=='pai-word-core20k-unified-catalog-v1'||!Array.isArray(data.headwords)||data.headwords.length!==20000)throw Error('INVALID_UNIFIED_CATALOG');
 const words=[],byLemma=new Map(),byRank=new Map(),byKU=new Map(),byScene=new Map();let rank=1;
 for(const e of data.headwords){if(e.rank!==rank++)throw Error('NONCONTIGUOUS_RANK');const key=e.lemma?.toLowerCase();if(!key||byLemma.has(key))throw Error('DUPLICATE_LEMMA');const w={rank:e.rank,w:e.lemma,pos:e.pos||'',ipaUS:e.us_ipa||'',ipa:e.us_ipa||'',loaded:false,s:{},contentStatus:e.content_status||'unknown',wordId:e.word_id||''};words.push(w);byRank.set(w.rank,w);byLemma.set(key,[w]);for(const id of e.ku_ids||[]){if(byKU.has(id))throw Error('DUPLICATE_KU_ID');const s={ku_id:id,scene:'unclassified',kuType:'sense',kuTitle:'释义',m:'',e:[],c:'',x:'',requiresHydration:true};w.s[id]=s;byKU.set(id,{w,sid:id,k:id,s})}}
 const orphans=data.compatibility_orphans||[],orphanIds=new Set();for(const o of orphans)for(const id of o.ku_ids||[]){if(byKU.has(id)||orphanIds.has(id))throw Error('ORPHAN_KU_COLLISION');orphanIds.add(id)}for(const id of legacyRequiredIds)if(!byKU.has(id)&&!orphanIds.has(id))throw Error('LEGACY_KU_LOST:'+id);
 return {words,byLemma,byRank,byKU,byScene,legacyCompatibility:{orphans,orphanIds},qa:{headwords:words.length,activeKUIds:byKU.size,archivedKUIds:orphanIds.size,playableKU:0}};
}
