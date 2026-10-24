import fs from 'node:fs';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const source=fs.readFileSync('rebuild-preview/b218-isolated/index.html','utf8');
const match=source.match(/<script\s+type="module">([\s\S]*?)<\/script>/i);
assert.ok(match,'B218 module script not found');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b218-qa-'));
try{
 const file=path.join(dir,'isolated.mjs');
 fs.writeFileSync(file,match[1]);
 const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr||result.error?.message);
 console.log('PASS B218 isolated HTML inline module syntax');
}finally{fs.rmSync(dir,{recursive:true,force:true})}
