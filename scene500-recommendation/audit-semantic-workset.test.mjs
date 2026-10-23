import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
test('semantic QA flags generic academic scene concentration and refuses approved input',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'scene500-semanticaudit-'));
 try{
  const file=path.join(dir,'workset.json');
  const candidates=Array.from({length:10},(_,i)=>({
   term_id:'zh_'+i,term:'数学',scene_id:i<7?'S137':'S134',
   proposed_rank:5,status:'review_required_not_approved',release_eligible:false
  }));
  fs.writeFileSync(file,JSON.stringify({status:'NOT_APPROVED',runtime_version:'0.10.1-evidence-compat',candidates}));
  const run=spawnSync(process.execPath,[new URL('./audit-semantic-workset.mjs',import.meta.url).pathname,file],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  const report=JSON.parse(run.stdout);
  assert.equal(report.counts.links,10);
  assert.equal(report.counts.genericAcademicLinks,7);
  assert.ok(report.warnings.includes('GENERIC_ACADEMIC_CONTEXT_OVER_40_PERCENT'));
  assert.equal(report.status,'REVIEW_REQUIRED_NOT_RELEASE_ELIGIBLE');
  candidates[0].release_eligible=true;
  fs.writeFileSync(file,JSON.stringify({status:'NOT_APPROVED',candidates}));
  const fail=spawnSync(process.execPath,[new URL('./audit-semantic-workset.mjs',import.meta.url).pathname,file],{encoding:'utf8'});
  assert.notEqual(fail.status,0);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
