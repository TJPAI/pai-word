import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
test('coverage audit counts stable ids, flags unlinked content and keeps stopword exceptions reviewable',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'scene500-coverage-'));
 try {
  const lex=path.join(dir,'zh.json'),edges=path.join(dir,'edges.json');
  const terms=Array.from({length:20000},(_,i)=>({term_id:'zh_'+i,term:'词'+i,stopword_hint:i===0}));
  fs.writeFileSync(lex,JSON.stringify({data_version:'0.10.1-evidence-compat',terms}));
  const links=Array.from({length:3553},(_,i)=>({term_id:'zh_'+(i%100),scene_id:'S001'}));
  fs.writeFileSync(edges,JSON.stringify({links}));
  const run=spawnSync(process.execPath,[new URL('./audit-bilingual-coverage.mjs',import.meta.url).pathname,lex,edges],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  const x=JSON.parse(run.stdout);
  assert.equal(x.zh.links,3553);
  assert.equal(x.zh.linkedTerms,100);
  assert.equal(x.zh.unlinkedTerms,19900);
  assert.equal(x.zh.targetUnlinked,19900);
  assert.equal(x.zh.byDisposition.exception_review,1);
  assert.equal(x.en.status,'ENGLISH_RUNTIME_NOT_SUPPLIED');
  assert.equal(x.qualityGate,'AUDIT_ONLY_NOT_RELEASE_APPROVAL');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
