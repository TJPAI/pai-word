import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
test('unified queue deduplicates and preserves review-only status',()=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'scene500-merge-'));
 try{
  const names=['lex','catalog','base','output','a','b'].map(x=>path.join(d,x+'.json'));
  const terms=Array.from({length:20000},(_,i)=>({term_id:'zh_'+i,term:'词项'+i}));
  const catalog={scene_count:500,scenes:Object.fromEntries(Array.from({length:500},(_,i)=>{const id='S'+String(i+1).padStart(3,'0');return [id,{name:id}]}))};
  const base={links:Array.from({length:3553},(_,i)=>({term_id:'zh_'+(i%500),scene_id:'S001'}))};
  const row={term_id:'zh_900',term:'词项900',scene_id:'S137',release_eligible:false};
  [ {data_version:'0.10.1-evidence-compat',terms},catalog,base,
    {schema:'scene500-semantic-workset-v0.1',status:'NOT_APPROVED',candidates:[row]},
    {schema:'scene500-compound-evidence-v0.1',status:'REVIEW_ONLY_NOT_APPROVED',candidates:[row]}]
   .forEach((x,i)=>fs.writeFileSync(names[i<3?i:i+1],JSON.stringify(x)));
  const run=spawnSync(process.execPath,[new URL('./consolidate-candidates.mjs',import.meta.url).pathname,...names],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  const x=JSON.parse(fs.readFileSync(names[3],'utf8'));
  assert.equal(x.uniqueCandidates,1);
  assert.equal(x.rows[0].evidence.length,2);
  assert.equal(x.newlyCoveredIfApproved,1);
  assert.equal(x.rows[0].release_eligible,false);
 }finally{fs.rmSync(d,{recursive:true,force:true});}
});
