import assert from 'node:assert/strict';
import fs from 'node:fs';
const x=JSON.parse(fs.readFileSync('tools/integration/v22-latest-line-intake-20261027.json','utf8'));
assert.equal(x.schema,'pai-v22-line-intake-v1');
assert.equal(x.integration_branch,'cg-main-fourline-integration-20261026');
assert.deepEqual(x.lines.map(y=>y.role),['CG-ZH','CG-REC','CG-ENLEX','CG-ENTEACH','CG-QA']);
for(const item of x.lines){
 assert.match(item.sha,/^[0-9a-f]{40}$/);
 assert(item.branch&&item.status&&item.approved_scope&&item.excluded);
}
for(const role of ['CG-REC','CG-ENTEACH','CG-QA'])assert.equal(x.lines.find(y=>y.role===role).status,'ISOLATED_STAGING');
const rec=x.lines.find(y=>y.role==='CG-REC');
assert.equal(rec.qa.status,'ENGINEERING_PASS_SEMANTIC_UNCERTIFIED');
assert.equal(rec.qa.negative_leak,'0/4');
assert.equal(rec.qa.regression_assertions,43);
assert.equal(x.integration_policy.default_teaching_overlay_off,true);
assert.equal(x.integration_policy.do_not_autopromote_staging,true);
assert.equal(x.integration_policy.preserve_stable_preview,true);
console.log('PASS intake scope permits frozen runtime, preserves staging and stable preview');
