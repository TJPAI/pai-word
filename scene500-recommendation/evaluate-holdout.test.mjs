import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const script=new URL('./evaluate-holdout.mjs',import.meta.url);
function run(gold,pred){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'scene500-eval-'));
 try{
  const a=path.join(dir,'gold.json'),b=path.join(dir,'pred.json');
  fs.writeFileSync(a,JSON.stringify(gold));fs.writeFileSync(b,JSON.stringify(pred));
  return spawnSync(process.execPath,[script.pathname,a,b],{encoding:'utf8'});
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
}
test('perfect multi-intent top-five ranking and keyword scores',()=>{
 const r=run([{id:'q1',relevantSceneIds:['S004','S005'],keywords:['整理','房间']}],
 [{id:'q1',results:[{sceneId:'S004'},{sceneId:'S005'}],keywords:['整理','房间']}]);
 assert.equal(r.status,0,r.stderr);
 const m=JSON.parse(r.stdout);
 assert.equal(m.recallAt5,1);assert.equal(m.mrrAt5,1);assert.equal(m.ndcgAt5,1);
 assert.equal(m.keyword.precision,1);assert.equal(m.keyword.recall,1);assert.equal(m.keyword.f1,1);
});
test('partial multi-intent retrieval is not reported as perfect recall',()=>{
 const r=run([{id:'q1',relevantSceneIds:['S004','S005']}],
 [{id:'q1',results:[{sceneId:'S004'},{sceneId:'S007'}]}]);
 assert.equal(r.status,0,r.stderr);
 const m=JSON.parse(r.stdout);assert.equal(m.recallAt5,.5);
 assert.equal(m.keyword,null);
});
test('invalid scene labels fail closed',()=>{
 for(const bad of ['S000','S501','S999','S1']){
  const r=run([{id:'q1',relevantSceneIds:[bad]}],[{id:'q1',results:[]}]);
  assert.notEqual(r.status,0,bad);
  assert.match(r.stderr,/INVALID_GOLD/);
 }
});
test('duplicate predictions fail closed',()=>{
 const r=run([{id:'q1',relevantSceneIds:['S004']}],[{id:'q1',results:[]},{id:'q1',results:[]}]);
 assert.notEqual(r.status,0);assert.match(r.stderr,/DUPLICATE_PREDICTION_ID/);
});
