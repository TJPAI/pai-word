import test from 'node:test';import assert from 'node:assert/strict';import {canRegisterKU} from './core20k-ku-registration-gate.mjs';
const candidate={candidate_id:'c1',target_sense_id:'s1',ku_id:'new-ku-1',pos:'n.',gloss_zh:'测试',gloss_en:'a test',review_status:'accepted',evidence_locator:'snapshot:entry1',evidence_scope:'FIRST_SENSE_POS'};
test('unlicensed evidence blocks registration',()=>assert.equal(canRegisterKU(candidate,{license_status:'pending'}).eligible,false));
test('legacy KU collision blocks registration',()=>assert.equal(canRegisterKU(candidate,{license_status:'approved'},new Set(['new-ku-1'])).eligible,false));
test('missing evidence blocks registration',()=>assert.equal(canRegisterKU({...candidate,evidence_locator:''},{license_status:'approved'}).eligible,false));
test('fully eligible fixture passes gate, not runtime acceptance',()=>assert.equal(canRegisterKU(candidate,{license_status:'approved'}).eligible,true));
