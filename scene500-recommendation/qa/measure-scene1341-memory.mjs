// Isolated Scene1341 retained-heap and cold-index-build diagnostic.
// Parent launches five fresh Node processes per variant to avoid baseline drift from prior indexes.
// Not an iPhone Safari, web memory API, or production budget measurement.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {performance} from 'node:perf_hooks';

const [variant,catalogPath,rankedDir,sourceCommit,manifestSha,...flags]=process.argv.slice(2);
assert.ok(['baseline','candidate'].includes(variant),'variant must be baseline/candidate');
assert.ok(catalogPath&&rankedDir&&/^[a-f0-9]{40}$/.test(sourceCommit)&&/^[a-f0-9]{40}$/.test(manifestSha));
const single=flags.includes('--single-trial');
const scriptPath=fileURLToPath(import.meta.url);
const sourceBytes=fs.statSync(catalogPath).size+Array.from({length:11},(_,i)=>fs.statSync(path.join(rankedDir,'v'+(51+i)+'-ranked.csv')).size).reduce((a,b)=>a+b,0);
if(!single){
 const trials=[];
 for(let i=0;i<5;i++){
   const run=spawnSync(process.execPath,['--expose-gc',scriptPath,variant,catalogPath,rankedDir,sourceCommit,manifestSha,'--single-trial'],{encoding:'utf8',maxBuffer:1048576});
   if(run.status!==0)throw Error('CHILD_TRIAL_'+i+': '+run.stderr);
   const item=JSON.parse(run.stdout);
   assert.equal(item.sourceBytes,sourceBytes);
   assert.equal(item.release_allowed,false);
   trials.push(item);
 }
 assert.equal(new Set(trials.map(x=>x.pid)).size,5,'Five distinct fresh process trials required');
 const median=values=>[...values].sort((a,b)=>a-b)[2];
 console.log(JSON.stringify({schema:'cg-rec-sc1341-node-memory-coldbuild-v2',variant,node:process.version,sourceCommit,manifestSha,sourceBytes,processes:5,processIsolation:'FRESH_NODE_PROCESS_PER_TRIAL',trials,summary:{retainedHeapDeltaMedianBytes:median(trials.map(x=>x.retainedHeapDeltaBytes)),buildMsMedian:median(trials.map(x=>x.buildMs))},interpretation:'Retained JS heap delta after GC with source text loaded; does not include all browser memory or measure Safari.',certification:'ENGINEERING_ONLY',release_allowed:false},null,2));
}else{
 assert.equal(typeof global.gc,'function','Run with --expose-gc');
 const {buildCatalog}=variant==='baseline'
   ? await import('../../baseline/scene500-recommendation/scene1341-search-core.mjs')
   : await import('../scene1341-search-core.mjs');
 const catalog=fs.readFileSync(catalogPath,'utf8');
 const ranked=Array.from({length:11},(_,i)=>fs.readFileSync(path.join(rankedDir,'v'+(51+i)+'-ranked.csv'),'utf8'));
 global.gc();
 const before=process.memoryUsage();
 const start=performance.now();
 const index=buildCatalog(catalog,ranked,{sourceCommit,manifestSha});
 const buildMs=performance.now()-start;
 assert.equal(index.sceneCount,1341);
 assert.equal(index.rankedSceneCount,110);
 assert.equal(index.expressionCount,19371);
 assert.equal(index.release_allowed,false);
 assert.equal(index.search('wake up',{limit:5})[0]?.scene_id,'SC50-0001');
 global.gc();
 const after=process.memoryUsage();
 console.log(JSON.stringify({pid:process.pid,sourceBytes,buildMs:+buildMs.toFixed(3),retainedHeapDeltaBytes:after.heapUsed-before.heapUsed,retainedRssDeltaBytes:after.rss-before.rss,heapUsedBefore:before.heapUsed,heapUsedAfter:after.heapUsed,release_allowed:false}));
}
