// B201 fail-closed pre-registration authority check. Staging-only; does not mint IDs or write Runtime.
export function preflightAuthority(record, registry) {
  const errors=[];
  const fail=(condition,code)=>{if(!condition)errors.push(code)};
  fail(registry?.schema==='pai-core20k-authoritative-registry-v1','NO_AUTHORITATIVE_REGISTRY');
  fail(typeof registry?.runtime_sha256==='string'&&/^[a-f0-9]{64}$/.test(registry.runtime_sha256),'NO_FROZEN_RUNTIME_HASH');
  fail(typeof record?.candidate_id==='string'&&!!record.candidate_id,'NO_CANDIDATE_ID');
  fail(typeof record?.headword==='string'&&!!record.headword,'NO_HEADWORD');
  const owner=registry?.headwords?.[record?.headword];
  fail(!!owner&&owner.rank===record?.rank,'HEADWORD_OWNER_NOT_VERIFIED');
  const sense=registry?.senses?.[record?.sense_id];
  fail(!!sense&&sense.headword===record?.headword&&sense.approval==='APPROVED','SENSE_OWNER_NOT_APPROVED');
  fail(typeof record?.revision_hash==='string'&&/^[a-f0-9]{64}$/.test(record.revision_hash)&&
    registry?.approved_editorial_reviews?.[record?.candidate_id]?.revision_hash===record.revision_hash,'EDITORIAL_REVISION_NOT_APPROVED');
  fail(registry?.source_licenses?.[record?.source_id]==='APPROVED','SOURCE_LICENSE_NOT_APPROVED');
  fail(typeof record?.evidence_locator==='string'&&!!record.evidence_locator&&
       typeof record?.evidence_scope==='string'&&!!record.evidence_scope,'FIELD_EVIDENCE_MISSING');
  fail(registry?.registrar_approval?.status==='APPROVED'&&registry?.registrar_approval?.runtime_sha256===registry?.runtime_sha256,'REGISTRAR_APPROVAL_MISSING');
  // Even a clean result is a readiness decision, not an ID allocation or release.
  return Object.freeze({eligible_for_id_reservation:errors.length===0,errors,
    registered:false,release_eligible:false,srs_write_allowed:false});
}
