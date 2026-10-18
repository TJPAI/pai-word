// Build-only pronunciation coverage guard; never promotes CMU ARPAbet to US IPA.
export function assessPronunciationCoverage(row, source) {
  const reasons=[];
  if(row?.license_status!=='approved' || source?.redistribution_approved!==true) reasons.push('LICENSE_PENDING');
  if(!row?.arpabet_example) reasons.push('NO_CMU_ENTRY');
  if(!row?.us_ipa) reasons.push('NO_US_IPA_CONVERSION');
  if(row?.ipa_sense_alignment!=='verified') reasons.push('NO_SENSE_ALIGNMENT');
  return {releaseEligible: reasons.length===0,reasons};
}
