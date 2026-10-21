// Run from repository root: node scripts/run-v21-regression.mjs
// Optional: node scripts/run-v21-regression.mjs --json
// Read-only test execution; optional JSON report is ignored by git unless explicitly added.
import {readdirSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const dir=path.dirname(fileURLToPath(import.meta.url)),root=path.dirname(dir);
const tests=readdirSync(dir).filter(f=>/^test-v21-.*\.mjs$/.test(f)).sort();
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
