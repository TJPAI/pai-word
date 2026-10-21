import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
let failed=0;
for(const name of fs.readdirSync('scripts').filter(n=>/^test-v21-.*\.mjs$/.test(n)&&n!=='test-v21-all.mjs'&&n!=='test-v21-browser.mjs')){
 const r=spawnSync(process.execPath,['scripts/'+name],{stdio:'inherit'});if(r.status!==0){failed++;console.error('FAILED',name)}
}
console.log('Node suite failures:',failed);process.exitCode=failed?1:0;
