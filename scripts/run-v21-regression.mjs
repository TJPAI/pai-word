// Run from repository root: node scripts/run-v21-regression.mjs
// Optional: node scripts/run-v21-regression.mjs --json
// Read-only test execution; optional JSON report is ignored by git unless explicitly added.
import {readdirSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const dir=path.dirname(fileURLToPath(import.meta.url)),root=path.dirname(dir);
const tests=readdirSync(dir).filter(f=>/^test-v21-.*\.mjs$/.test(f)).sort();
const required=[
 "test-v21-audio-serialization.mjs",
 "test-v21-conflict-reload.mjs",
 "test-v21-core20k-scene500-integration.mjs",
 "test-v21-cross-scene-daily-dedupe.mjs",
 "test-v21-deferred-learning-entry.mjs",
 "test-v21-deferred-scene-bridge.mjs",
 "test-v21-duplicate-attempt-recovery.mjs",
 "test-v21-historical-backup-failure.mjs",
 "test-v21-historical-overlap.mjs",
 "test-v21-historical-write-lock.mjs",
 "test-v21-home-scene-counts.mjs",
 "test-v21-home-search-diff.mjs",
 "test-v21-light-home-budget.mjs",
 "test-v21-light-home-startup.mjs",
 "test-v21-migration-probe.mjs",
 "test-v21-rating-blank-commit.mjs",
 "test-v21-rating-phases.mjs",
 "test-v21-rating-transaction.mjs",
 "test-v21-scene-refresh.mjs",
 "test-v21-scene500-round-queue.mjs",
 "test-v21-scene-search-click.mjs",
 "test-v21-study-contract.mjs",
 "test-v21-three-rating-controls.mjs",
 "test-v21-top100-runtime-identity.mjs",
 "test-v21-transaction-store.mjs"
];
const missing=required.filter(name=>!tests.includes(name));
if(missing.length){console.error('Incomplete V2.1 suite; missing tests:\n'+missing.join('\n'));process.exit(2)}
if(!tests.length){console.error('No V2.1 tests discovered; refusing false PASS');process.exit(2)}
const results=[];
for(const file of tests){
 const started=Date.now();
 const p=spawnSync(process.execPath,[path.join(dir,file)],{cwd:root,encoding:'utf8',timeout:120000,maxBuffer:4*1024*1024});
 const ok=p.status===0&&!p.error;
 const result={name:file,status:ok?'PASS':'FAIL',exitCode:p.status,signal:p.signal,
  durationMs:Date.now()-started,output:(p.stdout||'').trim(),error:(p.stderr||p.error?.message||'').trim()};
 results.push(result);
 console.log(result.status+' '+file+' ('+result.durationMs+' ms)');
 if(!ok)console.error((result.error||result.output||'Process exited without diagnostic').slice(-2500));
}
const failures=results.filter(r=>r.status!=='PASS');
const report={executedAt:new Date().toISOString(),node:process.version,
 total:results.length,passed:results.length-failures.length,failed:failures.length,results};
if(process.argv.includes('--json')){
 const dest=path.join(root,'v21-regression-report.json');
 writeFileSync(dest,JSON.stringify(report,null,2)+'\n');
 console.log('Report: '+dest);
}
console.log(JSON.stringify({total:report.total,passed:report.passed,failed:report.failed,failures:failures.map(x=>x.name)},null,2));
if(failures.length)process.exitCode=1;
