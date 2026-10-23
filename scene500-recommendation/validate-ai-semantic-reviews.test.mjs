import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
test('two-stage AI review cannot mark AI agreement as deployable',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'scene500-ai-'));
 try{
  const paths=['manifest','proposals','reviews','out'].map(n=>path.join(dir,n+'.json'));
  const term={term_id:'zh_a',term:'天文望远镜'};
  const manifest={schema:'scene500-ai-semantic-job-manifest-v0.1',status:'JOBS_NOT_EXECUTED',
   jobs:[{terms:[term]}],scenes:[{id:'S001'}]};
  const edge={...term,scene_id:'S001',rationale_zh:'用望远镜观测天体的具体操作',counterexample_zh:'讨论天文学发展历史不等于观测'};
  const proposals={schema:'scene500-ai-proposal-v0.1',edges:[edge]};
  const reviews={schema:'scene500-ai-review-v0.1',verdicts:[{term_id:'zh_a',scene_id:'S001',
   verdict:'agree',reason_zh:'与具体操作确实直接相关'}]};
  [manifest,proposals,reviews].forEach((x,i)=>fs.writeFileSync(paths[i],JSON.stringify(x)));
  const run=spawnSync(process.execPath,[new URL('./validate-ai-semantic-reviews.mjs',import.meta.url).pathname,...paths],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  const out=JSON.parse(fs.readFileSync(paths[3],'utf8'));
  assert.equal(out.counts.agreement,1);
  assert.equal(out.status,'NOT_CERTIFIED_NOT_DEPLOYABLE');
  assert.equal(out.rows[0].release_eligible,false);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
