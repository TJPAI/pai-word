import test from 'node:test';
import assert from 'node:assert/strict';
import {teachingCandidatesEnabled,validateTeachingCandidatePack,loadTeachingCandidates} from '../rebuild-preview/core20k-teaching-candidate-adapter.mjs';
const ids={knownKuIds:new Set(['ku1','ku2']),knownSenseIds:new Set(['s1']),knownHeadwordIds:new Set(['w1'])};
const candidate=(overrides={})=>({ku_id:'ku1',sense_id:'s1',headword_id:'w1',ku_type:'sense',review_status:'approved',semantic_risk:false,card:{prompt:'test',answer:'answer'},...overrides});
const pack=candidates=>({schema_version:'pai-core20k-teaching-candidates-v1',candidates});
test('feature flag is off unless explicitly opted in',()=>{assert.equal(teachingCandidatesEnabled(''),false);assert.equal(teachingCandidatesEnabled('?core20kteaching=1'),true)});
test('valid identities are required before candidate acceptance',()=>{assert.equal(validateTeachingCandidatePack(pack([candidate()]),ids).accepted.length,1);assert.equal(validateTeachingCandidatePack(pack([candidate()])).accepted.length,0)});
test('semantic risk and draft content are quarantined',()=>{const r=validateTeachingCandidatePack(pack([candidate({semantic_risk:true}),candidate({ku_id:'ku2',review_status:'draft'})]),ids);assert.equal(r.accepted.length,0);assert.equal(r.quarantined.length,2)});
test('unknown IDs and duplicate KU are quarantined',()=>{const r=validateTeachingCandidatePack(pack([candidate(),candidate(),candidate({ku_id:'not_in_baseline'})]),ids);assert.equal(r.accepted.length,1);assert.equal(r.quarantined.length,2)});
test('type identity is preserved, not converted into a generic question',()=>{const r=validateTeachingCandidatePack(pack([candidate({ku_type:'contrast',card:{prompt:'choose',answer:'A',comparison:'a vs b'}})]),ids);assert.equal(r.accepted[0].ku_type,'contrast');assert.equal(r.accepted[0].card.comparison,'a vs b')});
test('disabled flag performs no fetch',async()=>{const r=await loadTeachingCandidates({enabled:false,fetcher:()=>{throw Error('must not fetch')}});assert.equal(r.reason,'disabled')});
test('failed fetch safely falls back',async()=>{const r=await loadTeachingCandidates({enabled:true,url:'/missing.json',fetcher:async()=>({ok:false})});assert.equal(r.enabled,false);assert.equal(r.reason,'http_error')});

test('missing runtime pack fails closed without requesting a network asset',async()=>{
 const r=await loadTeachingCandidates({enabled:true});
 assert.equal(r.enabled,false);
 assert.equal(r.reason,'missing_pack');
 assert.deepEqual(r.accepted,[]);
});
test('unknown KU types are never coerced to sense',()=>{
 const r=validateTeachingCandidatePack(pack([candidate({ku_type:'unsupported'})]),ids);
 assert.equal(r.accepted.length,0);
 assert.ok(r.quarantined[0].reasons.includes('unknown_ku_type'));
});

test('incomplete teaching cards are quarantined',()=>{
 const r=validateTeachingCandidatePack(pack([candidate({card:{prompt:'question only'}})]),ids);
 assert.equal(r.accepted.length,0);
 assert.ok(r.quarantined[0].reasons.includes('incomplete_card'));
});

test('missing identity baseline quarantines every candidate without accepting any',()=>{
 const r=validateTeachingCandidatePack(pack([candidate(),candidate({ku_id:'ku2'})]));
 assert.equal(r.ok,false);
 assert.equal(r.accepted.length,0);
 assert.equal(r.quarantined.length,2);
 assert.deepEqual(r.errors,['identity_sets_required']);
});
test('unknown schema is rejected even with valid-looking candidates',()=>{
 const r=validateTeachingCandidatePack({schema_version:'unknown',candidates:[candidate()]},ids);
 assert.equal(r.ok,false);
 assert.ok(r.errors.includes('schema_version'));
});
