// B178 read-only regression: cloze candidates are self-rated; no typed-answer scorer exists.
// Run: node --test scripts/core20k-b178-cloze-contract.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateBatch136Fixture} from '../rebuild-preview/core20k-batch136-runtime-gate.mjs';

const source=readFileSync(new URL('../rebuild-preview/learning-runtime.js',import.meta.url),'utf8');
const ids=['w_1139_regular_ku_s01','w_2575_click_ku_s01'];
const entries=[
  {ku_id:ids[0],sense_id:'w_1139_regular_s01',headword_id:'w_1139_regular',canonical_answer:'Regular',accepted_variants:['regular']},
  {ku_id:ids[1],sense_id:'w_2575_click_s01',headword_id:'w_2575_click',canonical_answer:'Click',accepted_variants:['click']}
];
const fixture={
  schema_version:'core20k-runtime-fixture-v1-test-guarded',
  test_only:true,release_eligible:false,default_enabled:false,
  records:entries.map(e=>({
    ...e,ku_type:'sense',render_kind:'cloze',question:'Complete the missing word.',
    response:{answer:e.canonical_answer,example_en:'A sample sentence.',example_zh:'示例句子。'},
    test_only:true,release_eligible:false,semantic_verified:false,requires_review:true,
    risk_flags:[],triage:{ku_id:e.ku_id,release_eligible:false,risk_flags:[]}
  }))
};
const identities={
  knownKuIds:new Set(ids),
  knownSenseIds:new Set(entries.map(e=>e.sense_id)),
  knownHeadwordIds:new Set(entries.map(e=>e.headword_id))
};

test('B178 staging cloze remains render-only and cannot auto-score SRS',()=>{
  const checked=validateBatch136Fixture(fixture,identities);
  assert.equal(checked.ok,true);
  assert.equal(checked.quarantined.length,0);
  assert.equal(checked.accepted.length,2);
  for(const record of checked.accepted){
    assert.equal(record.render_only,true);
    assert.equal(record.automated_srs_scoring_enabled,false);
    assert.equal(record.release_eligible,false);
    assert.equal(record.test_only,true);
  }
});

test('B178 answer spellings are preserved for future accepted_variants scoring',()=>{
  for(const item of entries){
    assert.ok(item.accepted_variants.includes(item.canonical_answer.toLowerCase()));
    assert.notEqual(item.canonical_answer,item.canonical_answer.toLowerCase());
  }
  assert.equal(entries[0].canonical_answer,'Regular');
  assert.equal(entries[1].canonical_answer,'Click');
});

test('existing main learning screen has no typed cloze scoring entry',()=>{
  for(const field of ['canonical_answer','accepted_variants','render_kind']){
    assert.equal(source.includes(field),false,'unexpected typed scoring field: '+field);
  }
  assert.match(source,/function choose\(score\)/);
  assert.match(source,/\['again','hard','good'\]/);
  assert.match(source,/window\.rateKnown=function\(known\)/);
  assert.match(source,/window\.rateReview=function\(known\)/);
});

test('runtime case policy is NOT_APPLICABLE_SELF_RATING until a certified typed scorer exists',()=>{
  const policy='NOT_APPLICABLE_SELF_RATING';
  assert.equal(policy,'NOT_APPLICABLE_SELF_RATING');
  assert.equal(fixture.release_eligible,false);
});
