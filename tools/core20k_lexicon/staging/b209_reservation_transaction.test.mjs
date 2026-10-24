import test from 'node:test';import assert from 'node:assert/strict';
import {reserveWithTransaction} from './b209_reservation_transaction.mjs';
const req={reservation_key:'proposal_1',candidate_id:'c1',headword_id:'h1',sense_id:'s1',
 revision_sha256:'a'.repeat(64),authority_release_id:'r1',runtime_sha256:'b'.repeat(64)};
const verify=async r=>({status:'VERIFIED',candidate_id:r.candidate_id,revision_sha256:r.revision_sha256,
 authority_release_id:r.authority_release_id,runtime_sha256:r.runtime_sha256});
test('unverified candidate executes no SQL',async()=>{const sql=[];const r=await reserveWithTransaction({query:async q=>sql.push(q)},req,async()=>({status:'REJECTED'}));assert.equal(r.status,'BLOCKED');assert.equal(sql.length,0)});
test('valid reservation is transactional but never mints a KU ID',async()=>{const sql=[];const r=await reserveWithTransaction({query:async q=>sql.push(q)},req,verify);assert.equal(r.status,'RESERVED');assert.equal(r.formal_ku_id,null);assert.deepEqual([sql[0],sql.at(-1)],['BEGIN ISOLATION LEVEL SERIALIZABLE','COMMIT'])});
test('unique constraint collision rolls back',async()=>{const sql=[];const r=await reserveWithTransaction({query:async q=>{sql.push(q);if(q.startsWith('INSERT'))throw Object.assign(new Error('duplicate'),{code:'23505'})}},req,verify);assert.equal(r.status,'CONFLICT');assert.equal(sql.at(-1),'ROLLBACK')});
test('serialization error rolls back and requires retry',async()=>{const sql=[];const r=await reserveWithTransaction({query:async q=>{sql.push(q);if(q.startsWith('INSERT'))throw Object.assign(new Error('serial'),{code:'40001'})}},req,verify);assert.equal(r.status,'RETRYABLE');assert.equal(sql.at(-1),'ROLLBACK')});
