// B206: pure, deterministic, fail-closed ID reservation planning. NO WRITES.
import {createHash} from 'node:crypto';
export function planReservations({candidates, existingIds, approvedIds, authorityVerified=false}) {
 const errors=[];
 if(authorityVerified!==true)errors.push('AUTHORITY_NOT_VERIFIED');
 if(!Array.isArray(candidates)||!Array.isArray(existingIds)||!Array.isArray(approvedIds))errors.push('INVALID_INPUT');
 if(errors.length)return {status:'BLOCKED',errors,reservations:[],writes:0};
 const existing=new Set(existingIds), approved=new Set(approvedIds);
 if(existing.size!==existingIds.length)errors.push('DUPLICATE_EXISTING_ID');
 const seen=new Set(),proposals=[];
 for(const c of candidates){
  if(!c||typeof c.candidate_id!=='string'||!c.candidate_id||seen.has(c.candidate_id)) {errors.push('INVALID_OR_DUPLICATE_CANDIDATE');continue}
  seen.add(c.candidate_id);
  if(!approved.has(c.candidate_id))errors.push('CANDIDATE_NOT_APPROVED');
  if(typeof c.headword_id!=='string'||!c.headword_id||typeof c.sense_id!=='string'||!c.sense_id)errors.push('OWNER_UNRESOLVED');
  // Proposed ID is deterministic, never a formally allocated KU ID.
  const digest=createHash('sha256').update(c.candidate_id+'\0'+c.headword_id+'\0'+c.sense_id).digest('hex').slice(0,20);
  proposals.push({candidate_id:c.candidate_id,proposed_reservation_key:'proposal_'+digest});
 }
 const keys=proposals.map(x=>x.proposed_reservation_key);
 if(new Set(keys).size!==keys.length||keys.some(k=>existing.has(k)))errors.push('RESERVATION_COLLISION');
 return {status:errors.length?'BLOCKED':'PLAN_ONLY',errors,reservations:errors.length?[]:proposals,writes:0,
   formally_registered:false,release_eligible:false,srs_write_allowed:false};
}
