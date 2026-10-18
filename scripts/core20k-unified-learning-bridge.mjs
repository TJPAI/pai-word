// Opt-in unified Core20K learning-content bridge. Does not alter the production loader or SRS.
export async function fetchUnifiedLearningBridge(url,{fetcher=fetch}={}){
  const r=await fetcher(url);if(!r.ok)throw Error('CORE20K_BRIDGE_HTTP_'+r.status);
  let data;
  if(url.endsWith('.gz')){
    if(typeof DecompressionStream==='undefined')throw Error('CORE20K_GZIP_UNSUPPORTED');
    const bytes=await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).text();
    data=JSON.parse(bytes);
  }else data=await r.json();
  return validateUnifiedLearningBridge(data);
}
export function validateUnifiedLearningBridge(data){
  if(data?.schema!=='pai-word-core20k-learning-bridge-v1'||!Array.isArray(data.headwords)||data.headwords.length!==20000)throw Error('CORE20K_INVALID_BRIDGE');
  const byLemma=new Map(),byKU=new Map(),ranked=data.headwords;
  for(let i=0;i<ranked.length;i++){
    const w=ranked[i];if(w.rank!==i+1||typeof w.lemma!=='string')throw Error('CORE20K_INVALID_RANK');
    if(byLemma.has(w.lemma))throw Error('CORE20K_DUPLICATE_LEMMA');byLemma.set(w.lemma,w);
    for(const u of w.units||[]){
      if(!u.id||byKU.has(u.id))throw Error('CORE20K_DUPLICATE_KU');
      byKU.set(u.id,{word:w,unit:u,canHydrate:!!(u.eligible&&u.zh&&u.zh.trim())});
    }
  }
  if(byKU.size!==data.registered_ku_ids)throw Error('CORE20K_KU_COUNT_MISMATCH');
  return {data,ranked,byLemma,byKU,canAnswer(id){return !!byKU.get(id)?.canHydrate;}};
}
