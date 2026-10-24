import test from 'node:test';
import assert from 'node:assert/strict';
import {validateBatch136Fixture,loadBatch136Fixture,normalizeBatch136Smoke} from '../rebuild-preview/core20k-batch136-runtime-gate.mjs';
const identity={knownKuIds:new Set(['k1','k2']),knownSenseIds:new Set(['s1']),knownHeadwordIds:new Set(['h1'])};
const record=(x={})=>({ku_id:'k1',sense_id:'s1',headword_id:'h1',ku_type:'sense',render_kind:'cloze',question:'Go ___.',response:{answer:'out',example_en:'Go out.',example_zh:'出去。'},risk_flags:[],triage:{ku_id:'k1',release_eligible:false,risk_flags:[]},test_only:true,release_eligible:false,semantic_verified:false,requires_review:true,...x,triage:{ku_id:x.ku_id||'k1',release_eligible:false,risk_flags:[],...x.triage}});
const pack=records=>({schema_version:'core20k-runtime-fixture-v1-test-guarded',test_only:true,release_eligible:false,default_enabled:false,records});
test('default-off never fetches',async()=>{const r=await loadBatch136Fixture({enabled:false,fetcher:()=>{throw Error('fetch attempted')}});assert.equal(r.reason,'disabled')});
test('missing fixture fails closed',async()=>{const r=await loadBatch136Fixture({enabled:true});assert.equal(r.enabled,false);assert.equal(r.reason,'missing_fixture')});
test('identity baseline required',()=>{const r=validateBatch136Fixture(pack([record()]));assert.equal(r.ok,false);assert.equal(r.accepted.length,0)});
test('test-only cloze is forced render-only even if source asks for scoring',()=>{const r=validateBatch136Fixture(pack([record({automated_srs_scoring_enabled:true,render_only:false})]),identity);assert.equal(r.accepted.length,1);assert.equal(r.accepted[0].automated_srs_scoring_enabled,false);assert.equal(r.accepted[0].render_only,true)});
test('no machine answer is quarantined',()=>{const r=validateBatch136Fixture(pack([record({response:{example_en:'Go out.',example_zh:'出去。'}})]),identity);assert.equal(r.accepted.length,0);assert.ok(r.quarantined[0].reasons.includes('missing_answer'))});
test('unsafe pack flags reject entire pack',()=>{const p=pack([record()]);p.release_eligible=true;const r=validateBatch136Fixture(p,identity);assert.equal(r.ok,false);assert.equal(r.accepted.length,0)});
test('risk and review gate are enforced',()=>{const r=validateBatch136Fixture(pack([record({risk_flags:['semantic_risk']}),record({ku_id:'k2',requires_review:false})]),identity);assert.equal(r.accepted.length,0);assert.equal(r.quarantined.length,2)});
test('recognition cards remain recognition, not cloze',()=>{const r=validateBatch136Fixture(pack([record({render_kind:'sense_recognition',response:{gloss_zh:'在外面'}})]),identity);assert.equal(r.accepted[0].render_kind,'sense_recognition');assert.equal(r.accepted[0].render_only,true)});

test('missing triage risk flags fail closed',()=>{const r=validateBatch136Fixture(pack([record({triage:{risk_flags:null}})]),identity);assert.equal(r.accepted.length,0);assert.ok(r.quarantined[0].reasons.includes('risk_flags'))});
test('triage KU mismatch is quarantined',()=>{const r=validateBatch136Fixture(pack([record({triage:{ku_id:'other'}})]),identity);assert.equal(r.accepted.length,0);assert.ok(r.quarantined[0].reasons.includes('triage_contract'))});

test('smoke subset requires explicit safe envelope normalization',()=>{
 const smoke={test_only:true,release_eligible:false,records:[record()]};
 const normalized=normalizeBatch136Smoke(smoke);
 assert.equal(normalized.default_enabled,false);
 assert.equal(normalized.schema_version,'core20k-runtime-fixture-v1-test-guarded');
 assert.equal(validateBatch136Fixture(normalized,identity).accepted.length,1);
 assert.equal(normalizeBatch136Smoke({...smoke,release_eligible:true}),null);
});

test('smoke loader accepts safe subset only in explicit smoke mode',async()=>{
 const smoke={test_only:true,release_eligible:false,records:[record()]};
 const fetcher=async()=>({ok:true,json:async()=>smoke});
 const ordinary=await loadBatch136Fixture({enabled:true,url:'/smoke.json',identity,fetcher});
 assert.equal(ordinary.enabled,false);
 const enabled=await loadBatch136Fixture({enabled:true,url:'/smoke.json',identity,smoke:true,fetcher});
 assert.equal(enabled.enabled,true);
 assert.equal(enabled.accepted.length,1);
 assert.equal(enabled.accepted[0].automated_srs_scoring_enabled,false);
 assert.equal(enabled.accepted[0].render_only,true);
});
