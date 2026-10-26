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


const learning=fs.readFileSync('rebuild-preview/learning-runtime.js','utf8');
for(const name of ['PENDING_GRADE_STORAGE','SCENE_CURSORS_KEY']){
 const match=learning.match(new RegExp('const '+name+'=([^;]+);'));
 assert(match,'storage key declaration exists '+name);
 function key(pathname){return vm.runInNewContext(match[1],{location:{pathname}})}
 const stable=key('/pai-word-preview/perf-preview/rebuild-preview/');
 const candidate=key('/pai-word-preview/v22-integration/rebuild-preview/');
 assert.notEqual(candidate,stable,name+' must be isolated');
 assert(candidate.includes('v22-integration'),name+' must use candidate prefix');
 assert.equal(stable,key('/pai-word-preview/rebuild-preview/'),'legacy keys unchanged');
}
console.log('PASS V2.2 pending ratings and scene cursors isolated without altering stable keys');
