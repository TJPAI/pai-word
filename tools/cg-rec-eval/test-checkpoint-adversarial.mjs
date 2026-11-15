// Synthetic adversarial validation of the persistent checkpoint contract.
// Mutations remain in OS temp only. Never modify the committed checkpoint.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const source=process.argv[2];
assert.ok(source,'CHECKPOINT_PATH_REQUIRED');
const original=JSON.parse(fs.readFileSync(source,'utf8'));
const validator=new URL('./validate-checkpoint.mjs',import.meta.url).pathname;
const root=fs.mkdtempSync(path.join(os.tmpdir(),'cg-rec-eval-checkpoint-adversarial-'));
const file=path.join(root,'case.json');
try {
 const test=x=>{
  fs.writeFileSync(file,JSON.stringify(x));
  return spawnSync(process.execPath,[validator,file],{encoding:'utf8'});
 };
 let run=test(original);
 assert.equal(run.status,0,'ORIGINAL_CHECKPOINT_MUST_PASS '+run.stderr);
 const mutations=[
  ['fabricated_human_gold',x=>{x.frozen_evaluation_state.protected_blind24_double_human_gold_count=24;}],
  ['fabricated_accuracy_certification',x=>{x.frozen_evaluation_state.human_relevance_accuracy_verified=true;}],
  ['production_release_switch',x=>{x.frozen_evaluation_state.official_release_allowed=true;}],
  ['bad_baseline_sha',x=>{x.recorded_from_verified_branch_head='unverified';}],
  ['tampered_ci_conclusion',x=>{x.last_verified_eval_ci.conclusion='failure';}],
  ['missing_issue_cursor',x=>{delete x.issue_cursors['2'];}],
  ['invalid_issue_cursor',x=>{x.issue_cursors['1'].last_seen_comment_id=0;}],
  ['different_owner',x=>{x.owner='CG-MAIN';}],
  ['switched_branch',x=>{x.branch='main';}],
  ['disabled_isolation',x=>{x.guardrails.work_only_on_isolated_branch=false;}]
 ];
 const rejected=[];
 for(const [name,mutate] of mutations){
  const candidate=structuredClone(original);mutate(candidate);
  run=test(candidate);
  assert.notEqual(run.status,0,'CORRUPTED_CHECKPOINT_ACCEPTED '+name);
  rejected.push(name);
 }
 console.log(JSON.stringify({status:'CHECKPOINT_ADVERSARIAL_TEST_PASS',
  originalValidated:true,rejectedCount:rejected.length,rejected,
  syntheticMutationsOnly:true,realGoldCreated:0,releaseAllowed:false}));
}finally{
 fs.rmSync(root,{recursive:true,force:true});
}
