// Preview-only adapter for the audited Chinese Core20K V0.10.1 full terms[] asset.
// Never rewrite term_id, infer frequency, or change the approved 3553-link baseline.
export const V0101_SHA256='18adea58a3615935c1b632c22934a91855171063862f7471999f9900415e8093';
export function adaptChineseV0101(payload){
 if(payload?.data_version!=='0.10.1-evidence-compat'||
    payload.runtime_version!=='0.9.4-rc.2-compatible'||
    payload.contract_version!=='1.1'||
    payload.integration_ready!==true||payload.production_ready!==false||
    !Array.isArray(payload.terms)||payload.terms.length!==20000)
   throw Error('SCENE500_V0101_CONTRACT');
 const ids=new Set(),surfaces=new Set();
 const terms=payload.terms.map(t=>{
  if(!/^zh_[0-9a-f]{20}$/.test(t?.term_id??'')||
    typeof t.term!=='string'||!t.term||
    typeof t.normalized_term!=='string'||!t.normalized_term||
    ids.has(t.term_id)||surfaces.has(t.term))throw Error('SCENE500_V0101_IDENTITY');
  ids.add(t.term_id);surfaces.add(t.term);
  return {term_id:t.term_id,term:t.term,normalized_term:t.normalized_term,
   frequency_rank:t.frequency_rank??null,frequency_score:t.frequency_score??null,
   pos:t.pos??null,aliases:Array.isArray(t.aliases)?t.aliases:[],
   source_version:t.source_version??payload.data_version};
 });
 return {source_version:payload.data_version,terms};
}
export async function verifyChineseV0101Bytes(bytes){
 if(!globalThis.crypto?.subtle)throw Error('SCENE500_V0101_HASH_UNAVAILABLE');
 const hash=await crypto.subtle.digest('SHA-256',bytes);
 const actual=[...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
 if(actual!==V0101_SHA256)throw Error('SCENE500_V0101_HASH_MISMATCH');
 return adaptChineseV0101(JSON.parse(new TextDecoder().decode(bytes)));
}
