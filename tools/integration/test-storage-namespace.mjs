import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const js=fs.readFileSync('rebuild-preview/ku-durable-store.js','utf8');
function resolve(pathname){
 const window={};
 const context={window,location:{pathname}};
 vm.runInNewContext(js,context,{filename:'ku-durable-store.js'});
 return window.PAI_KU_DURABLE_DB_NAME;
}
assert.equal(resolve('/pai-word-preview/perf-preview/rebuild-preview/'),'pai-word-preview-ku-durable-v2');
assert.equal(resolve('/pai-word-preview/rebuild-preview/'),'pai-word-preview-ku-durable-v2');
assert.equal(resolve('/pai-word-preview/v22-integration/rebuild-preview/index.html'),'pai-word-preview-ku-durable-v2-v22-integration');
assert.equal(resolve('/pai-word-preview/v22-integration/rebuild-preview/'),'pai-word-preview-ku-durable-v2-v22-integration');
assert.notEqual(resolve('/pai-word-preview/v22-integration/rebuild-preview/'),resolve('/pai-word-preview/perf-preview/rebuild-preview/'));
console.log('PASS candidate durable DB name isolated; legacy stable namespace unchanged');
