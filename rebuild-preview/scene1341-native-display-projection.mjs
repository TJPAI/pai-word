/* Scene1341 V2 QA candidate -> native Scene500 answerHtml(u) shape.
 * DISPLAY-ONLY ADAPTER. Never insert projected units into PAI_CORE.byKU,
 * PAI_START_POLICY_SESSION, legacy SRS, or a native learning queue.
 * Caller must separately pin source Git blobs before trusting its data.
 */
import {inspectScene1341ProvisionalRecord} from './scene1341-provisional-intake.mjs';
const KU=/^SC1341-KU-\d{5,}$/;
const SCENE=/^SC50-\d{4}$/;
const freeze=o=>Object.freeze(o);
const rejected=(reason)=>{throw Error('SC1341_NATIVE_DISPLAY_REJECTED_'+reason)};

/** Maps precisely one previously source-fetched V2 candidate to read-only native answer shape. */
export function projectScene1341AnswerOnlyUnit(record){
  const gate=inspectScene1341ProvisionalRecord(record);
  if(!gate.accepted||gate.stagingEligible)rejected(gate.reason);
  if(!KU.test(record.scene_ku_id)||!SCENE.test(record.scene_id))rejected('BAD_ID');
  if(typeof record.sense_zh!=='string'||!record.sense_zh.trim()||
     record.sense_zh!==record.answer.meaning_zh)rejected('SENSE_GLOSS_CONFLICT');
  if(typeof record.display.c!=='string'||typeof record.display.x!=='string'||
     !record.answer.collocations.every(x=>typeof x==='string'&&x.trim()))
    rejected('BAD_DISPLAY_FIELDS');
  const display=record.display;
  const expectedCollocations=record.answer.collocations.join(' · ');
  if(display.c!==expectedCollocations)rejected('COLLOCATION_DISPLAY_CONFLICT');
  const expectedNotes=[record.answer.usage_note,record.answer.contrast_note]
    .filter(x=>typeof x==='string'&&x.trim()).join(' ');
  if(display.x!==expectedNotes)rejected('USAGE_DISPLAY_CONFLICT');
  const word=freeze({w:display.w,pos:'',ipa:'',ipaUS:'',allSenses:[],loaded:true});
  const sense=freeze({
    ku_id:record.scene_ku_id,scene:record.scene_id,kuType:'scene1341',
    m:display.m,c:display.c,e:freeze([display.e]),x:display.x,
    example_zh:display.example_zh,pos:'',playable:false,requiresHydration:false
  });
  // Preserve existing answerHtml's exact u.w/u.s access pattern, but prevent
  // native registry identification as released study material.
  return freeze({
    k:record.scene_ku_id,w:word,s:sense,
    sourceSenseId:record.source_sense_id,sourceRank:record.source_rank,
    sourcePackBlob:record.source_pack_blob,
    projectionMode:'QUARANTINED_DISPLAY_ONLY',
    sourceIdentityExternallyVerified:false,
    authorDraft:true,readOnly:true,
    canCreateStudyQueue:false,canWriteSrs:false,productionReleaseAllowed:false
  });
}

export function createScene1341ReadOnlyDisplayProjection(records){
  if(!Array.isArray(records))throw Error('SC1341_NATIVE_DISPLAY_RECORD_ARRAY_REQUIRED');
  const seen=new Set(),scenes=new Map(),units=[];
  for(const r of records){
    const u=projectScene1341AnswerOnlyUnit(r);
    if(seen.has(u.k))rejected('DUPLICATE_KU');
    seen.add(u.k);
    const rankKey=u.s.scene+':'+u.sourceRank;
    if(scenes.get(rankKey))rejected('DUPLICATE_SCENE_RANK');
    scenes.set(rankKey,true);
    units.push(u);
  }
  return freeze({
    namespace:'scene1341-v2',
    count:units.length,
    units:freeze(units),
    getScene:(sceneId)=>freeze(units.filter(u=>u.s.scene===sceneId)),
    nativePlayableUnits:freeze([]),
    readOnly:true,canCreateStudyQueue:false,canWriteSrs:false,
    productionReleaseAllowed:false
  });
}
