import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Run from repository root: node tools/answer-enrichment/test-b218-isolated.mjs
const base='rebuild-preview/b218-isolated/';
const html=readFileSync(base+'index.html','utf8');
const packBytes=readFileSync(base+'batch93_nonrelease_teaching_pack.json');
const pack=JSON.parse(packBytes);
const registry=JSON.parse(readFileSync(base+'B217_SIX_KU_REGISTERED_CROSSWALK.json','utf8'));
const review=JSON.parse(readFileSync(base+'B218_SIX_KU_TEACHING_CERTIFICATION_REVIEW.json','utf8'));
const grading=readFileSync('scripts/core20k-b218-contextual-grading.mjs','utf8');
const sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(pack.records.length,6);
assert.equal(registry.registered_count,6);
assert.equal(registry.conflict_count,0);
assert.equal(new Set(pack.records.map(r=>r.ku_id)).size,6);
for(const r of pack.records){
 const b=registry.records.find(b=>b.ku_id===r.ku_id);
 assert.ok(b, 'Missing registered KU: '+r.ku_id);
 assert.equal(b.registration_status,'APPROVED');
 assert.equal(b.anchor_ku_id,r.ku_id);
 assert.equal(b.lemma,r.headword);
 assert.equal(b.rank,r.rank);
 assert.ok(r.gloss_en && r.explanation_zh && r.example_en && r.example_zh);
}
assert.ok(grading.includes(sha(packBytes)), 'Pinned pack hash mismatch');
assert.ok(html.includes('data-rating="again"') && html.includes('data-rating="hard"') && html.includes('data-rating="good"'));
assert.ok(html.includes("esc(r.gloss_en)") && html.includes("esc(r.explanation_zh)"));
assert.ok(html.includes('answers.filter(Boolean).length'), 'Rating count must ignore skipped KUs');
assert.ok(html.includes('validateB218Binding') && html.includes('FAIL-CLOSED'));
assert.ok(html.includes('crypto.subtle.digest'));
assert.ok(!html.includes('localStorage.setItem') && !html.includes('indexedDB.open'));
assert.ok(review.records && Array.isArray(review.records));
console.log('PASS: B218 six-KU identity, hash pin, enriched answers, rating count, fail-closed and isolation checks');
