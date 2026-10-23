import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
test('semantic workset preserves stable IDs, does not approve candidates, and excludes baseline pairs',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'scene500-semantic-'));
 try{
  const paths=['lex.json','cat.json','assoc.json','out.json'].map(x=>path.join(dir,x));
  const lex={data_version:'0.10.1-evidence-compat',terms:[{term_id:'stable_math',term:'数学',stopword_hint:false},
   ...Array.from({length:19999},(_,i)=>({term_id:'t'+i,term:'占位词'+i,stopword_hint:false}))]};
  const cat={scene_count:500,scenes:Object.fromEntries(Array.from({length:500},(_,i)=>{const id='S'+String(i+1).padStart(3,'0');return [id,{name:id}];}))};
  const links=[{term_id:'stable_math',scene_id:'S126'},...Array.from({length:3552},(_,i)=>({term_id:'t'+i,scene_id:'S001'}))];
  [lex,cat,{links}].forEach((x,i)=>fs.writeFileSync(paths[i],JSON.stringify(x)));
  const r=spawnSync(process.execPath,[new URL('./build-semantic-workset.mjs',import.meta.url).pathname,...paths],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  const out=JSON.parse(fs.readFileSync(paths[3],'utf8'));
  assert.equal(out.status,'NOT_APPROVED');
  assert.ok(out.candidates.some(x=>x.term==='数学'&&x.scene_id==='S137'&&x.term_id==='stable_math'));
  assert.ok(out.candidates.every(x=>x.status==='review_required_not_approved'&&x.release_eligible===false));
  assert.ok(!out.candidates.some(x=>x.term_id==='stable_math'&&x.scene_id==='S126'));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
