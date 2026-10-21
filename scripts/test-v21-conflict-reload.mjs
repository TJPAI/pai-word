// Run: node scripts/test-v21-conflict-reload.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../rebuild-preview/learning-runtime.js',import.meta.url),'utf8');
const start=source.indexOf('window.PAI_RELOAD_KU_AFTER_CONFLICT=async()=>');
const end=source.indexOf('\n window.rateLearning=async(',start);
assert(start>=0&&end>start,'conflict reload handler missing');
const code=source.slice(start,end);
let stopped=0,cancelled=0,rendered=0;
const context={state:{view:'learning',records:{old:{due:1}},newPerDay:25,learningSession:{queue:['old']}},
 active:true,browsedUnit:{k:'old'},browseToken:3,token:9,historyRetest:true,historyAttemptId:'old',
 window:{PAI_KU_STORAGE_READY:true,PAI_KU_DURABLE_DB:{},PAI_KU_DURABLE:{
  async read(){return {version:6,snapshot:{records:{new:{due:2}},newPerDay:50,learningSession:{queue:['new']}}}}
 },PAI_AUTOBROWSE:{stop(){stopped++}}},
 PAI_TAP_FLOW:{cancel(){cancelled++}},render(){rendered++}};
vm.createContext(context);vm.runInContext(code,context);
assert.equal(await context.window.PAI_RELOAD_KU_AFTER_CONFLICT(),true);
assert.equal(context.window.PAI_KU_DURABLE_VERSION,6);
assert.equal(context.state.records.old,undefined);
assert.equal(context.state.records.new.due,2);
assert.equal(context.state.newPerDay,25,'preserve local settings');
assert.equal(context.state.view,'scenes');
assert.equal(context.active,false);
assert.equal(context.browseToken,4);
assert.equal(context.token,10);
assert.equal(stopped,1);assert.equal(cancelled,1);assert.equal(rendered,1);
console.log('PASS: conflict reload restores authoritative KU state, preserves settings, cancels stale navigation');
