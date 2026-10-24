import {createHash,timingSafeEqual} from 'node:crypto';
import {preflightAuthority} from './b201_authority_preflight.mjs';

// An approval-looking JSON document is not an authority.
// trusted.sha256 MUST come from a separate, controlled release manifest,
// never from registryJson or the candidate. No trusted manifest => BLOCK.
export function verifiedPreflight(record, registryJson, trusted) {
  const blocked=(reason)=>Object.freeze({eligible_for_id_reservation:false,registered:false,
    release_eligible:false,srs_write_allowed:false,errors:[reason]});
  if(typeof registryJson!=='string'||!trusted||trusted.authority!=='FORMAL_RELEASE_REGISTRY'||
     typeof trusted.sha256!=='string'||!/^[a-f0-9]{64}$/.test(trusted.sha256)||
     trusted.release_approved!==true) return blocked('TRUSTED_REGISTRY_MANIFEST_MISSING');
  const digest=createHash('sha256').update(Buffer.from(registryJson,'utf8')).digest();
  const expected=Buffer.from(trusted.sha256,'hex');
  if(!timingSafeEqual(digest,expected))return blocked('TRUSTED_REGISTRY_HASH_MISMATCH');
  let registry;
  try {registry=JSON.parse(registryJson)}catch{return blocked('INVALID_REGISTRY_JSON')}
  if(registry.runtime_sha256!==trusted.runtime_sha256)return blocked('RUNTIME_BASELINE_MISMATCH');
  if(trusted.runtime_sha256!=='e91e2ab357d6f09f8747c4396a2d88bde67150a9112d7bfe63730117a6ddfb1b')
    return blocked('UNAPPROVED_RUNTIME_BASELINE');
  return preflightAuthority(record,registry);
}
