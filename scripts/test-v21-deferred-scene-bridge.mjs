// node scripts/test-v21-deferred-scene-bridge.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../scene-search.js',import.meta.url),'utf8');
function boot(entry){
 const calls=[],state={scene500Recent:[]},window={PAI_CORE20K_ROOT:true,PAI_SCENE500:{specs:[]},PAI_DEFERRED_LEARNING_ENTRY:entry,openScene:scene=>{calls.push(scene);return 'opened'}};
 const ctx={window,state,SCENES:{},save(){},allUnits:()=>[],URLSearchParams,location:{search:''},document:{},console};
 vm.runInNewContext(source,ctx);
 return {window,state,calls};
}
let entered=[];
const lazy=boot({enter:(id,d)=>{entered.push([id,d]);return 'deferred'}});
assert.equal(lazy.window.PAI_SCENE_SEARCH.open('S001','high'),'deferred');
assert.deepEqual(entered,[['S001','high']]);
assert.equal(lazy.state.scene500Recent.length,0);
const existing=boot(null);
assert.equal(existing.window.PAI_SCENE_SEARCH.open('S002','all'),'opened');
assert.deepEqual(existing.calls,['S002']);
assert.equal(existing.state.scene500Recent[0],'S002');
console.log('PASS: optional deferred learning entry and unchanged legacy fallback');
