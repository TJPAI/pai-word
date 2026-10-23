import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
test('compound retrieval keeps evidence visible and all edges unapproved',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'compound-'));
 try{
  const [a,b,c,d]=['lex.json','cat.json','links.json','out.json'].map(x=>path.join(dir,x));
  const terms=Array.from({length:20000},(_,i)=>({term_id:'zh_'+i,term:'占位词'+i,stopword_hint:false}));
  terms[0]={term_id:'zh_0',term:'科学实验',stopword_hint:false};
  fs.writeFileSync(a,JSON.stringify({data_version:'0.10.1-evidence-compat',terms}));
  const scenes=Object.fromEntries(Array.from({length:500},(_,i)=>{
   const id='S'+String(i+1).padStart(3,'0');
   return [id,{name:i===0?'科学实验过程':id,aliases:[],actions:[],objects:[]}];
  }));
  fs.writeFileSync(b,JSON.stringify({scene_count:500,scenes}));
  fs.writeFileSync(c,JSON.stringify({links:Array.from({length:3553},(_,i)=>({term_id:'zh_'+(i%500+1000),scene_id:'S002'}))}));
  const run=spawnSync(process.execPath,[new URL('./propose-compound-evidence.mjs',import.meta.url).pathname,a,b,c,d],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  const result=JSON.parse(fs.readFileSync(d,'utf8'));
  assert.equal(result.status,'REVIEW_ONLY_NOT_APPROVED');
  assert.ok(result.candidates.some(x=>x.term==='科学实验'&&x.scene_id==='S001'));
  assert.ok(result.candidates.every(x=>x.release_eligible===false));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
