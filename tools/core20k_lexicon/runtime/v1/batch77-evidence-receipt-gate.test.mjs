import assert from 'node:assert/strict';
import {checkEvidenceReceipts,certifyAllOrBlock} from './batch77-evidence-receipt-gate.mjs';
const r={ku_id:'ku-old',headword_id:'core20k:rank:78',rank:78,sense_id:'s-old',source_url:'https://dictionary.cambridge.org/grammar/'};
assert.equal(checkEvidenceReceipts(r,{}).eligible,false);
const untrusted=Object.fromEntries(['source_claim_reviewed','sense_alignment_signed','bilingual_signed','ipa_pos_context_signed','unique_answer_signed','independent_editorial_signoff','runtime_e2e_signed'].map(x=>[x,{approved:true}]));
assert.equal(checkEvidenceReceipts(r,untrusted).eligible,false);
assert.equal(certifyAllOrBlock([r]).accepted.length,0);
assert.throws(()=>certifyAllOrBlock([r,r]),/DUPLICATE_KU_ID/);
console.log('PASS batch77: missing receipts and self-declared booleans rejected, duplicate IDs rejected');
