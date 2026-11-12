// Isolated and reproducible performance comparison on identical pinned source bytes.
// No user learning state or production runtime is accessed.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {performance} from 'node:perf_hooks';
import {buildCatalog as currentBuild} from '../scene1341-search-core.mjs';
import {buildCatalog as baselineBuild} from '../../baseline/scene500-recommendation/scene1341-search-core.mjs';
const [catalogPath,rankedDir,sourceCommit,manifestSha]=process.argv.slice(2);
if(!catalogPath||!rankedDir||!sourceCommit||!manifestSha)throw Error('REQUIRED_PINNED_INPUTS');
const csv=fs.readFileSync(catalogPath,'utf8');
const shards=Array.from({length:11},(_,i)=>fs.readFileSync(path.join(rankedDir,'v'+(51+i)+'-ranked.csv'),'utf8'));
const options={sourceCommit,manifestSha};
function construct(fn){const t=performance.now();const index=fn(csv,shards,options);return {index,buildMs:performance.now()-t};}
const baseline=construct(baselineBuild),candidate=construct(currentBuild);
for(const index of [baseline.index,candidate.index]){
 assert.equal(index.sceneCount,1341);
 assert.equal(index.rankedSceneCount,110);
 assert.equal(index.expressionCount,19371);
 assert.equal(index.release_allowed,false);
}
const queries=[
 '起床与晨间准备','洗漱与个人清洁','整理房间','wake up','洗衣与晾晒',
 '早上 wake up 之后洗漱','hotel 预订入住','我想找 nearby coffee',
 '机场 check in','地铁停运 take taxi','我不是搬家，只是整理卧室',
 '不是搬家只是整理卧室','不是整理房间，而是洗衣与晾晒',
 'not hotel check in, but taxi','刚下单的外卖什么时候送达',
 '食物会不会过期','takeaway 外卖送到哪儿了','SC50-1341',
 '想把卧室收拾整齐','我想喝杯拿铁咖啡','wake up 早上准备出门',
 '不是外卖只是查询订单状态','notebook and notes'
];
for(const q of queries){for(const experimentalIntentAliases of [false,true]){
 const o=baseline.index.search(q,{experimentalIntentAliases});
 const n=candidate.index.search(q,{experimentalIntentAliases});
 assert.deepEqual(n,o,JSON.stringify({query:q,experimentalIntentAliases}));
}}
function sample(index,repeats){const times=[];for(let i=0;i<repeats;i++)for(const q of queries){const start=performance.now();index.search(q);times.push(performance.now()-start);}return times.sort((a,b)=>a-b);}
function stats(times){const pick=p=>times[Math.min(times.length-1,Math.ceil(p*times.length)-1)];return {samples:times.length,p50_ms:Number(pick(.50).toFixed(3)),p95_ms:Number(pick(.95).toFixed(3)),mean_ms:Number((times.reduce((a,b)=>a+b,0)/times.length).toFixed(3))};}
// Warm both implementations identically; alternate measured order to temper JIT/order bias.
sample(baseline.index,2);sample(candidate.index,2);
const a=sample(baseline.index,3),b=sample(candidate.index,3);
const c=sample(candidate.index,3),d=sample(baseline.index,3);
const report={schema:'cg-rec-sc1341-normalization-cache-ab-v1',baselineSourceCommit:'6e66864e8fe494fb5d83c443a912b997d2b0d926',nodeVersion:process.version,status:'PASS_SOURCE_PINNED_PARITY',certification:'ENGINEERING_ONLY_NONBLIND',sourceCommit,manifestSha,baselineCommit:'6e66864e8fe494fb5d83c443a912b997d2b0d926',candidate:'scene500-recommendation-dev',queryCount:queries.length,parityComparisons:queries.length*2,sourceCounts:{scenes:1341,rankedScenes:110,expressions:19371},buildMs:{baseline:Number(baseline.buildMs.toFixed(3)),candidate:Number(candidate.buildMs.toFixed(3))},runs:[{sequence:'baseline_first',baseline:stats(a),candidate:stats(b)},{sequence:'candidate_first',candidate:stats(c),baseline:stats(d)}],release_allowed:false,muse_qa:'DEFERRED_QUOTA_20261113'};
console.log(JSON.stringify(report,null,2));
