import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
test('generic research scenes are capped to one per term while all candidates stay review only',()=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'scene500-priority-'));
 try {
  const inp=path.join(d,'in.json'),out=path.join(d,'out.json');
  const entries=['S137','S153','S126','S134'].map((scene_id,i)=>({
   term_id:'zh_test',term:'物理',scene_id,proposed_rank:i+1,
   status:'review_required_not_approved',release_eligible:false
  }));
  fs.writeFileSync(inp,JSON.stringify({schema:'scene500-semantic-workset-v0.1',status:'NOT_APPROVED',runtime_version:'0.10.1-evidence-compat',candidates:entries}));
  const run=spawnSync(process.execPath,[new URL('./prioritize-semantic-workset.mjs',import.meta.url).pathname,inp,out],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  const result=JSON.parse(fs.readFileSync(out,'utf8'));
  assert.equal(result.activeCandidates,2);
  assert.equal(result.deferredCandidates,2);
  assert.deepEqual(result.queue.map(x=>x.scene_id),['S137','S134']);
  assert.ok(result.queue.every(x=>x.release_eligible===false));
  assert.ok(result.deferred.every(x=>x.release_eligible===false));
 }finally{fs.rmSync(d,{recursive:true,force:true});}
});
