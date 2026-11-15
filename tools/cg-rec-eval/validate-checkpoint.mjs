// Lightweight persistent checkpoint contract; no network, paid API, or historical replay.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const file=process.argv[2];
assert.ok(file,'CHECKPOINT_PATH_REQUIRED');
const x=JSON.parse(fs.readFileSync(file,'utf8'));
const sha=v=>typeof v==='string'&&/^[a-f0-9]{40}$/.test(v);
assert.equal(x.schema,'cg-rec-eval-checkpoint-v1');
assert.equal(x.owner,'CG-REC-EVAL');
assert.equal(x.repository,'TJPAI/pai-word');
assert.equal(x.branch,'cg-rec-eval-isolated-20261027');
assert.ok(sha(x.recorded_from_verified_branch_head),'INVALID_BASELINE_HEAD');
assert.match(x.self_sha_policy,/PARENT\/BASELINE/);
for(const issue of ['1','2']){
 assert.ok(Number.isSafeInteger(x.issue_cursors?.[issue]?.last_seen_comment_id));
 assert.ok(x.issue_cursors[issue].last_seen_comment_id>0);
}
for(const name of ['scene500-recommendation-dev','cg-main-fourline-integration-20261026']){
 assert.ok(sha(x.verified_peers?.[name]),'INVALID_PEER '+name);
}
assert.equal(x.last_verified_eval_ci?.conclusion,'success');
assert.ok(sha(x.last_verified_eval_ci?.head_sha));
assert.ok(Number.isSafeInteger(x.last_verified_eval_ci?.run_id));
assert.ok(Number.isSafeInteger(x.last_verified_eval_ci?.artifact_id));
assert.match(x.last_verified_eval_ci?.artifact_sha256||'',/^[a-f0-9]{64}$/);
assert.equal(x.frozen_evaluation_state?.protected_blind24_query_count,24);
assert.equal(x.frozen_evaluation_state?.protected_blind24_double_human_gold_count,0);
assert.equal(x.frozen_evaluation_state?.human_relevance_accuracy_verified,false);
assert.equal(x.frozen_evaluation_state?.official_release_allowed,false);
assert.equal(x.guardrails?.work_only_on_isolated_branch,true);
assert.equal(x.guardrails?.no_fabricated_qa_labels,true);
assert.equal(x.guardrails?.no_accuracy_gain_claim_without_locked_double_human_gold,true);
assert.equal(x.guardrails?.do_not_modify_master_runtime_srs_production,true);
assert.ok(Array.isArray(x.open_work)&&x.open_work.length>0);
assert.ok(Array.isArray(x.next_session_protocol)&&x.next_session_protocol.length>=4);
console.log(JSON.stringify({status:'CG_REC_EVAL_CHECKPOINT_CONTRACT_PASS',
 branch:x.branch,baseline:x.recorded_from_verified_branch_head,
 issueCursors:Object.fromEntries(['1','2'].map(n=>[n,x.issue_cursors[n].last_seen_comment_id])),
 formalBlindGold:x.frozen_evaluation_state.protected_blind24_double_human_gold_count,
 releaseAllowed:x.frozen_evaluation_state.official_release_allowed}));
