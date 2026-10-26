// Staging-only interface and identity verification. NEVER enables teaching or changes SRS.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
const overlay=JSON.parse(fs.readFileSync('tools/integration/s113-seven-ku-answer-overlay.staging.v1.json','utf8'));
const runtime=JSON.parse(gunzipSync(fs.readFileSync('data/core20k-runtime.json.gz')).toString('utf8'));
const byKU=new Map();
for(const row of runtime.headwords)for(const ku of row[4]){assert(!byKU.has(ku[0]));byKU.set(ku[0],{lemma:row[1],ku});}
assert.equal(overlay.schema_version,'pai-word-enteach-seven-ku-answer-overlay-v1');
assert.equal(overlay.scene.scene_id,'S113');
assert.equal(overlay.scene.taxonomy_namespace,'scene500-20x25-v1');
assert.equal(overlay.scene.canonical_membership,'NOT_ESTABLISHED');
assert.equal(overlay.content_semantic_review,'DUAL_AI_PASS_7_OF_7_EXACT_CONTENT');
assert.equal(overlay.activation.allowed,false);
assert.equal(overlay.production_ready,false);
assert.equal(overlay.records.length,7);
const ids=new Set();
for(const r of overlay.records){
 assert(!ids.has(r.ku_id),'duplicate KU');ids.add(r.ku_id);
 const target=byKU.get(r.ku_id);
 assert(target,'unknown official Runtime KU '+r.ku_id);
 assert.equal(target.lemma,r.headword,'headword/KU mismatch');
 assert.equal(target.ku[1],'sense','only Sense KU records can use this staging overlay');
 assert.equal(target.ku[4],true,'KU must be playable in the underlying Runtime');
 assert.equal(r.scene_id,'S113');assert.equal(r.taxonomy_namespace,overlay.scene.taxonomy_namespace);
 assert.equal(r.official_sense_id,null);
 assert.equal(r.activation_allowed,false);
 assert.equal(r.semantic_review,'DUAL_AI_PASS_CONTENT_ONLY');
 for(const k of ['gloss_zh','gloss_en','collocation','example_en','example_zh'])
  assert(typeof r[k]==='string'&&r[k].trim(),'missing teaching field: '+k);
 for(const k of ['grammar_note','contrast_note'])
  assert(r[k]==null||(typeof r[k]==='string'),'malformed optional field: '+k);
}
assert.equal(ids.size,7);
console.log('PASS S113 staging overlay: 7 exact Runtime KU identities, complete teaching fields, activation disabled');
