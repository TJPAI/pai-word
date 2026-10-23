import assert from 'node:assert/strict';import {assessCertification,gateCertifiedRecords} from './batch76-certification-gate.mjs';
const r={ku_id:'EXISTING_KU',headword_id:'core20k:rank:78',rank:78,sense_id:'EXISTING_SENSE'};
const g=assessCertification(r,{type_specific_external_evidence_verified:true});
assert.equal(g.production_ready,false);assert(g.blockers.includes('independent_editorial_signoff'));
assert.equal(gateCertifiedRecords([r]).eligible.length,0);
assert.throws(()=>gateCertifiedRecords([r,r]),/DUPLICATE_KU_ID/);
assert.equal(assessCertification({...r,headword_id:'wrong'}).tests.frozen_identity,false);
console.log('PASS: fail-closed certification evidence required; duplicates rejected');