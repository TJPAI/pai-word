import test from 'node:test';import assert from 'node:assert/strict';
import {reserveWithTransaction} from './b209_reservation_transaction.mjs';
const req={reservation_key:'proposal_1',candidate_id:'c1',headword_id:'h1',sense_id:'s1',
 revision_sha256:'a'.repeat(64),authority_release_id:'r1',runtime_sha256:'b'.repeat(64)};
const verify=async r=>({status:'VERIFIED',candidate_id:r.candidate_id,headword_id:r.headword_id,sense_id:r.sense_id,revision_sha256:r.revision_sha256,
 authority_release_id:r.authority_release_id,runtime_sha256:r.runtime_sha256});
test('unverified candidate executes no SQL',async()=>{const sql=[];const r=await reserveWithTransaction({query:async q=>sql.push(q)},req,async()=>({status:'REJECTED'}));assert.equal(r.status,'BLOCKED');assert.equal(sql.length,0)});
test('valid reservation is transactional but never mints a KU ID',async()=>{const sql=[];const r=await reserveWithTransaction({query:async q=>sql.push(q)},req,verify);assert.equal(r.status,'RESERVED');assert.equal(r.formal_ku_id,null);assert.deepEqual([sql[0],sql.at(-1)],['BEGIN ISOLATION LEVEL SERIALIZABLE','COMMIT'])});
test('unique constraint collision rolls back',async()=>{const sql=[];const r=await reserveWithTransaction({query:async q=>{sql.push(q);if(q.startsWith('INSERT'))throw Object.assign(new Error('duplicate'),{code:'23505'})}},req,verify);assert.equal(r.status,'CONFLICT');assert.equal(sql.at(-1),'ROLLBACK')});
test('serialization error rolls back and requires retry',async()=>{const sql=[];const r=await reserveWithTransaction({query:async q=>{sql.push(q);if(q.startsWith('INSERT'))throw Object.assign(new Error('serial'),{code:'40001'})}},req,verify);assert.equal(r.status,'RETRYABLE');assert.equal(sql.at(-1),'ROLLBACK')});

test('authority cannot substitute a different headword or sense',async()=>{
 for(const field of ['headword_id','sense_id']){
  const sql=[];const result=await reserveWithTransaction({query:async q=>sql.push(q)},req,
   async r=>({...await verify(r),[field]:'wrong'}));
  assert.deepEqual(result,{status:'BLOCKED',reason:'AUTHORITY_NOT_VERIFIED'});
  assert.equal(sql.length,0);
 }
});
test('invalid revision or runtime hash blocks before authority and SQL',async()=>{
 for(const field of ['revision_sha256','runtime_sha256']){
  let called=false;const sql=[];
  const result=await reserveWithTransaction({query:async q=>sql.push(q)},{...req,[field]:'bad'},async()=>{called=true;return verify(req)});
  assert.deepEqual(result,{status:'BLOCKED',reason:'INVALID_HASH'});
  assert.equal(called,false);assert.equal(sql.length,0);
 }
});
test('rollback failure preserves original error',async()=>{
 const original=Object.assign(new Error('insert failed'),{code:'23505'});
 const rollback=new Error('rollback failed');
 await assert.rejects(
  reserveWithTransaction({query:async q=>{
   if(q.startsWith('INSERT'))throw original;
   if(q==='ROLLBACK')throw rollback;
  }},req,verify),
  e=>e instanceof AggregateError&&e.errors[0]===original&&e.errors[1]===rollback
 );
});

// B214: authority must bind ALL six identity fields, not only headword/sense.
test('authority must bind all six identity fields',async()=>{
 for(const field of ['candidate_id','headword_id','sense_id','revision_sha256','runtime_sha256','authority_release_id']){
  const sql=[];const result=await reserveWithTransaction({query:async q=>sql.push(q)},req,
   async r=>({...await verify(r),[field]:field.includes('sha256')?'0'.repeat(64):'wrong'}));
  assert.deepEqual(result,{status:'BLOCKED',reason:'AUTHORITY_NOT_VERIFIED'},field);
  assert.equal(sql.length,0,field);
 }
});

// B214: a mock approval flag is not authority in any shape.
test('mock approval flags cannot bypass authority',async()=>{
 const mocks=[
  async()=>({approved:true}),
  async r=>({...await verify(r), status:'APPROVED'}),
  async r=>{const v=await verify(r);delete v.runtime_sha256;return v;},
  async()=>({status:'VERIFIED'}),
 ];
 for(const mock of mocks){
  const sql=[];const result=await reserveWithTransaction({query:async q=>sql.push(q)},req,mock);
  assert.equal(result.status,'BLOCKED');assert.equal(result.reason,'AUTHORITY_NOT_VERIFIED');
  assert.equal(sql.length,0);
 }
});

// B214: an 'approved' flag smuggled inside the request is ignored.
test('approved flag inside request is ignored',async()=>{
 const sql=[];const result=await reserveWithTransaction({query:async q=>sql.push(q)},
  {...req,approved:true},async()=>({status:'REJECTED'}));
 assert.equal(result.status,'BLOCKED');assert.equal(sql.length,0);
});

// B214: malformed requests block before authority and SQL.
test('invalid request blocks before authority and SQL',async()=>{
 for(const bad of [{...req,candidate_id:''},{...req,sense_id:'   '}]){
  let called=false;const sql=[];
  const result=await reserveWithTransaction({query:async q=>sql.push(q)},bad,async()=>{called=true;return verify(bad)});
  assert.deepEqual(result,{status:'BLOCKED',reason:'INVALID_REQUEST'});
  assert.equal(called,false);assert.equal(sql.length,0);
 }
});

// B214: missing trusted dependencies fail closed with TypeError.
test('missing client or verifier throws',async()=>{
 await assert.rejects(reserveWithTransaction(null,req,verify),e=>e instanceof TypeError&&e.message==='TRUSTED_DEPENDENCIES_REQUIRED');
 await assert.rejects(reserveWithTransaction({query:async()=>{}},req,null),e=>e instanceof TypeError&&e.message==='TRUSTED_DEPENDENCIES_REQUIRED');
});

// B214: a throwing verifier fails closed instead of degrading to BLOCKED.
test('throwing verifier propagates, never degrades to BLOCKED',async()=>{
 const boom=new Error('authority unavailable');
 await assert.rejects(reserveWithTransaction({query:async()=>{}},req,async()=>{throw boom;}),e=>e===boom);
});

// B214: pool-shaped clients are rejected; dedicated-client-shaped clients pass.
test('pool-shaped client is rejected, dedicated client shape is accepted',async()=>{
 const poolLike={query:async()=>{},connect:async()=>{},totalCount:1,idleCount:1};
 await assert.rejects(reserveWithTransaction(poolLike,req,verify),
  e=>e instanceof TypeError&&e.message==='DEDICATED_CLIENT_REQUIRED');
 const sql=[];const dedicated={query:async q=>sql.push(q),release:()=>{}};
 const result=await reserveWithTransaction(dedicated,req,verify);
 assert.equal(result.status,'RESERVED');
 assert.deepEqual([sql[0],sql.at(-1)],['BEGIN ISOLATION LEVEL SERIALIZABLE','COMMIT']);
});
