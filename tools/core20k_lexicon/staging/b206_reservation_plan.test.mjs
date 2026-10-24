import test from 'node:test';import assert from 'node:assert/strict';import {planReservations} from './b206_reservation_plan.mjs';
const c=[{candidate_id:'B180-P002',headword_id:'h714',sense_id:'s1'}];
test('untrusted authority always blocks',()=>assert.equal(planReservations({candidates:c,existingIds:[],approvedIds:['B180-P002']}).status,'BLOCKED'));
test('missing sense blocks',()=>assert.equal(planReservations({candidates:[{...c[0],sense_id:null}],existingIds:[],approvedIds:['B180-P002'],authorityVerified:true}).status,'BLOCKED'));
test('duplicate candidate blocks',()=>assert.equal(planReservations({candidates:[...c,...c],existingIds:[],approvedIds:['B180-P002'],authorityVerified:true}).status,'BLOCKED'));
test('deterministic plan never registers',()=>{const args={candidates:c,existingIds:[],approvedIds:['B180-P002'],authorityVerified:true};const a=planReservations(args),b=planReservations(args);assert.deepEqual(a,b);assert.equal(a.status,'PLAN_ONLY');assert.equal(a.writes,0);assert.equal(a.formally_registered,false)});
