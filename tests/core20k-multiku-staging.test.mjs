import test from 'node:test';import assert from 'node:assert/strict';
import {inspectMultiKUStaging,validateTeachingKU,KU_TYPES} from '../scripts/core20k-multiku-staging.mjs';
const base={headword_id:'w',headword:'book',rank:1,sense_id:'s',ku_id:'k',
 pos:'n',ku_type:'Collocation',teaching_objective:'recall a useful phrase',
 prompt:'Complete: ___ a room',correct_answer:'book',explanation_zh:'预订房间',
 example_en:'Book a room ahead.',example_zh:'提前订房',difficulty:'common',
 quality_status:'EDITORIAL_UNVERIFIED',evidence_status:'EVIDENCE_LINKED',
 source_attribution:['editorial_source'],related_ku_ids:[],
 collocation:{expression:'book a room',usage_context:'travel'}};
test('supports all six KU types without granting staged content eligibility',()=>{
 assert.equal(KU_TYPES.length,6);
 const r=inspectMultiKUStaging([base]);
 assert.equal(r.eligible,0);assert(r.results[0].errors.includes('NOT_CERTIFIED'));
});
test('rejects missing typed details, Sense links and collisions',()=>{
 const r=validateTeachingKU({...base,quality_status:'PRODUCTION_READY',evidence_status:'PRODUCTION_READY'},
 {knownSenseIds:new Set(['other']),knownKUIds:new Set(['k'])});
 assert(r.errors.includes('UNRESOLVED_SENSE_ID'));
 assert(r.errors.includes('KU_ID_COLLISION'));
 const g=validateTeachingKU({...base,ku_type:'Grammar',grammar:null});
 assert(g.errors.includes('GRAMMAR_STRUCTURE'));
});
test('does not mistake duplicate IDs for independent study units',()=>{
 const r=inspectMultiKUStaging([base,base]);
 assert.equal(r.total,2);assert(r.results[1].errors.includes('DUPLICATE_KU_ID'));
});
