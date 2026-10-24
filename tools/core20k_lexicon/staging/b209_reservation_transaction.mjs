// B209: reservation transaction executor; requires an injected trusted authority verifier.
// Caller MUST provide a dedicated PostgreSQL connection (a pg Client, or a
// PoolClient obtained via pool.connect()) and MUST own its lifecycle
// (connect before, release after). Never pass a pg Pool: Pool.query routes
// each statement to an arbitrary pooled connection, which silently breaks
// BEGIN/INSERT/COMMIT ownership. Pool-shaped clients are rejected below.
// Never accepts a boolean 'approved' from the candidate as authority.
// A RETRYABLE result means the caller must recheck authority, then retry;
// the executor itself never retries. BLOCKED attempts write no database
// rows by design: audit coverage is reservations plus their RESERVED events.
export async function reserveWithTransaction(client, request, verifyAuthority) {
 if(!client||typeof client.query!=='function'||typeof verifyAuthority!=='function')
  throw new TypeError('TRUSTED_DEPENDENCIES_REQUIRED');
 // pg Pool exposes .connect plus pool counters (totalCount/idleCount/
 // waitingCount); dedicated clients (pg Client, PoolClient) expose neither
 // counter. Rejecting on this shape keeps a shared pool from silently
 // scattering one transaction across connections.
 if(typeof client.connect==='function'&&(typeof client.totalCount==='number'||
    typeof client.idleCount==='number'||typeof client.waitingCount==='number'))
  throw new TypeError('DEDICATED_CLIENT_REQUIRED');
 if(!request||!['reservation_key','candidate_id','headword_id','sense_id','revision_sha256','authority_release_id','runtime_sha256']
  .every(k=>typeof request[k]==='string'&&request[k].trim()))
  return {status:'BLOCKED',reason:'INVALID_REQUEST'};
 if(!/^[0-9a-f]{64}$/.test(request.revision_sha256)||!/^[0-9a-f]{64}$/.test(request.runtime_sha256))
  return {status:'BLOCKED',reason:'INVALID_HASH'};
 const auth=await verifyAuthority(request);
 if(auth?.status!=='VERIFIED'||auth.candidate_id!==request.candidate_id||
    auth.headword_id!==request.headword_id||auth.sense_id!==request.sense_id||
    auth.revision_sha256!==request.revision_sha256||
    auth.runtime_sha256!==request.runtime_sha256||
    auth.authority_release_id!==request.authority_release_id)
  return {status:'BLOCKED',reason:'AUTHORITY_NOT_VERIFIED'};
 let started=false;
 try {
  await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');started=true;
  await client.query(
   'INSERT INTO core20k_qa.ku_reservations (reservation_key,candidate_id,headword_id,sense_id,revision_sha256,authority_release_id,runtime_sha256) VALUES ($1,$2,$3,$4,$5,$6,$7)',
   [request.reservation_key,request.candidate_id,request.headword_id,request.sense_id,
    request.revision_sha256,request.authority_release_id,request.runtime_sha256]);
  await client.query('INSERT INTO core20k_qa.registration_events (reservation_key,event_type) VALUES ($1,$2)',
   [request.reservation_key,'RESERVED']);
  await client.query('COMMIT');started=false;
  return {status:'RESERVED',formal_ku_id:null,release_eligible:false,srs_write_allowed:false};
 }catch(e){
  if(started){try{await client.query('ROLLBACK');}catch(rollbackError){
   throw new AggregateError([e,rollbackError],'RESERVATION_AND_ROLLBACK_FAILED');
  }}
  if(e?.code==='23505')return {status:'CONFLICT',reason:'DUPLICATE_RESERVATION'};
  if(e?.code==='40001')return {status:'RETRYABLE',reason:'SERIALIZATION_FAILURE'};
  throw e;
 }
}
