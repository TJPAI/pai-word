// B209: reservation transaction executor; requires an injected trusted authority verifier.
// Caller MUST provide a real PostgreSQL client with query and transactional connection ownership.
// Never accepts a boolean 'approved' from the candidate as authority.
export async function reserveWithTransaction(client, request, verifyAuthority) {
 if(!client||typeof client.query!=='function'||typeof verifyAuthority!=='function')
  throw new TypeError('TRUSTED_DEPENDENCIES_REQUIRED');
 if(!request||!['reservation_key','candidate_id','headword_id','sense_id','revision_sha256','authority_release_id','runtime_sha256']
  .every(k=>typeof request[k]==='string'&&request[k].trim()))
  return {status:'BLOCKED',reason:'INVALID_REQUEST'};
 const auth=await verifyAuthority(request);
 if(auth?.status!=='VERIFIED'||auth.candidate_id!==request.candidate_id||
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
  if(started)await client.query('ROLLBACK');
  if(e?.code==='23505')return {status:'CONFLICT',reason:'DUPLICATE_RESERVATION'};
  if(e?.code==='40001')return {status:'RETRYABLE',reason:'SERIALIZATION_FAILURE'};
  throw e;
 }
}
