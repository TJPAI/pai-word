// Unified Core20K runtime adapter. Opt-in only: no production state writes.
export function buildCore20KRuntime(payload) {
  if (payload?.schema !== 'pai-core20k-runtime-v1' || payload.headwords?.length !== 20000) throw Error('CORE20K_SCHEMA');
  const words=[],byKU=new Map(),byLemma=new Map(),byRank=new Map(),byScene=new Map();
  for (let i=0;i<payload.headwords.length;i++) {
    const [rank,lemma,pos,ipa,units]=payload.headwords[i];
    if (rank!==i+1 || !lemma || byLemma.has(lemma.toLowerCase())) throw Error('CORE20K_RANK_OR_DUPLICATE');
    const w={rank,w:lemma,pos,ipa,ipaUS:ipa,s:{},loaded:true};
    for (const [id,type,zh,en,eligible] of units) {
      if(!id || byKU.has(id)) throw Error('CORE20K_DUPLICATE_KU');
      const playable=type==='sense' && eligible===true && !!zh?.trim();
      const s={ku_id:id,kuType:type,kuTitle:type==='sense'?'释义':type,scene:'daily',m:zh||'',definition:en||'',e:[],c:'',x:'',playable};
      w.s[id]=s;byKU.set(id,{w,sid:id,k:id,s});
    }
    words.push(w);byRank.set(rank,w);byLemma.set(lemma.toLowerCase(),[w]);
  }
  // The existing app requires a scene index, even before Scene500 overlays are applied.
  const general=[];
  for (const u of byKU.values()) if (u.s.playable) general.push(u);
  byScene.set('daily',general);
  const orphans=payload.compatibility_orphans||[],orphanIds=new Set();
  for(const o of orphans)for(const id of o.ku_ids||[]) {
    if(byKU.has(id)||orphanIds.has(id))throw Error('CORE20K_ORPHAN_COLLISION');
    orphanIds.add(id);
  }
  return {words,byKU,byLemma,byRank,byScene,orphanIds,
    canStudy(id){return byKU.get(id)?.s.playable===true},
    qa:{words:words.length,activeKU:byKU.size,orphanKU:orphanIds.size,playableSense:general.length}};
}
export function assertLegacyKUIdentity(core,legacyIds) {
  const lost=legacyIds.filter(id=>!core.byKU.has(id)&&!core.orphanIds.has(id));
  if(lost.length)throw Error('CORE20K_LEGACY_KU_LOST:'+lost.slice(0,5).join(','));
  return true;
}
