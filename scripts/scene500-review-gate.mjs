// Review-only overlay gate. B155/B156/B163 drafts never grant canonical learning eligibility.
export function validateReviewIndex(data) {
 if(data?.schema!=='pai-scene500-review-index-v1'||data.review_through!=='B163')throw Error('SCENE500_REVIEW_SCHEMA');
 if(!Array.isArray(data.records)||data.records.length!==376)throw Error('SCENE500_REVIEW_COUNT');
 if(data.records.some(r=>r.production_eligible!==false))throw Error('SCENE500_UNAUTHORIZED_PRODUCTION');
 if(data.qa?.productionEligible!==0||data.qa?.hasCanonicalKUAssignments!==0)throw Error('SCENE500_REVIEW_GATE');
 return {reviewRecords:data.records.length,productionEligible:0};
}
