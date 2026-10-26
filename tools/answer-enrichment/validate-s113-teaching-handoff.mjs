// S113 teaching-only contract and taxonomy guard; no Runtime/SRS writes.
// Run from repo root: node tools/answer-enrichment/validate-s113-teaching-handoff.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const base = new URL('./', import.meta.url);
const load = (p) => JSON.parse(readFileSync(new URL(p,base),'utf8'));
const original = load('s113-teaching-candidates.v1.json');
const revised = load('s113-targeted-revision-and-provenance.v1.json');
const handoff = load('s113-teaching-owner-handoff.v3.json');
const taxonomy = load('../../data/scene-taxonomy-v2.json');
const catalog = load('../../scene500-recommendation/catalog-v0.2.json');
const legacyRanks = load('../../data/scene500-top100-v40/group-05.json').scenes.S113;
const membership = load('../../data/scene500-playable-membership-v2.json');

function validate({original, revised, handoff, taxonomy, catalog, legacyRanks, membership}) {
  assert.equal(original.scene_id, 'S113');
  assert.equal(original.status, 'EDITORIAL_STAGING_UNCERTIFIED');
  assert.equal(original.production_ready, false);
  assert.equal(handoff.contract.scene_id, 'S113');
  assert.equal(handoff.contract.taxonomy_namespace, 'scene500-20x25-v1');
  assert.equal(handoff.contract.activation, false);
  assert.equal(handoff.contract.production_ready, false);
  assert.equal(handoff.minimum_qa.ready_for_formal_activation, false);
  assert.equal(catalog.scenes.S113.name, '预订酒店');
  const other = taxonomy.scenes.find(s => s.id === 'S113');
  assert.equal(other.nameZh, '公园游览', 'taxonomy-v2 conflict must remain explicit');
  assert.equal(membership.scenes?.S113, undefined, 'Unexpected canonical S113 membership: stop and re-evaluate contract');
  assert.equal(original.records.length, 3);
  assert.equal(revised.records.length, 3);
  assert.equal(handoff.records.length, 3);
  const seen = new Set();
  let dualPass = 0;
  for (const source of original.records) {
    assert(!seen.has(source.ku_id), 'Duplicate KU');
    seen.add(source.ku_id);
    const updated = revised.records.find(r => r.ku_id === source.ku_id);
    const target = handoff.records.find(r => r.ku_id === source.ku_id);
    assert(updated && target, 'Unmatched teaching revision');
    assert.equal(updated.headword, source.headword);
    assert.equal(target.headword, source.headword);
    assert.equal(target.scene_rank_candidate, source.scene_rank);
    assert.equal(updated.scene_rank, source.scene_rank);
    const row = legacyRanks[source.scene_rank-1];
    assert.deepEqual(row.slice(0,4), [source.scene_rank,source.headword,source.core_rank,source.ku_id],
      'V40 historical rank drift');
    for (const field of ['gloss_zh','gloss_en','collocation','example_en','example_zh','contrast_note']) {
      assert(typeof target[field] === 'string' && target[field].trim().length > 0, 'Missing '+field);
    }
    assert(/[.!?]$/.test(target.example_en));
    assert(/[。！？]$/.test(target.example_zh));
    assert(!('official_sense_id' in target) || target.official_sense_id === null);
    const pass = target.chatgpt_revision_verdict === 'PASS' && ['PASS','PASS_WITH_NONBLOCKING_TIME_BOUNDARY_NOTE'].includes(target.muse_same_revision_verdict);
    if (pass) {
      dualPass++;
      assert.equal(target.semantic_release_status, 'DUAL_AI_PASS_CONTENT_ONLY');
    } else {
      assert.equal(target.muse_same_revision_verdict, 'NOT_VERIFIED');
      assert.equal(target.semantic_release_status, 'PENDING_VERSION_MATCHED_MUSE_REVIEW');
    }
  }
  assert.equal(seen.size, 3);
  assert.equal(dualPass, handoff.minimum_qa.same_revision_dual_ai_pass_count);
  assert.equal(dualPass, 3);
  assert.equal(handoff.provenance, undefined); // provenance remains in original revision
  return {ok:true, records:seen.size, versionMatchedDualPass:dualPass, canonicalMembership:'NOT_ESTABLISHED', publishable:0};
}
const main = validate({original,revised,handoff,taxonomy,catalog,legacyRanks,membership});
const clone = x => structuredClone(x);
const tests = [
  ['enabled flag', v => {v.handoff.contract.activation=true;}],
  ['mixed taxonomy', v => {v.handoff.contract.taxonomy_namespace='taxonomy-v2';}],
  ['mixed S113 title', v => {v.catalog.scenes.S113.name='公园游览';}],
  ['incorrect membership claim', v => {v.membership.scenes={...(v.membership.scenes||{}),S113:{}};}],
  ['rank drift', v => {v.handoff.records[0].scene_rank_candidate=7;}],
  ['KU mismatch', v => {v.handoff.records[1].ku_id='bogus';}],
  ['false Muse PASS', v => {v.handoff.records[0].muse_same_revision_verdict='PASS';}],
  ['removed teaching gloss',v => {v.handoff.records[1].gloss_en='';}],
];
const input={original,revised,handoff,taxonomy,catalog,legacyRanks,membership};
let rejected=0;
for (const [name, mutate] of tests) {
 const v=clone(input);mutate(v);
 try { validate(v); throw new Error('FAULT NOT REJECTED: '+name); }
 catch(e){ if (e.message.startsWith('FAULT NOT REJECTED:')) throw e; rejected++; }
}
assert.equal(rejected,tests.length);
console.log(JSON.stringify({...main, faultInjectionRejected:rejected, faultInjectionTotal:tests.length},null,2));
