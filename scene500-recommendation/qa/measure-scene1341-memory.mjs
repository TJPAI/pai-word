// Memory/cold-build probe for the isolated Scene1341 lexical index.
// Invoked as two separate Node processes with --expose-gc so baseline and candidate do not share heap.
// This is a Node runner diagnostic, NOT Safari heap or a production memory budget certificate.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {performance} from 'node:perf_hooks';
const [variant,catalogPath,rankedDir,sourceCommit,manifestSha]=process.argv.slice(2);
assert.ok(['baseline','candidate'].includes(variant),'variant must be baseline/candidate');
assert.equal(typeof global.gc,'function','Run with node --expose-gc');
assert.ok(catalogPath&&rankedDir&&/^[a-f0-9]{40}$/.test(sourceCommit)&&/^[a-f0-9]{40}$/.test(manifestSha));
const {buildCatalog} = variant==='baseline'
  ? await import('../../baseline/scene500-recommendation/scene1341-search-core.mjs')
  : await import('../scene1341-search-core.mjs');
const rawCatalog=fs.readFileSync(catalogPath,'utf8');
const rawRanked=Array.from({length:11},(_,i)=>fs.readFileSync(path.join(rankedDir,'v'+(51+i)+'-ranked.csv'),'utf8'));
const sourceBytes=Buffer.byteLength(rawCatalog)+rawRanked.reduce((sum,x)=>sum+Buffer.byteLength(x),0);
const trials=[];
function snapshot(){global.gc();const x=process.memoryUsage();return {heapUsed:x.heapUsed,rss:x.rss,external:x.external,arrayBuffers:x.arrayBuffers};}
for(let i=0;i<3;i++){
 const before=snapshot();
 const begin=performance.now();
 let index=buildCatalog(rawCatalog,rawRanked,{sourceCommit,manifestSha});
 const buildMs=performance.now()-begin;
 assert.equal(index.sceneCount,1341);
 assert.equal(index.rankedSceneCount,110);
 assert.equal(index.expressionCount,19371);
 assert.equal(index.release_allowed,false);
 assert.equal(index.search('wake up',{limit:5})[0]?.scene_id,'SC50-0001');
 const after=snapshot();
 trials.push({buildMs:+buildMs.toFixed(3),retainedHeapDeltaBytes:after.heapUsed-before.heapUsed,retainedRssDeltaBytes:after.rss-before.rss,heapUsedBefore:before.heapUsed,heapUsedAfter:after.heapUsed});
 // Do not rely on timely reclamation, but don't accumulate multiple indexes unintentionally.
 index=null;
 global.gc();
}
const values=trials.map(x=>x.retainedHeapDeltaBytes);
const builds=trials.map(x=>x.buildMs);
const result={schema:'cg-rec-sc1341-node-memory-coldbuild-v1',variant,node:process.version,sourceCommit,manifestSha,sourceBytes,independentProcessesRequired:true,heapMeasure:'process.memoryUsage after explicit GC; approximate retained JS heap, not total app or Safari memory',trials,summary:{retainedHeapDeltaMedianBytes:[...values].sort((a,b)=>a-b)[1],buildMsMedian:[...builds].sort((a,b)=>a-b)[1]},certification:'ENGINEERING_ONLY',release_allowed:false};
console.log(JSON.stringify(result,null,2));
