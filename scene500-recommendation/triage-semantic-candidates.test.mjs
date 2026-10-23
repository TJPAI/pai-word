import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
test('candidate triage never approves and blocks observed semantic false friends',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'scene500-triage-'));
 try{
  const input=path.join(dir,'input.json'),output=path.join(dir,'output.json');
  fs.writeFileSync(input,JSON.stringify({status:'CANDIDATE_ONLY_NOT_SEMANTICALLY_VERIFIED',source:{lexicon_version:'fixture'},candidates:[
   {term:'内存管理',matched_text:'库存管理',field:'name',proxy_score:.99},
   {term:'工业机器人',matched_text:'机器人',field:'name',proxy_score:.8},
   {term:'不可再生能源',matched_text:'可再生能源',field:'name',proxy_score:.98},
   {term:'报告研究',matched_text:'研究报告',field:'objects',proxy_score:.6}
  ]}));
  const cmd=spawnSync(process.execPath,[new URL('./triage-semantic-candidates.mjs',import.meta.url).pathname,input,output],{encoding:'utf8'});
  assert.equal(cmd.status,0,cmd.stderr);
  const r=JSON.parse(fs.readFileSync(output,'utf8'));
  assert.equal(r.status,'TRIAGED_NOT_VERIFIED_NOT_APPROVED');
  assert.equal(r.counts.reject_observed_false_friend,2);
  assert.equal(r.counts.review_priority,1);
  assert.equal(r.counts.review_risk,1);
  assert.equal(r.baseline_unchanged,true);
  assert.ok(r.candidates.every(x=>x.review_status==='candidate_review_only'));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
