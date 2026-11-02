import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import {createScene500Recommender} from '../../scene500-recommendation/engine.mjs';
import {loadScene500WithChineseLexicon} from '../../scene500-recommendation/chinese-lexicon-loader.mjs';
const [cp,lp,ap,jp]=process.argv.slice(2);
if(!cp||!lp||!ap||!jp)throw Error('Usage: node engine-level-ab.mjs CATALOG LEXICON ASSOCIATIONS JUDGMENTS');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const [catalog,lexicon,associations,gold]=[cp,lp,ap,jp].map(read);
const respond=value=>({ok:true,json:async()=>value});
const rule=createScene500Recommender({catalog});
const hybrid=await loadScene500WithChineseLexicon({catalog,lexiconUrl:'lex',associationUrl:'assoc',fetchImpl:async u=>respond(u==='lex'?lexicon:associations)});
if(hybrid.mode!=='hybrid')throw Error('EXPECTED_HYBRID_NOT_FALLBACK');
const rows=[],kinds=['rule_only','hybrid_v0101'];
for(const c of gold.cases){
 const scores={};
 for(const [kind,engine] of [['rule_only',rule],['hybrid_v0101',hybrid]]){
  const start=performance.now(),found=engine.search(c.query,{limit:10}).results;
  const elapsedMs=performance.now()-start,ids=found.map(x=>x.sceneId),rel=c.relevance||{};
  const relevant=Object.keys(rel).filter(x=>rel[x]>=2);
  const first=ids.findIndex(x=>relevant.includes(x));
  const dcg=ids.slice(0,5).reduce((sum,id,i)=>sum+(Math.pow(2,rel[id]||0)-1)/Math.log2(i+2),0);
  const ideal=relevant.sort((a,b)=>rel[b]-rel[a]).slice(0,5).reduce((sum,id,i)=>sum+(Math.pow(2,rel[id]||0)-1)/Math.log2(i+2),0);
  scores[kind]={ids,top1:first===0,hit5:first>=0&&first<5,hit10:first>=0,reciprocalRank:first<0?0:1/(first+1),ndcg5:ideal?dcg/ideal:null,empty:!ids.length,excludedTop5:(c.excluded||[]).filter(id=>ids.slice(0,5).includes(id)),elapsedMs};
 }
 rows.push({id:c.id,query:c.query,group:c.group,annotation_status:c.annotation_status,scores});
}
const result={status:'REAL_ENGINE_LEVEL_AB_RULE_VS_HYBRID_PROVISIONAL_LABELS',catalogSceneCount:Object.keys(catalog.scenes).length,hybridMode:hybrid.mode,sourceSHA:process.env.GITHUB_SHA||null,queryCount:rows.length,metrics:{},changes:rows.filter(r=>r.scores.rule_only.ids.join('|')!==r.scores.hybrid_v0101.ids.join('|')).length,rows};
for(const kind of kinds){const v=rows.map(r=>r.scores[kind]);const mean=field=>v.reduce((s,r)=>s+(+r[field]||0),0)/v.length;const arr=v.map(x=>x.elapsedMs).sort((a,b)=>a-b);result.metrics[kind]={n:v.length,top1:mean('top1'),top5:mean('hit5'),top10:mean('hit10'),mrr:mean('reciprocalRank'),ndcg5:mean('ndcg5'),empty:v.filter(x=>x.empty).length,excludedLeakCases:v.filter(x=>x.excludedTop5.length).length,p50Ms:arr[Math.floor(arr.length*.5)],p95Ms:arr[Math.min(arr.length-1,Math.ceil(arr.length*.95)-1)]};}
console.log(JSON.stringify(result,null,2));
