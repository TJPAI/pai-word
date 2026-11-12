/* Source-pinned, compact English Core20K V2 view for QA provisional
 * Scene1341 answer-only KUs. Exact lemma overlap is only lexical evidence:
 * it DOES NOT prove the Scene1341 target Sense is the same.
 * Browser fetch is same-origin GitHub Pages; no external provider.
 */
let pending=null;
const normalize=w=>String(w||'').normalize('NFKC').toLowerCase().replace(/\s+/gu,' ').trim();
export function createEnglishCore20KV2Preview({fetchImpl=fetch}={}){
 let data=null,loading=null;
 async function initialize(){
  if(data)return data;
  if(loading)return loading;
  loading=(async()=>{
   const res=await fetchImpl(new URL('./scene1341-enlex-v2-exact-preview.json',import.meta.url),{cache:'force-cache'});
   if(!res.ok)throw Error('ENLEX_PREVIEW_INDEX_HTTP_'+res.status);
   const value=await res.json();
   if(value.schema!=='pai-scene1341-core20k-v2-exact-lexicon-preview-v1'||
      value.status!=='ISOLATED_PREVIEW_ONLY_NOT_SEMANTICALLY_CERTIFIED'||
      value.source_enlex_commit!=='9a740bd3ce898cff9da778ea0af8a1c4ea07c936'||
      value.source_enlex_manifest_blob!=='30fbd1fdde9d7ee59bc88da6465bbd9b772511a8'||
      value.source_qa_manifest_blob!=='f8967fb97573bbccd89b4c645303dd2c983bb1da'||
      value.source_sense_count!==27471||value.source_qa_ku_count!==1778||
      value.exact_lemma_matches!==Object.keys(value.entries||{}).length||
      value.not_released!==true||value.can_write_srs!==false)
        throw Error('ENLEX_PREVIEW_INDEX_GATE');
   data=value;
   return data;
  })();
  try{return await loading}finally{loading=null}
 }
 async function lookup(expression){
  const index=await initialize();
  const rows=index.entries[normalize(expression)]||[];
  if(!Array.isArray(rows)||rows.length>6||
     rows.some(r=>!r.sense_id||!r.lemma||!r.gloss_zh||!r.gloss_en))
     throw Error('ENLEX_PREVIEW_SENSE_FORMAT');
  return rows;
 }
 return Object.freeze({initialize,lookup,canWriteSrs:false,certified:false});
}
export const englishCore20KV2Preview=createEnglishCore20KV2Preview();
