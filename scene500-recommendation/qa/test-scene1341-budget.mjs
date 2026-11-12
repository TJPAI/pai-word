// Unit-test the engineering budget guard with synthetic reports; no corpus and no labels are modified.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=fs.mkdtempSync(path.join(os.tmpdir(),'cg-rec-budget-'));
const gate=fileURLToPath(new URL('./validate-scene1341-budget.mjs',import.meta.url));
const sourceCommit='17c6c758e1dfd27cfa2fe1669d3f1784bedb0668';
const manifestSha='803d2fccfd2d1ec200723f7f38e73d57495a5dd0';
const baselineCommit='6e66864e8fe494fb5d83c443a912b997d2b0d926';
const common={sourceCommit,manifestSha,release_allowed:false};
const exampleMemory=(variant,heap,build)=>({
 ...common,variant,sourceBytes:3183990,processIsolation:'FRESH_NODE_PROCESS_PER_TRIAL',
 processes:5,trials:Array.from({length:5},(_,i)=>({pid:100+i,retainedHeapDeltaBytes:heap,buildMs:build})),
 summary:{retainedHeapDeltaMedianBytes:heap,buildMsMedian:build},
 schema:'cg-rec-sc1341-node-memory-coldbuild-v2'
});
const bench={...common,baselineCommit,schema:'cg-rec-sc1341-normalization-cache-ab-v1',
 status:'PASS_SOURCE_PINNED_PARITY',queryCount:26,parityComparisons:52,
 runs:[0,1].map(()=>({baseline:{p95_ms:10,samples:78},candidate:{p95_ms:5,samples:78}}))};
const old=exampleMemory('baseline',10000000,200);
const candidate=exampleMemory('candidate',11000000,230);
const files=['bench.json','baseline.json','candidate.json'].map(x=>path.join(root,x));
const write=(file,obj)=>fs.writeFileSync(file,JSON.stringify(obj));
function run({expectSuccess,reason}){
 write(files[0],bench);write(files[1],old);write(files[2],candidate);
 const result=spawnSync(process.execPath,[gate,...files],{encoding:'utf8'});
 assert.equal(result.status===0,expectSuccess,JSON.stringify({reason,status:result.status,stderr:result.stderr,stdout:result.stdout}));
 if(expectSuccess)assert.equal(JSON.parse(result.stdout).status,'PASS_ENGINEERING_BUDGET');
 else if(reason==='heap')assert.equal(JSON.parse(result.stdout).failures[0],'HEAP_RATIO_EXCEEDED');
 else if(reason==='p95')assert.equal(JSON.parse(result.stdout).failures[0],'QUERY_P95_RATIO_EXCEEDED');
}
try{
 run({expectSuccess:true,reason:'normal'});
 candidate.summary.retainedHeapDeltaMedianBytes=13500000;
 run({expectSuccess:false,reason:'heap'});
 candidate.summary.retainedHeapDeltaMedianBytes=11000000;
 bench.runs[0].candidate.p95_ms=12;
 run({expectSuccess:false,reason:'p95'});
 bench.runs[0].candidate.p95_ms=5;
 candidate.manifestSha='0'.repeat(40);
 run({expectSuccess:false,reason:'source-identity'});
 console.log(JSON.stringify({status:'PASS_FAIL_CLOSED_BUDGET_UNIT',positive:1,negative:3,productionReleaseAllowed:false}));
}finally{fs.rmSync(root,{recursive:true,force:true});}
