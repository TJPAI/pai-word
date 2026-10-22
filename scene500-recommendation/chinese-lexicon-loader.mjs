// Optional lazy Chinese Core20K assets; failures fall back to the validated Scene500 rule engine.
import {createScene500Recommender} from './engine.mjs';
import {createScene500ContractAdapter} from './contract-adapter.mjs';
const format=(base)=>Object.freeze({
 version:'scene500-rule-fallback-v0.1',
 mode:'rule_fallback',
 search(query,options={}){
  const all=base.search(query,{...options,limit:500}).results.map((r,i)=>({...r,rank:i+1,matchedTerms:[],reason:['rule_match']}));
  const n=Number.isFinite(Number(options.limit))?Math.max(0,Math.min(500,Math.floor(Number(options.limit)))):20;
  return {query:String(query??''),total:all.length,results:all.slice(0,n)};
 },
 getPage:(snapshot,pageIndex=0,pageSize=5)=>base.getPage(snapshot,pageIndex,pageSize)
});
export async function loadScene500WithChineseLexicon({catalog,lexiconUrl,associationUrl,fetchImpl=globalThis.fetch,timeoutMs=4000,signal}={}){
 const fallback=format(createScene500Recommender({catalog}));
 if(!lexiconUrl||!associationUrl)return fallback;
 const controller=new AbortController();
 const externalAbort=()=>controller.abort();
 if(signal?.aborted)return fallback;
 signal?.addEventListener('abort',externalAbort,{once:true});
 const timer=setTimeout(()=>controller.abort(),Math.max(1,timeoutMs));
 try{
  const [lex,assoc]=await Promise.all([fetchImpl(lexiconUrl,{signal:controller.signal,cache:'force-cache'}),fetchImpl(associationUrl,{signal:controller.signal,cache:'force-cache'})]);
  if(!lex.ok||!assoc.ok)throw Error('SCENE500_ASSET_HTTP_FAILED');
  const [lexicon,associations]=await Promise.all([lex.json(),assoc.json()]);
  const engine=createScene500ContractAdapter({catalog,lexicon,associations});
  return Object.freeze({...engine,mode:'hybrid'});
 }catch(_err){
  return fallback;
 }finally{
  clearTimeout(timer);
  signal?.removeEventListener('abort',externalAbort);
 }
}
