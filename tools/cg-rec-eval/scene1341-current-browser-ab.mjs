// Independent integrated-browser A/B on the EXACT frozen 1341 catalog and V51-V61 source.
// Uses CG-MAIN's real adapter and CG-REC's real browser-safe core, not a mock ranker.
import fs from 'node:fs';
import path from 'node:path';
import {performance} from 'node:perf_hooks';
import {createScene1341HomeCatalog} from '../../rebuild-preview/scene1341-home-adapter.mjs';
import {buildCatalog as integratedBuildCatalog,csv} from '../../rebuild-preview/scene1341-search-core.mjs';
import {buildCatalog as latestBuildCatalog} from '../../../candidate-current/scene500-recommendation/scene1341-search-core.mjs';
const [catalogPath,rankedDir,sourceCommit,manifestSha,queriesPath,negationPath]=process.argv.slice(2);
if(![catalogPath,rankedDir,sourceCommit,manifestSha,queriesPath,negationPath].every(Boolean))throw Error('SIX_PINNED_INPUTS_REQUIRED');
const catalogText=fs.readFileSync(catalogPath,'utf8');
const csvTexts=Array.from({length:11},(_,i)=>fs.readFileSync(path.join(rankedDir,'v'+(51+i)+'-ranked.csv'),'utf8'));
const batches=csvTexts.map(csv);
const sceneCounts=new Map();for(const batch of batches)for(const r of batch)sceneCounts.set(r.scene_id,(sceneCounts.get(r.scene_id)||0)+1);
const store={
 async initialize(){return {scenes:[...sceneCounts].map(([scene_id,count])=>({scene_id,count}))};},
 async batch(v){if(!Number.isInteger(v)||v<51||v>61)throw Error('WRONG_BATCH');return batches[v-51];},
 async scene(id){return {rows:batches.flat().filter(x=>x.scene_id===id)};}
};
const adapter=createScene1341HomeCatalog({ranked:store,fetchImpl:async()=>new Response(catalogText,{status:200})});
const meta={sourceCommit,manifestSha};
const integrated=integratedBuildCatalog(catalogText,csvTexts,meta);
const current=latestBuildCatalog(catalogText,csvTexts,meta);
const initial=JSON.parse(fs.readFileSync(queriesPath,'utf8'));
const neg=JSON.parse(fs.readFileSync(negationPath,'utf8'));
if(initial.cases?.length!==22||neg.rows?.length!==14)throw Error('FROZEN_CASE_COUNTS_MISMATCH');
const extra=[
 ['NEG001','我不是搬家，只是整理卧室'],
 ['NEG002','不是外卖下单，我是来取餐的'],
 ['NEG003','不想看电视，我要照顾宠物'],
 ['NEG004','不是点餐，只是问食材'],
 ['NEG005','not coffee, I want to order food']
];
const questions=[
 ...initial.cases.map(c=>({id:c.id,query:c.query,group:c.group||'other',expected:c.expected,judge:'NONBLIND_CATALOG_INFORMED'})),
 ...neg.rows.map(c=>({id:c.id,query:c.query,group:'negation14',expected:c.provisionalTarget,judge:'UNADJUDICATED_DIAGNOSTIC'})),
 ...extra.map(([id,query])=>({id,query,group:'browser_negation5',expected:null,judge:'UNADJUDICATED_DIAGNOSTIC'}))
];
if(questions.length!==41||new Set(questions.map(x=>x.id)).size!==41)throw Error('QUERY_IDS_INVALID');
const summaries=[];
const output=(rs,idField)=>rs.map(x=>({id:x[idField],score:x.score??null}));
const rank=(ids,id)=>id?ids.indexOf(id):-1;
for(const q of questions){
 const t0=performance.now();const legacy=await adapter.search(q.query,{limit:10});const t1=performance.now();
 const browser=await adapter.searchWithRecEngine(q.query,{limit:10});const t2=performance.now();
 const upstream=current.search(q.query,{limit:10,experimentalIntentAliases:false});const t3=performance.now();
 const internal=integrated.search(q.query,{limit:10,experimentalIntentAliases:false});
 const l=legacy.map(x=>x.id),b=browser.map(x=>x.id),u=upstream.map(x=>x.scene_id),i=internal.map(x=>x.scene_id);
 if(b.join('|')!==i.join('|')||browser.some((x,j)=>x.score!==internal[j].score))throw Error('INTEGRATED_BROWSER_CORE_MISMATCH '+q.id);
 if(browser.some(x=>x.production_release_allowed!==false||x.canCreateStudyQueue!==false||x.canWriteSrs!==false||x.studyStatus!=='KU_NOT_CONNECTED'||x.cg_qa!=='NOT_REVIEWED_FOR_THIS_INDEX'))throw Error('BROWSER_RELEASE_GATE_INVALID '+q.id);
 if(legacy.some(x=>x.production_release_allowed!==false))throw Error('LEGACY_RELEASE_GATE_INVALID '+q.id);
 if(upstream.some(x=>x.release_status!=='BLOCKED_PENDING_CG_QA_AND_MUSE'))throw Error('UPSTREAM_RELEASE_GATE_INVALID '+q.id);
 const p=rank(b,q.expected),v=rank(u,q.expected);
 summaries.push({...q,baselineTop10:l,integrationTop10:b,latestTop10:u,
  integrationEvidence:browser[0]?.explanations||[],latestEvidence:upstream[0]?.explanations||[],
  baselineTop1:l[0]||null,integrationTop1:b[0]||null,latestTop1:u[0]||null,
  baselineEmpty:l.length===0,integrationEmpty:b.length===0,latestEmpty:u.length===0,
  integrationVersusUpstreamSame:JSON.stringify(output(browser,'id'))===JSON.stringify(output(upstream,'scene_id')),
  integrationTop5Hit:q.expected?p>=0&&p<5:null,latestTop5Hit:q.expected?v>=0&&v<5:null,
  latencyMs:{baseline:t1-t0,integration:t2-t1,latest:t3-t2}
 });
}
function metrics(key){
 const gold=summaries.filter(r=>r.expected&&r.group!=='browser_negation5'),n=gold.length;
 const pos=r=>rank(r[key+'Top10'],r.expected);
 return {n,top1:gold.filter(r=>pos(r)===0).length,hit5:gold.filter(r=>pos(r)>=0&&pos(r)<5).length,
  empty:summaries.filter(r=>r[key+'Empty']).length,
  mrr10:gold.reduce((a,r)=>a+(pos(r)<0?0:1/(pos(r)+1)),0)/n,
  ndcg5:gold.reduce((a,r)=>a+(pos(r)<0||pos(r)>=5?0:1/Math.log2(pos(r)+2)),0)/n};
}
function latencySummary(key){
 const vals=summaries.map(x=>x.latencyMs[key]).sort((a,b)=>a-b);
 return {n:vals.length,p50Ms:vals[Math.ceil(vals.length*.5)-1],p95Ms:vals[Math.ceil(vals.length*.95)-1],maxMs:vals[vals.length-1]};
}
const queryGroups=Object.fromEntries([...new Set(summaries.map(x=>x.group))].map(g=>{
 const rows=summaries.filter(x=>x.group===g);
 const withTarget=rows.filter(x=>x.expected);
 const countHit=(field,k)=>withTarget.filter(x=>{const rank=x[field].indexOf(x.expected);return rank>=0&&rank<k}).length;
 return [g,{n:rows.length,targeted:withTarget.length,baselineEmpty:rows.filter(x=>x.baselineEmpty).length,
  integrationEmpty:rows.filter(x=>x.integrationEmpty).length,latestEmpty:rows.filter(x=>x.latestEmpty).length,
  baselineTop1:countHit('baselineTop10',1),integrationTop1:countHit('integrationTop10',1),latestTop1:countHit('latestTop10',1),
  baselineHit5:countHit('baselineTop10',5),integrationHit5:countHit('integrationTop10',5),latestHit5:countHit('latestTop10',5)}];
}));
const diff=summaries.filter(x=>!x.integrationVersusUpstreamSame);
const report={schema:'cg-rec-eval-live-integration-ab-v1',
 status:'INDEPENDENT_NONBLIND_SCENE1341_INTEGRATED_BROWSER_VS_LATEST',
 integratedCommit:process.env.CG_MAIN_SHA,
 upstreamCommit:process.env.CG_REC_SHA,
 sourceCommit,manifestSha,cases:41,catalogScenes:1341,rankedScenes:110,expressions:19371,
 metrics:{baseline:metrics('baseline'),integration:metrics('integration'),latest:metrics('latest')},
 latencyCI:{baseline:latencySummary('baseline'),integration:latencySummary('integration'),latest:latencySummary('latest')},
 sourceCsvBytes:Buffer.byteLength(catalogText)+csvTexts.reduce((a,x)=>a+Buffer.byteLength(x),0),
 sourceCsvBytesAreNotIndexFootprint:true,
 queryGroups,
 baselineEmpty:summaries.filter(x=>x.baselineEmpty).map(x=>x.id),
 integrationEmpty:summaries.filter(x=>x.integrationEmpty).map(x=>x.id),
 upstreamEmpty:summaries.filter(x=>x.latestEmpty).map(x=>x.id),
 integrationUpstreamDifferent:diff.length,differenceCases:diff.map(x=>({id:x.id,query:x.query,integrationTop5:x.integrationTop10.slice(0,5),latestTop5:x.latestTop10.slice(0,5)})),
 releaseAllowed:false,goldCertified:false,rows:summaries};
if(summaries.length!==41)throw Error('BAD_41_CASES');
console.log(JSON.stringify(report,null,2));
