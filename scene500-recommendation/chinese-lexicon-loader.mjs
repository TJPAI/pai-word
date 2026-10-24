// Optional lazy Chinese Core20K assets; failures fall back to the validated Scene500 rule engine.
import {createScene500Recommender} from './engine.mjs';
import {createScene500ContractAdapter} from './contract-adapter.mjs';
import {createChineseV094Index} from './zh-v094-runtime-bridge.mjs';
import {mergeSubjectCandidates} from './subject-intent.mjs';
const format=(base,catalog)=>Object.freeze({
 version:'scene500-rule-fallback-v0.1',
 mode:'rule_fallback',
 search(query,options={}){
  const all=base.search(query,{...options,limit:500}).results.map((r,i)=>({...r,rank:i+1,matchedTerms:[],reason:['rule_match']}));
  const n=Number.isFinite(Number(options.limit))?Math.max(0,Math.min(500,Math.floor(Number(options.limit)))):20;
  return mergeSubjectCandidates({query:String(query??''),total:all.length,results:all},query,{catalog,eligibleSceneIds:options.eligibleSceneIds??null,limit:n});
 },
 getPage:(snapshot,pageIndex=0,pageSize=5)=>base.getPage(snapshot,pageIndex,pageSize)
});
export async function loadScene500WithChineseLexicon({catalog,lexiconUrl,associationUrl,fetchImpl=globalThis.fetch,timeoutMs=4000,signal}={}){
 const fallback=format(createScene500Recommender({catalog}),catalog);
 if(!lexiconUrl||!associationUrl)return fallback;
 const controller=new AbortController();
 const externalAbort=()=>controller.abort();
 if(signal?.aborted)return fallback;
 signal?.addEventListener('abort',externalAbort,{once:true});
 const timer=setTimeout(()=>controller.abort(),Math.max(1,timeoutMs));
 try{
  const [lex,assoc]=await Promise.all([fetchImpl(lexiconUrl,{signal:controller.signal,cache:'force-cache'}),fetchImpl(associationUrl,{signal:controller.signal,cache:'force-cache'})]);
  if(!lex.ok||!assoc.ok)throw Error('SCENE500_ASSET_HTTP_FAILED');
  const [lexText,associationText]=await Promise.all([lex.text(),assoc.text()]);
  // Verify published V0.9.4 + exactly 3553 approved baseline links before
  // constructing the sparse index. A mismatch safely selects rule fallback.
  if(!globalThis.crypto?.subtle)throw Error('SCENE500_HASH_UNAVAILABLE');
  const sha256=async value=>{
   const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
   return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
  };
  const [lexHash,associationHash]=await Promise.all([sha256(lexText),sha256(associationText)]);
  if(lexHash!=='9be43c35c1e0d1b1926c11726acb2d707bb052634e1ebc60ed445e4b35c63335'||
     associationHash!=='d6de9818f5056330b6d57d6b7c728a1457e66a4d241aac173ba7eb1c5f770213')
   throw Error('SCENE500_ASSET_HASH_MISMATCH');
  let [lexicon,associations]=[JSON.parse(lexText),JSON.parse(associationText)];
  if(lexicon?.version!=='0.9.4-rc.2'||associations?.association_version!=='v094-lexical-v0.2'||
    associations?.source?.lexicon_version!==lexicon.version||
    associations?.source?.lexicon_sha256!==lexHash||
    associations?.source?.catalog_sha256!=='35a680bee9ec2fe207c877c82da306b1bc1c77685457cfb489193732453bc4e8'||
    associations?.links?.length!==3553)throw Error('SCENE500_DATA_CONTRACT_MISMATCH');
  if(lexicon?.terms?.length===20000&&lexicon.terms[0]?.id&&lexicon.terms[0]?.t){
   const index=createChineseV094Index(lexicon);
   lexicon={source_version:index.version,terms:lexicon.terms.map(x=>({
    term_id:x.id,term:x.t,normalized_term:x.n,frequency_rank:null,frequency_score:null,
    pos:null,aliases:[],source_version:index.version
   }))};
  }
  const engine=createScene500ContractAdapter({catalog,lexicon,associations});
  return Object.freeze({...engine,mode:'hybrid'});
 }catch(error){
  return Object.freeze({...fallback,failure:String(error?.message||error)});
 }finally{
  clearTimeout(timer);
  signal?.removeEventListener('abort',externalAbort);
 }
}
