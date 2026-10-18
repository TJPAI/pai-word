// Offline Core20K KU registration gate. No SRS reads/writes and no automatic activation.
export function canRegisterKU(candidate, source, lockedLegacyIDs = new Set()) {
  const reasons=[];
  if (!candidate?.candidate_id || !candidate?.target_sense_id) reasons.push('MISSING_TARGET_IDENTITY');
  if (!candidate?.pos || !candidate?.gloss_zh || !candidate?.gloss_en) reasons.push('MISSING_LEARNING_CONTENT');
  if (candidate?.review_status !== 'accepted') reasons.push('NOT_EDITORIALLY_ACCEPTED');
  if (source?.license_status !== 'approved') reasons.push('LICENSE_NOT_APPROVED');
  if (!candidate?.evidence_locator || !candidate?.evidence_scope) reasons.push('MISSING_FIELD_EVIDENCE');
  if (!candidate?.ku_id || lockedLegacyIDs.has(candidate.ku_id)) reasons.push('MISSING_OR_COLLIDING_KU_ID');
  return {eligible:reasons.length===0,reasons};
}
