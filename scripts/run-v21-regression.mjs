// Run from repository root: node scripts/run-v21-regression.mjs
// Sequential, dependency-free runner; exits nonzero if any test fails.
import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const dir=path.dirname(fileURLToPath(import.meta.url));
const tests=readdirSync(dir).filter(f=>/^test-v21-.*\.mjs$/.test(f)).sort();
const results=[];
for(const file of tests){
 const p=spawnSync(process.execPath,[path.join(dir,file)],{cwd:path.dirname(dir),encoding:'utf8',timeout:120000,maxBuffer:4*1024*1024});
 const ok=p.status===0&&!p.error;
 results.push({name:file,status:ok?'PASS':'FAIL',exitCode:p.status,signal:p.signal,output:(p.stdout||'').trim(),error:(p.stderr||p.error?.message||'').trim()});
 console.log((ok?'PASS':'FAIL')+' '+file);
 if(!ok)console.error((p.stderr||p.error?.message||p.stdout||'').slice(-1800));
}
const failed=results.filter(r=>r.status!=='PASS');
console.log(JSON.stringify({total:results.length,passed:results.length-failed.length,failed:failed.length,failures:failed.map(x=>x.name)},null,2));
if(failed.length)process.exitCode=1;
