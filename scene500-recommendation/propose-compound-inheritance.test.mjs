import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
test('compound inheritance is review-only and blocks misleading substrings',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'scene500-inherit-'));
 try{
  const paths=['lex','links','catalog','out'].map(x=>path.join(dir,x+'.json'));
  const terms=Array.from({length:20000},(_,i)=>({term_id:'zh_'+i,term:'占位词'+i,stopword_hint:false}));
  terms[0]={term_id:'zh_0',term:'科学',stopword_hint:false};
  terms[1]={term_id:'zh_1',term:'科学家',stopword_hint:false};
  terms[2]={term_id:'zh_2',term:'动机',stopword_hint:false};
  terms[3]={term_id:'zh_3',term:'发动机',stopword_hint:false};
  const catalog={scene_count:500,scenes:Object.fromEntries(Array.from({length:500},(_,i)=>{
   const id='S'+String(i+1).padStart(3,'0');return [id,{name:id}];
  }))};
  const links=Array.from({length:3553},(_,i)=>({term_id:i===0?'zh_0':i===1?'zh_2':'zh_'+(i%100+100),scene_id:'S'+String(i%500+1).padStart(3,'0')}));
  [ {data_version:'0.10.1-evidence-compat',terms},{links},catalog ].forEach((x,i)=>fs.writeFileSync(paths[i],JSON.stringify(x)));
  const run=spawnSync(process.execPath,[new URL('./propose-compound-inheritance.mjs',import.meta.url).pathname,...paths],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  const report=JSON.parse(fs.readFileSync(paths[3],'utf8'));
  assert.ok(report.candidates.some(c=>c.term==='科学家'&&c.inherited_from_term==='科学'));
  assert.ok(!report.candidates.some(c=>c.term==='发动机'&&c.inherited_from_term==='动机'));
  assert.ok(report.candidates.every(c=>c.release_eligible===false&&c.confidence===null));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
