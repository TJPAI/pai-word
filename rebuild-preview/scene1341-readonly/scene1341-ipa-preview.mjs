/* GitHub Pages same-origin pronunciation reference for Scene1341.
 * It never creates IPA from unknown spelling, never calls a third-party API,
 * and never affects the source word, learning queue, or production SRS.
 */
let instance=null;
const SCHEMA='pai-scene1341-core20k-ipa-preview-v1';
export function createScene1341IPAReference({fetchImpl=fetch}={}){
 let data=null,loading=null;
 async function initialize(){
  if(data)return data;
  if(loading)return loading;
  loading=(async()=>{
   const response=await fetchImpl(new URL('./scene1341-ipa-preview.json',import.meta.url),{cache:'force-cache'});
   if(!response.ok)throw Error('SC1341_IPA_INDEX_HTTP_'+response.status);
   const result=await response.json();
   if(result.schema!==SCHEMA||
      result.sourceCore20kBlob!=='56cd4ba51ecc99ce56e4d73c69bae305b68aab5c'||
      result.sourceQAmanifestBlob!=='f8967fb97573bbccd89b4c645303dd2c983bb1da'||
      result.sourceCore20kWords!==20000||result.sourceQAprovisionalKU!==1778||
      result.coveredWords!==457||result.coveredCompositionalPhrases!==616||
      result.missing!==705||
      result.productionRelease!==false||result.canWriteSrs!==false||
      Object.keys(result.entries||{}).length!==1073)
     throw Error('SC1341_IPA_INDEX_SOURCE_GATE');
   for(const [ku,v] of Object.entries(result.entries)){
    if(!/^SC1341-KU-\d{5}$/.test(ku)||!/^\/[^/]+\//u.test(v.ipa||'')||
      !['word','word_by_word'].includes(v.kind)||v.source!=='Core20K'||
      !Array.isArray(v.wordRanks)||!v.wordRanks.length)
      throw Error('SC1341_IPA_INDEX_RECORD_GATE');
   }
   data=result;return data;
  })();
  try{return await loading}finally{loading=null}
 }
 async function lookup(card){
  if(!/^SC1341-KU-\d{5}$/.test(String(card?.scene_ku_id||'')))return null;
  const data=await initialize();
  return data.entries[card.scene_ku_id]||null;
 }
 return Object.freeze({initialize,lookup,releaseAllowed:false,canWriteSrs:false});
}
export const scene1341IPAReference=createScene1341IPAReference();
