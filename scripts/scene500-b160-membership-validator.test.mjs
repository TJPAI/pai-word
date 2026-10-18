import assert from 'node:assert/strict';import {validateFrozenMembership} from './scene500-b160-membership-validator.mjs';
const entries=Array.from({length:20000},(_,i)=>[i+1,'word-'+(i+1)]);
const a={release:'Core20K_LongTerm_V2.0.6',type:'MEMBERSHIP_ONLY_NOT_LEARNING_CONTENT',entries};
assert.equal(validateFrozenMembership(a).pass,true);
assert.equal(validateFrozenMembership({...a,entries:entries.slice(1)}).pass,false);
assert.equal(validateFrozenMembership({...a,entries:[...entries.slice(0,-1),[20000,'WORD-1']]}).pass,false);
assert.equal(validateFrozenMembership({...a,release:'other'}).pass,false);
console.log('Core20K membership validation PASS');