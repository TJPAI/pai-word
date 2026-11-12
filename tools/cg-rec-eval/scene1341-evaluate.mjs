// CG-REC-EVAL: provisional, non-blind Scene1341 lexical A/B. No production data release.
import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import {loadInputs,csv} from '../../scene500-recommendation/scene1341-isolated-search.mjs';
const [catalogPath,rankedDir,sourceCommit,manifestBlob,casesPath]=process.argv.slice(2);
if(![catalogPath,rankedDir,sourceCommit,manifestBlob,casesPath].every(Boolean))throw Error('USAGE CATALOG RANKED_DIR SOURCE_COMMIT MANIFEST_BLOB CASES_JSON');
const catalog=csv(fs.readFileSync(catalogPath,'utf8'));
const index=loadInputs(catalogPath,rankedDir,{sourceCommit,manifestSha:manifestBlob});
const cases=JSON.parse(fs.readFileSync(casesPath,'utf8'));
if(cases.status!=='CATALOG_INFORMED_PROVISIONAL_DIAGNOSTIC'||!Array.isArray(cases.cases)||cases.cases.length<15)throw Error('PROVISIONAL_CASES_REQUIRED');
const byId=new Map(catalog.map(r=>[r.id,r]));
const normalize=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/\s+/g,'').trim();
function titleOnly(query){
 const q=normalize(query);
 if(!q)return [];
 return catalog.map(r=>{
  const name=normalize(r.revised_name||r.name),id=normalize(r.id);
  const score=(q===id||q===name?100:0)+(q.includes(name)&&name.length>1?30:0)+(name.includes(q)&&q.length>1?8:0);
  return {scene_id:r.id,score};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.scene_id.localeCompare(b.scene_id)).slice(0,10);
}
const all=[];
for(const c of cases.cases){
 if(!byId.has(c.expected))throw Error('UNKNOWN_EXPECTED_SCENE '+c.expected);
 const tested={};
 for(const [engine,search] of [['title_only',titleOnly],['scene1341_lexical_v01',q=>index.search(q,{limit:10})]]){
  const start=performance.now(),results=search(c.query),elapsedMs=performance.now()-start;
  const ids=results.map(x=>x.scene_id);
  if(ids.length!==new Set(ids).size||results.length>10)throw Error('INVALID_ENGINE_RESULT '+engine);
  if(results.some(x=>x.scene_id===c.expected&&x.score<=0))throw Error('INVALID_SCORE');
  const i=ids.indexOf(c.expected);
  tested[engine]={top1:i===0,hit5:i>=0&&i<5,hit10:i>=0,rr:i<0?0:1/(i+1),ndcg5:i>=0&&i<5?1/Math.log2(i+2):0,empty:ids.length===0,elapsedMs,ids};
 }
 all.push({id:c.id,query:c.query,group:c.group||'unspecified',expected:c.expected,tested});
}
const metrics={};
for(const engine of ['title_only','scene1341_lexical_v01']){
 const rows=all.map(x=>x.tested[engine]);const n=rows.length;
 const average=k=>rows.reduce((a,b)=>a+Number(b[k]),0)/n;
 const latency=rows.map(x=>x.elapsedMs).sort((a,b)=>a-b);
 metrics[engine]={n,top1:average('top1'),recall5:average('hit5'),recall10:average('hit10'),mrr10:average('rr'),ndcg5:average('ndcg5'),empty:rows.filter(x=>x.empty).length,p50Ms:latency[Math.floor(n*.5)],p95Ms:latency[Math.ceil(n*.95)-1]};
}
const result={status:'SC1341_REAL_ENGINE_VS_TITLE_ONLY_PROVISIONAL_NOT_BLIND',sourceCommit,manifestBlob,sceneCount:index.sceneCount,rankedSceneCount:index.rankedSceneCount,expressionCount:index.expressionCount,candidateSourceSHA:process.env.CG_REC_SHA||null,production_eligible:false,official_gold:false,caseCount:all.length,metrics,changes:all.filter(x=>x.tested.title_only.ids.join('|')!==x.tested.scene1341_lexical_v01.ids.join('|')).length,top1Regressions:all.filter(x=>x.tested.title_only.top1&&!x.tested.scene1341_lexical_v01.top1).map(x=>x.id),top5Regressions:all.filter(x=>x.tested.title_only.hit5&&!x.tested.scene1341_lexical_v01.hit5).map(x=>x.id),rows:all};
console.log(JSON.stringify(result,null,2));
