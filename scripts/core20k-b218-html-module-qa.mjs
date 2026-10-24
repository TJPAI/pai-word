import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const source=fs.readFileSync('rebuild-preview/b218-isolated/index.html','utf8');
const match=source.match(/<script\s+type="module">([\s\S]*?)<\/script>/i);
assert.ok(match,'B218 module script not found');
new vm.SourceTextModule(match[1]);
console.log('PASS B218 isolated HTML inline module syntax');
