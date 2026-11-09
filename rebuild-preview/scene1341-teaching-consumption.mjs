/* Isolated read-only adapter for CG-ENTEACH answer-only Scene1341 V2.
 * Do not write state.records, Core20K registry or activate study queues.
 * Current question face is simply expression recall; answers use existing UI.
 */
export const SCENE1341_TEACHING_ADAPTER_VERSION='scene1341-answer-only-consumption-v2';
const nonblank=x=>typeof x==='string'&&x.trim().length>0;
export function createScene1341TeachingAdapter(pack){
  if(pack?.schema_version!=='pai-scene1341-answer-only-ku-v2'||
     pack?.identity?.core20k_ku_reused!==false||
     pack?.identity?.srs_namespace!=='scene1341-v2'||
     !Array.isArray(pack.records))throw Error('SCENE1341_ANSWER_ONLY_CONTRACT_INVALID');
  const entries=new Map(),sourceIds=new Set();
  for(const r of pack.records){
    if(!/^SC1341-KU-\d{5,}$/.test(r.scene_ku_id||'')||
       !/^SC50-\d{4}$/.test(r.scene_id||'')||
       !/^SC-SENSE-\d{5,}$/.test(r.source_sense_id||'')||
       r.scene_ku_id!=='SC1341-KU-'+r.source_sense_id.slice('SC-SENSE-'.length)||
       !Number.isInteger(r.source_rank)||r.source_rank<1||
       !nonblank(r.expression)||!nonblank(r.sense_zh)||
       !nonblank(r.source_tier)||!nonblank(r.source_version)||
       !r.answer||!nonblank(r.answer.meaning_zh)||
       !nonblank(r.answer.example_en)||!nonblank(r.answer.example_zh)||
       !Array.isArray(r.answer.collocations)||
       !r.answer.collocations.every(nonblank)||
       (r.answer.usage_note!=null&&!nonblank(r.answer.usage_note))||
       (r.answer.contrast_note!=null&&!nonblank(r.answer.contrast_note))||
       Object.prototype.hasOwnProperty.call(r,'question')||
       r.activation_allowed!==false)throw Error('SCENE1341_ANSWER_ONLY_RECORD_INVALID');
    if(entries.has(r.scene_ku_id)||sourceIds.has(r.source_sense_id))
      throw Error('SCENE1341_ANSWER_ONLY_DUPLICATE_ID');
    entries.set(r.scene_ku_id,r);sourceIds.add(r.source_sense_id);
  }
  const activationAllowed=false; // Isolated author drafts are never promotable here.
  const find=id=>entries.get(id)||null;
  const question=id=>{
    const r=find(id);return r?Object.freeze({sceneKuId:r.scene_ku_id,kind:'self_recall',
      expression:r.expression,automatedScoring:false,hasGeneratedQuestion:false}):null;
  };
  const answer=id=>{
    const r=find(id);if(!r)return null;
    return Object.freeze({sceneKuId:r.scene_ku_id,expression:r.expression,
      meaningZh:r.answer.meaning_zh,exampleEn:r.answer.example_en,
      exampleZh:r.answer.example_zh,collocations:[...r.answer.collocations],
      usageNote:r.answer.usage_note||'',contrastNote:r.answer.contrast_note||''});
  };
  // Existing answerHtml(u) expects m/c/e/x; everything remains read-only.
  const toLegacyAnswerUnit=id=>{
    const r=find(id);if(!r)return null;
    return {k:r.scene_ku_id,w:{w:r.expression,pos:'',ipaUS:'',allSenses:[]},
      s:{ku_id:r.scene_ku_id,m:r.sense_zh,c:r.answer.collocations.join('；'),
        e:[r.answer.example_en],x:[r.answer.usage_note,r.answer.contrast_note].filter(Boolean).join(' '),
        example_zh:r.answer.example_zh,kuType:'scene1341',pos:'',playable:false}};
  };
  return Object.freeze({version:SCENE1341_TEACHING_ADAPTER_VERSION,records:entries.size,
    srsNamespace:'scene1341-v2',core20kKuReused:false,
    activationAllowed,canWriteSrs:false,canCreateStudyQueue:false,
    existingQuestionFaceCompatible:true,currentAnswerPageShapeCompatible:true,
    find,question,answer,toLegacyAnswerUnit});
}
