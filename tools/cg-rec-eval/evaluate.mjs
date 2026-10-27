import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import {loadScene500WithChineseLexicon} from '../../scene500-recommendation/chinese-lexicon-loader.mjs';
import {applyObservedQueryCorrections} from '../../scene500-recommendation/observed-query-corrections.mjs';

const [catalogPath,lexiconPath,associationPath,judgePath='tools/cg-rec-eval/gold-provisional-30.v0.1.json']=process.argv.slice(2);
if (!catalogPath||!lexiconPath||!associationPath) throw Error('USAGE: node tools/cg-rec-eval/evaluate.mjs CATALOG LEXICON ASSOCIATIONS [JUDGMENTS]');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const catalog=read(catalogPath),lexicon=read(lexiconPath),associations=read(associationPath),set=read(judgePath);
if(catalog.scene_count!==500||Object.keys(catalog.scenes).length!==500)throw Error('CATALOG_NOT_500');
const respond=v=>({ok:true,json:async()=>v});
const t0=performance.now();
const engine=await loadScene500WithChineseLexicon({catalog,lexiconUrl:'lex',associationUrl:'assoc',fetchImpl:async url=>respond(url==='lex'?lexicon:associations)});
const initializeMs=performance.now()-t0;
if(engine.mode!=='hybrid')throw Error('NOT_HYBRID: cannot attribute fallback results to Hybrid');
const actionModule=process.env.ENABLE_ACTION_OBJECT==='1' ? await import('../../scene500-recommendation/experimental-action-object.mjs') : null;
const variants=['baseline','observed_corrections',...(actionModule?['action_object']:[])];
const quantile=(numbers,p)=>{const a=[...numbers].sort((x,y)=>x-y);return a.length?a[Math.min(a.length-1,Math.ceil(a.length*p)-1)]:null};
const rows=[];
for(const c of set.cases){
 const start=performance.now();
 const original=engine.search(c.query,{limit:500});
 const baselineMs=performance.now()-start;
 const algorithms={
  baseline:{results:original.results.slice(0,10),elapsedMs:baselineMs,mode:engine.mode}
 };
 let time=performance.now();
 const corrected=applyObservedQueryCorrections(original,c.query,{catalog,limit:10});
 algorithms.observed_corrections={results:corrected.results,elapsedMs:performance.now()-time,mode:engine.mode,correctionRule:corrected.correctionRule||null};
 if(actionModule){
  time=performance.now();
  const a=actionModule.compareActionObjectCandidates({...original,results:original.results.slice(0,10)},c.query,{catalog,limit:10});
  algorithms.action_object={results:a.results,elapsedMs:performance.now()-time,mode:engine.mode,candidates:a.candidates.map(x=>x.sceneId)};
 }
 const scores={};
 for(const key of variants){
  const v=algorithms[key];
  const ids=v.results.map(r=>r.sceneId);
  if(ids.length!==new Set(ids).size||ids.some(id=>!catalog.scenes[id]))throw Error('INVALID_SCENE_IDS '+c.id+' '+key);
  const relevance=c.relevance||{};
  const hit=i=>Number(relevance[ids[i]]||0)>=2;
  const first=ids.findIndex((_,i)=>hit(i));
  const dcg=(ranking,k)=>ranking.slice(0,k).reduce((s,id,i)=>s+(Math.pow(2,Number(relevance[id]||0))-1)/Math.log2(i+2),0);
  const ideal=Object.keys(relevance).sort((a,b)=>relevance[b]-relevance[a]);
  const divisor=dcg(ideal,5);
  scores[key]={ids,elapsedMs:v.elapsedMs,top1:hit(0),hit5:ids.slice(0,5).some((_,i)=>hit(i)),hit10:first>=0&&first<10,reciprocalRank:first<0?0:1/(first+1),ndcg5:divisor?dcg(ids,5)/divisor:null,empty:ids.length===0,mode:v.mode,correctionRule:v.correctionRule||null};
 }
 rows.push({id:c.id,query:c.query,group:c.group,annotationStatus:c.annotation_status,scores});
}
const stats=Object.fromEntries(variants.map(k=>{
 const s=rows.map(x=>x.scores[k]);
 const mean=x=>x.reduce((a,b)=>a+b,0)/x.length;
 return [k,{n:s.length,top1:mean(s.map(x=>+x.top1)),hit5:mean(s.map(x=>+x.hit5)),hit10:mean(s.map(x=>+x.hit10)),mrr10:mean(s.map(x=>x.reciprocalRank)),ndcg5:mean(s.map(x=>x.ndcg5??0)),emptyCount:s.filter(x=>x.empty).length,latencyMs:{p50:quantile(s.map(x=>x.elapsedMs),.5),p95:quantile(s.map(x=>x.elapsedMs),.95),p99:quantile(s.map(x=>x.elapsedMs),.99)}}];
}));
console.log(JSON.stringify({status:'PROVISIONAL_GOLD_UNADJUDICATED_NOT_RELEASE_EVIDENCE',catalogSceneCount:500,engineMode:engine.mode,initializeMs,environment:'Node process, not Safari, excludes network/cache load',methodCaveat:'correction action times are incremental transform costs; baseline includes search and correction must add baseline time; unjudged scenes treated 0, so metrics are only provisional.',stats,rows},null,2));
