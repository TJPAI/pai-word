/* CG-MAIN isolated read-only adapter for CG-ENTEACH Scene1341 drafts.
 * No import to PAI_CORE.byKU, no write to state.records, no SRS activation.
 * Existing learning-runtime answerHtml consumes u.w.w and u.s.{m,c,e,x};
 * the current question face does NOT render single-choice stems/options.
 */
export const SCENE1341_TEACHING_ADAPTER_VERSION='scene1341-teaching-consumption-v1';
export function createScene1341TeachingAdapter(pack){
  if(pack?.schema_version!=='pai-scene1341-new-ku-teaching-v1'||
     pack?.release?.core20k_ku_reused!==false||
     pack?.release?.srs_namespace!=='scene1341-v1'||
     !Array.isArray(pack.records))throw Error('SCENE1341_TEACHING_CONTRACT_INVALID');
  const entries=new Map();
  for(const record of pack.records){
    if(record.schema_version!=='scene1341-scene-ku-v1'||
       !/^SC1341-KU-\d{5,}$/.test(record.scene_ku_id)||
       !/^SC50-\d{4}$/.test(record.scene_id)||
       !String(record.expression||'').trim()||
       !String(record.sense_zh||'').trim()||
       !String(record.question?.stem||'').trim()||
       !String(record.answer?.example_en||'').trim()||
       !String(record.answer?.explanation_zh||'').trim())
      throw Error('SCENE1341_TEACHING_RECORD_INVALID');
    if(entries.has(record.scene_ku_id))throw Error('SCENE1341_TEACHING_DUPLICATE_KU');
    if(record.question.type!=='single_choice')throw Error('SCENE1341_TEACHING_QUESTION_TYPE_UNSUPPORTED');
    const choices=record.question.choices;
    if(!Array.isArray(choices)||choices.length!==4||
       new Set(choices.map(x=>x.id)).size!==4||
       !choices.some(x=>x.id===record.question.correct_choice_id&&x.text===record.question.correct_answer))
      throw Error('SCENE1341_TEACHING_ANSWER_MISMATCH');
    entries.set(record.scene_ku_id,record);
  }
  const allReleased=pack.release.production_ready===true&&pack.release.activation_allowed===true;
  const qaComplete=entries.size>0&&[...entries.values()].every(r=>
    r.qa?.independent_semantic_verified===true&&r.production_ready===true&&r.activation_allowed===true);
  const activationAllowed=allReleased&&qaComplete;
  const find=id=>entries.get(id)||null;
  const question=id=>{
    const r=find(id);if(!r)return null;
    return Object.freeze({sceneKuId:r.scene_ku_id,sceneId:r.scene_id,sourceSenseId:r.source_sense_id,
      sourceRank:r.source_rank,kind:r.question.type,prompt:r.question.stem,
      choices:r.question.choices.map(c=>({id:c.id,text:c.text})),
      correctChoiceId:r.question.correct_choice_id,
      scoring:r.question.scoring,releaseEligible:activationAllowed});
  };
  const answer=id=>{
    const r=find(id);if(!r)return null;
    return Object.freeze({sceneKuId:r.scene_ku_id,expression:r.answer.expression,
      meaningZh:r.answer.meaning_zh,exampleEn:r.answer.example_en,
      exampleZh:r.answer.example_zh,collocations:[...r.answer.collocations],
      explanationZh:r.answer.explanation_zh});
  };
  // The original answer renderer accepts this shape, but the question renderer
  // requires a new content slot for stem and answer choices before release.
  const toLegacyAnswerUnit=id=>{
    const r=find(id);if(!r)return null;
    return {k:r.scene_ku_id,w:{w:r.expression,pos:'',ipaUS:'',allSenses:[]},
      s:{ku_id:r.scene_ku_id,m:r.sense_zh,c:r.answer.collocations.join('；'),
        e:[r.answer.example_en],x:r.answer.explanation_zh,kuType:'scene1341',
        pos:'',playable:false}};
  };
  return Object.freeze({version:SCENE1341_TEACHING_ADAPTER_VERSION,records:entries.size,
    srsNamespace:'scene1341-v1',core20kKuReused:false,
    activationAllowed,canWriteSrs:false,canCreateStudyQueue:false,
    currentAnswerPageShapeCompatible:true,currentQuestionPageSingleChoiceCompatible:false,
    find,question,answer,toLegacyAnswerUnit});
}
