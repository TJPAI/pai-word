import assert from 'node:assert/strict';
import fs from 'node:fs';
const x=JSON.parse(fs.readFileSync('tools/integration/cg-rec-query-intent-staging-handoff-20261102.json','utf8'));
assert.equal(x.schema,'pai-cg-rec-query-intent-staging-handoff-v1');
assert.match(x.source.commit,/^[a-f0-9]{40}$/);
assert.equal(x.source.paths.length,2);
for(const p of x.source.paths){assert.match(p.blob_sha,/^[a-f0-9]{40}$/);assert(p.path.startsWith('scene500-recommendation/'));}
assert.equal(x.interface.analyzer,'analyzeSceneQuery');
assert.equal(x.interface.negative_term_gate,'isLocallyNegatedTerm');
assert.equal(x.interface.supports_mixed_language_detection,true);
assert.equal(x.interface.certified_cross_language_retrieval,false);
assert.equal(x.interface.semantic_scene1341,false);
assert.equal(x.integration.release_eligible,false);
assert.equal(x.integration.import_into_runtime,false);
assert.equal(x.integration.allow_srs_remap,false);
console.log('PASS CG-REC pin and non-release bilingual semantics boundary');
