// Optional lazy Chinese Core20K assets; failures fall back to the validated Scene500 rule engine.
import {createScene500Recommender} from './engine.mjs';
import {createScene500ContractAdapter} from './contract-adapter.mjs';
import {createChineseV094Index} from './zh-v094-runtime-bridge.mjs';
import {mergeSubjectCandidates} from './subject-intent.mjs';
import {withExperimentalSceneExtension} from './experimental-association-adapter.mjs';
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
export async function loadScene500WithChineseLexicon({catalog,lexiconUrl,associationUrl,fetchImpl=globalThis.fetch,timeoutMs=4000,signal,onDiagnostic,experimentalExtension=null,enableExperimentalExtension=false}={}){
 const fallback=format(createScene500Recommender({catalog}),catalog);
 if(!lexiconUrl||!associationUrl)return fallback;
 const controller=new AbortController();
 const externalAbort=()=>controller.abort();
 if(signal?.aborted)return fallback;
 signal?.addEventListener('abort',externalAbort,{once:true});
 const deadline=Number.isFinite(Number(timeoutMs))?Math.max(1,Number(timeoutMs)):4000;
 let onAbort;
 const abortPromise=new Promise((_,reject)=>{
  onAbort=()=>reject(Error('SCENE500_ASSET_ABORTED'));
  controller.signal.addEventListener('abort',onAbort,{once:true});
 });
 const timer=setTimeout(()=>controller.abort(),deadline);
 try{
  const work=(async()=>{
  const [lex,assoc]=await Promise.all([fetchImpl(lexiconUrl,{signal:controller.signal,cache:'force-cache'}),fetchImpl(associationUrl,{signal:controller.signal,cache:'force-cache'})]);
  if(!lex.ok||!assoc.ok)throw Error('SCENE500_ASSET_HTTP_FAILED');
  let [lexicon,associations]=await Promise.all([lex.json(),assoc.json()]);
  if(lexicon?.terms?.length===20000&&lexicon.terms[0]?.id&&lexicon.terms[0]?.t){
   const index=createChineseV094Index(lexicon);
   lexicon={source_version:index.version,terms:lexicon.terms.map(x=>({
    term_id:x.id,term:x.t,normalized_term:x.n,frequency_rank:null,frequency_score:null,
    pos:null,aliases:[],source_version:index.version
   }))};
  }
  // Full Core20K deliverables use records[], while compact runtime uses terms[].
  // Preserve every term_id, never derive identity from row positions.
  if(Array.isArray(lexicon?.records)){
   if(lexicon.records.length!==20000)throw Error('SCENE500_INVALID_CHINESE_RECORD_COUNT');
   const version=String(lexicon.source_version??lexicon.version??'');
   if(!version)throw Error('SCENE500_MISSING_CHINESE_SOURCE_VERSION');
   lexicon={source_version:version,terms:lexicon.records.map(r=>({
    term_id:r.term_id,term:r.term,normalized_term:r.normalized_term,
    frequency_rank:r.frequency_rank??null,frequency_score:r.frequency_score??null,
    pos:r.pos??null,aliases:r.aliases??[],source_version:r.source_version??version
   }))};
  }
  // V0.10.1 evidence-compatible delivery exposes full terms[] rather than id/t/n/s.
  // Do not replace each record's provenance source_version with the release version.
  const releaseVersion=String(lexicon?.data_version??lexicon?.source_version??'');
  const isV0101=releaseVersion==='0.10.1-evidence-compat';
  if(isV0101){
   if(lexicon?.integration_ready!==true||lexicon?.production_ready!==false||
      lexicon?.terms?.length!==20000||lexicon?.contract_version!=='1.1')
    throw Error('SCENE500_INVALID_V0101_DELIVERY');
   if(lexicon.terms.some(t=>!t||typeof t.term_id!=='string'||!t.term_id||
      typeof t.term!=='string'||typeof t.normalized_term!=='string'))
    throw Error('SCENE500_INVALID_V0101_TERM');
  }
  const engine=createScene500ContractAdapter({catalog,lexicon,associations});
  if(controller.signal.aborted)throw Error('SCENE500_ASSET_ABORTED');
  // Extension is always opt-in and must use the exact V0.10.1 identity space.
  // Invalid extension rolls back to the known baseline rather than silently mixing edges.
  let active=engine;
  if(enableExperimentalExtension){
   try{
    active=withExperimentalSceneExtension(engine,{catalog,extension:experimentalExtension,enabled:true});
   }catch(extensionError){
    // Invalid optional experimentation must NEVER disable a valid lexical Hybrid base.
    if(typeof onDiagnostic==='function'){
     try{onDiagnostic({code:'SCENE500_EXPERIMENTAL_EXTENSION_REJECTED',reason:String(extensionError?.message??extensionError)});}catch{}
    }
   }
  }
  return Object.freeze({...active,mode:'hybrid',runtimeDataVersion:releaseVersion||engine.lexiconVersion,productionReady:false});
  })();
  return await Promise.race([work,abortPromise]);
 }catch(err){
  // Preserve stable fallback contract, but make offline E2E failures observable.
  if(typeof onDiagnostic==='function'){
   try{onDiagnostic({code:'SCENE500_ASSET_FALLBACK',reason:String(err?.message??err)});}catch{}
  }
  return fallback;
 }finally{
  clearTimeout(timer);
  controller.signal.removeEventListener('abort',onAbort);
  signal?.removeEventListener('abort',externalAbort);
 }
}
