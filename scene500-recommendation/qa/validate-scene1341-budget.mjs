// Engineering budget gate against the immutable pre-cache baseline, not a mobile/Safari certificate.
// Inputs are separately measured source-pinned JSON artifacts from the same CI runner.
import assert from 'node:assert/strict';
import fs from 'node:fs';

const [benchFile,baselineFile,candidateFile]=process.argv.slice(2);
assert.ok(benchFile&&baselineFile&&candidateFile,'usage: bench.json baseline-memory.json candidate-memory.json');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const benchmark=read(benchFile),baseline=read(baselineFile),candidate=read(candidateFile);
const baselineCommit='6e66864e8fe494fb5d83c443a912b997d2b0d926';
const sourceCommit='17c6c758e1dfd27cfa2fe1669d3f1784bedb0668';
const manifestSha='803d2fccfd2d1ec200723f7f38e73d57495a5dd0';
for(const item of [benchmark,baseline,candidate]){
 assert.equal(item.sourceCommit,sourceCommit,'expected fixed editorial source commit');
 assert.equal(item.manifestSha,manifestSha,'expected fixed source manifest blob');
 assert.equal(item.release_allowed,false,'source index cannot be promoted to production');
}
assert.equal(benchmark.baselineCommit,baselineCommit);
assert.equal(benchmark.status,'PASS_SOURCE_PINNED_PARITY');
assert.equal(benchmark.queryCount,26);
assert.equal(benchmark.parityComparisons,52);
assert.equal(baseline.variant,'baseline');
assert.equal(candidate.variant,'candidate');
assert.equal(baseline.sourceBytes,candidate.sourceBytes);
assert.ok(baseline.sourceBytes>=3000000);
for(const item of [baseline,candidate]){
 assert.equal(item.processIsolation,'FRESH_NODE_PROCESS_PER_TRIAL');
 assert.equal(item.processes,5);
 assert.equal(item.trials.length,5);
 assert.equal(new Set(item.trials.map(t=>t.pid)).size,5,'independent process per trial');
 assert.ok(item.trials.every(t=>Number.isFinite(t.retainedHeapDeltaBytes)&&t.retainedHeapDeltaBytes>0&&Number.isFinite(t.buildMs)&&t.buildMs>0),'real positive measurements required');
}
const budgets={heapRetainedRatioMax:1.2,coldBuildRatioMax:1.5,queryP95RatioMax:1.15};
const heapRatio=candidate.summary.retainedHeapDeltaMedianBytes/baseline.summary.retainedHeapDeltaMedianBytes;
const coldRatio=candidate.summary.buildMsMedian/baseline.summary.buildMsMedian;
assert.ok(benchmark.runs.length===2,'two measured orders required');
const queryP95Ratios=benchmark.runs.map(r=>{
 assert.ok(r.baseline.p95_ms>0&&r.candidate.p95_ms>0);
 assert.equal(r.baseline.samples,78);
 assert.equal(r.candidate.samples,78);
 return r.candidate.p95_ms/r.baseline.p95_ms;
});
const failures=[];
if(!Number.isFinite(heapRatio)||heapRatio>budgets.heapRetainedRatioMax)failures.push('HEAP_RATIO_EXCEEDED');
if(!Number.isFinite(coldRatio)||coldRatio>budgets.coldBuildRatioMax)failures.push('BUILD_RATIO_EXCEEDED');
if(queryP95Ratios.some(x=>!Number.isFinite(x)||x>budgets.queryP95RatioMax))failures.push('QUERY_P95_RATIO_EXCEEDED');
const report={
 schema:'cg-rec-sc1341-engineering-budget-gate-v1',
 status:failures.length?'FAIL_BUDGET':'PASS_ENGINEERING_BUDGET',
 node:process.version,sourceCommit,manifestSha,baselineCommit,
 inputs:{memoryBaseline:baseline.schema,memoryCandidate:candidate.schema,benchmark:benchmark.schema},
 ratios:{retainedHeapMedian:Number(heapRatio.toFixed(6)),coldBuildMedian:Number(coldRatio.toFixed(6)),queryP95ByOrder:queryP95Ratios.map(x=>Number(x.toFixed(6)))},
 budgets,failures,queryCount:26,parityComparisons:52,
 caveat:'Relative Node CI engineering guard only: no Safari iPhone memory, startup latency, UX or blinded gold certification.',
 release_allowed:false,independent_gold_count:0
};
console.log(JSON.stringify(report,null,2));
if(failures.length)process.exitCode=1;
