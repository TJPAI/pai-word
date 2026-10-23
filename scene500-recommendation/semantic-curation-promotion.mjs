// Convert a reviewed curation queue into the existing optional overlay contract.
// Fail closed: AI-generated candidates are NOT eligible without explicit review.
import {validateSemanticOverlay} from './semantic-overlay-validator.mjs';
export function promoteReviewedCuration(queue, validSceneIds) {
  const errors=[];
  if(queue?.schema_version!=='scene500-curation-review-v1'||!Array.isArray(queue?.scenes))
    return {ok:false,errors:['invalid curation review queue'],overlay:null};
  const seen=new Set(),scenes=[];
  for(const [i,item] of queue.scenes.entries()){
    if(!item||typeof item!=='object'){errors.push('invalid item '+i);continue;}
    const id=item.scene_id;
    if(seen.has(id))errors.push('duplicate scene '+id);
    seen.add(id);
    if(item.review_status!=='independently_approved') {
      errors.push('unapproved scene '+id);
      continue;
    }
    if(typeof item.reviewer_id!=='string'||!item.reviewer_id.trim()||
       typeof item.reviewed_at!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(item.reviewed_at)||
       !Array.isArray(item.review_evidence)||item.review_evidence.length===0){
      errors.push('missing review evidence '+id);continue;
    }
    scenes.push({scene_id:id,expressions:item.expressions});
  }
  if(errors.length)return {ok:false,errors,overlay:null};
  const overlay={schema_version:'scene500-semantic-overlay-v1',scenes};
  const validation=validateSemanticOverlay(overlay,validSceneIds);
  return validation.ok?{ok:true,errors:[],overlay}:{ok:false,errors:validation.errors,overlay:null};
}
