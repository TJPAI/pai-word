import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';
test('20k triage ledger reconciles approved links and review-only candidates',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'scene500-ledger-'));
 try{
  const files=['zh.json','links.json','queue.json','out.jsonl','summary.json'].map(f=>path.join(dir,f));
  const terms=Array.from({length:20000},(_,i)=>({term_id:'zh_'+i,term:'词'+i,stopword_hint:i===1}));
  const links=Array.from({length:3553},(_,i)=>({term_id:'zh_'+(i%1613),scene_id:'S'+String(Math.floor(i/1613)+1).padStart(3,'0')}));
  const queue={status:'REVIEW_ONLY_NOT_APPROVED',queue:[{term_id:'zh_18000',scene_id:'S100',release_eligible:false,review_priority:'review_scene_specificity'}],deferred:[]};
  [ {data_version:'0.10.1-evidence-compat',terms},{links},queue ].forEach((x,i)=>fs.writeFileSync(files[i],JSON.stringify(x)));
  const run=spawnSync(process.execPath,[new URL('./build-zh20k-coverage-ledger.mjs',import.meta.url).pathname,...files],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  const report=JSON.parse(fs.readFileSync(files[4]));
  assert.equal(report.termCount,20000);
  assert.equal(report.counts.linked,1613);
  assert.equal(report.counts.unlinkedWithReviewCandidates,1);
  assert.equal(report.counts.stopwordHint,1);
  const rows=fs.readFileSync(files[3],'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(rows.length,20000);
  assert.equal(rows[18000].disposition,'candidate_review_needed');
  assert.ok(rows.every(x=>x.production_eligible===false));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
