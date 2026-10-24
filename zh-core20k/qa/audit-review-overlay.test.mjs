import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {auditReviewOverlay} from './audit-review-overlay.mjs';
const id=t=>'zh_'+createHash('sha256').update(t).digest('hex').slice(0,20);
const fixture=()=>{const term='天气',term_id=id(term);return {runtime:{terms:Array.from({length:20000},(_,i)=>i===0?{term_id,term}:{term_id:id('样词'+i),term:'样词'+i})},queue:[{term_id,term}],overlay:{entries:[{term_id,term,evidence_grade:'AI_PRELIMINARY',membership_action:'NONE'}]}}};
test('valid preliminary overlay passes',()=>{const f=fixture();assert.equal(auditReviewOverlay(f.runtime,f.queue,f.overlay).ok,true);});
test('fake headword without URL rejected',()=>{const f=fixture();f.overlay.entries[0].evidence_grade='DIRECT_DICTIONARY_HEADWORD';assert(auditReviewOverlay(f.runtime,f.queue,f.overlay).errors.some(s=>s.startsWith('MISSING_SOURCE_URL')));});
test('invented identity rejected',()=>{const f=fixture();f.overlay.entries[0].term_id='zh_'+'f'.repeat(20);assert(auditReviewOverlay(f.runtime,f.queue,f.overlay).errors.some(s=>s.startsWith('OVERLAY_IDENTITY')));});
test('attempted membership alteration rejected',()=>{const f=fixture();f.overlay.entries[0].membership_action='DELETE';assert(auditReviewOverlay(f.runtime,f.queue,f.overlay).errors.some(s=>s.startsWith('FORBIDDEN_MEMBERSHIP_ACTION')));});
test('attempted frequency alteration rejected',()=>{const f=fixture();f.overlay.entries[0].frequency_rank=1;assert(auditReviewOverlay(f.runtime,f.queue,f.overlay).errors.some(s=>s.startsWith('FORBIDDEN_FREQUENCY_MUTATION')));});

test('empty or incompatible overlays fail closed',()=>{const f=fixture();f.overlay={verified:[]};assert(auditReviewOverlay(f.runtime,f.queue,f.overlay).errors.includes('EMPTY_OR_INVALID_OVERLAY'));});
