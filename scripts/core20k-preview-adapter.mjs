export function adaptPreviewPack(pack, core) {
  if (pack?.schema !== 'pai-core20k-preview-pack-v1' || pack.activation_allowed !== false || !Array.isArray(pack.cards)) throw Error('NOT_ISOLATED_PREVIEW');
  if (!core?.byKU || !core?.byLemma || !core?.byScene) throw Error('MISSING_CORE_RUNTIME');
  const units=[];const seen=new Set();
  for(const c of pack.cards){
    if(c.ku_id != null || c.state!=='preview_only')throw Error('PREVIEW_CANONICAL_ID_FORBIDDEN');
    if(!Number.isInteger(c.rank)||!c.lemma||!c.gloss_zh||!c.gloss_en||!c.evidence_locator||!c.candidate_key)throw Error('INCOMPLETE_CARD');
    if(seen.has(c.candidate_key))throw Error('DUPLICATE_CANDIDATE');seen.add(c.candidate_key);
    if(core.byLemma.has(c.lemma))throw Error('LEGACY_LEMMA_COLLISION:'+c.lemma);
    const w={rank:c.rank,w:c.lemma,pos:c.pos,ipaUK:'',ipaUS:'',ipa:'',root:'',s:{},allSenses:[]};
    const s={sense_id:c.candidate_key,ku_id:null,pos:c.pos,domain:'',scene:'unclassified',m:c.gloss_zh,c:'',e:[],exampleAudio:[],x:'',kuType:'sense',kuTitle:'释义',en:c.gloss_en};
    units.push({w,sid:c.candidate_key,s,k:null,previewOnly:true});
  }
  return Object.freeze(units);
}
