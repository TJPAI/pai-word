import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const src=fs.readFileSync('rebuild-preview/learning-runtime.js','utf8');
const start=src.indexOf('async function commitRatedDraft(draft,attemptId){');
const end=src.indexOf(' function projectRatedKU(',start);
assert(start>=0&&end>start,'real commit implementation exists');
const impl=src.slice(start,end);
async function run(result,options={}){
 const original={records:{a:{grade:'old'}}},draft={records:{a:{grade:'good'}}};
 const window={PAI_KU_STORAGE_READY:options.ready!==false,PAI_KU_DURABLE_VERSION:7,PAI_KU_DURABLE_DB:{},PAI_SAVE_DEFERRED:true,PAI_KU_DURABLE:{
  commit:async(db,args)=>{assert.equal(args.expectedVersion,7);assert.equal(args.attemptId,'attempt-a');assert.equal(args.snapshot,draft);if(options.reject)throw Error('AbortError');return result;}
 }};
 let saves=0;
 const context={window,console,state:original,save:()=>{saves++;if(options.backupThrows)throw Error('backup unavailable')}};
 vm.runInNewContext(impl+';globalThis.runCommit=commitRatedDraft',context);
 const pending=context.runCommit(draft,'attempt-a');
 if(result?.status==='committed'&&!options.reject&&options.ready!==false){
  await pending;assert.equal(context.state,draft,'published only on successful commit');
  assert.equal(window.PAI_KU_DURABLE_VERSION,result.version);assert.equal(window.PAI_SAVE_DEFERRED,false);assert.equal(saves,1);
 }else{
  await assert.rejects(pending);assert.equal(context.state,original,'failure must retain original SRS state');
  assert.equal(window.PAI_KU_DURABLE_VERSION,7,'failure must retain version');
  assert.equal(window.PAI_SAVE_DEFERRED,true,'caller remains responsible for unlocking on failure');
  assert.equal(saves,0);
 }
}
await run({status:'committed',version:8});
await run({status:'committed',version:8},{backupThrows:true});
await run({status:'duplicate'});
await run({status:'conflict',version:9});
await run(null,{reject:true});
await run(null,{ready:false});
console.log('PASS live rated-commit semantics: success, backup failure, duplicate, conflict, abort, no storage');
