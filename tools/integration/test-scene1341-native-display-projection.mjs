import assert from 'node:assert/strict';
import {projectScene1341AnswerOnlyUnit,createScene1341ReadOnlyDisplayProjection}
 from '../../rebuild-preview/scene1341-native-display-projection.mjs';
import {assertScene1341NativeAnswerHtml,renderWithRealScene500AnswerHtml} from './scene1341-native-answer-renderer-harness.mjs';
const record={
 scene_ku_id:'SC1341-KU-00001',scene_id:'SC50-0001',source_sense_id:'SC-SENSE-00001',
 source_rank:1,expression:'wake up',sense_zh:'醒来',source_pack_path:'source.json',
 source_pack_blob:'a'.repeat(40),cg_qa:'PASS',muse_qa:'DEFERRED_QUOTA_20261113',
 muse_recheck_required:true,release_status:'PROVISIONAL_PENDING_MUSE',
 source_master_authorization_verified:false,author_draft:true,production_release_allowed:false,
 answer:{meaning_zh:'醒来',example_en:'I woke up early.',example_zh:'我很早就醒来了。',
  collocations:['wake up early','wake up late'],usage_note:'强调醒来。',contrast_note:'不同于get up。'},
 display:{w:'wake up',m:'醒来',c:'wake up early · wake up late',
  e:'I woke up early.',x:'强调醒来。 不同于get up。',example_zh:'我很早就醒来了。'}
};
const unit=projectScene1341AnswerOnlyUnit(record);
const nativeHtml=assertScene1341NativeAnswerHtml(unit);
assert(nativeHtml.includes('wake up early · wake up late'));
assert(nativeHtml.includes('我很早就醒来了。'));
assert(nativeHtml.includes('data-example-audio'));
const noExamples=renderWithRealScene500AnswerHtml(unit,{showExamples:false});
assert(!noExamples.includes('scene1341-example-translation'));
assert(!noExamples.includes('data-example-audio'));
const noCollocations=renderWithRealScene500AnswerHtml(unit,{showCollocations:false});
assert(!noCollocations.includes('class="collocations"'));
const noCompare=renderWithRealScene500AnswerHtml(unit,{showCompare:false});
assert(noCompare.includes('class="definition"'));
const evil=structuredClone(record);
evil.answer.meaning_zh='想<注入> & 测试';
evil.sense_zh=evil.answer.meaning_zh;
evil.display.m=evil.answer.meaning_zh;
const safeHtml=renderWithRealScene500AnswerHtml(projectScene1341AnswerOnlyUnit(evil));
assert(safeHtml.includes('想&lt;注入&gt; &amp; 测试'));
assert(!safeHtml.includes('想<注入>'));
const featureOptions=[
 {showExamples:true,showCollocations:true,showCompare:true},
 {showExamples:false,showCollocations:true,showCompare:true},
 {showExamples:true,showCollocations:false,showCompare:true},
 {showExamples:true,showCollocations:true,showCompare:false}
];
for(const options of featureOptions){
 const rendered=renderWithRealScene500AnswerHtml(unit,options);
 assert(rendered.includes('class="answer density-'));
 assert.equal(rendered.includes('scene1341-example-translation'),options.showExamples);
 assert.equal(rendered.includes('data-example-audio'),options.showExamples);
 assert.equal(rendered.includes('class="collocations"'),options.showCollocations);
}


assert.equal(unit.k,'SC1341-KU-00001');
assert.equal(unit.w.w,'wake up');
assert.equal(unit.s.m,'醒来');
assert.deepEqual(unit.s.e,['I woke up early.']);
assert.equal(unit.s.example_zh,'我很早就醒来了。');
assert.equal(unit.s.playable,false);
assert.equal(unit.readOnly,true);
assert.equal(unit.canWriteSrs,false);
assert.equal(unit.productionReleaseAllowed,false);
assert.equal(unit.sourceIdentityExternallyVerified,false,'Projection itself is not source verification');
assert(Object.isFrozen(unit)&&Object.isFrozen(unit.w)&&Object.isFrozen(unit.s)&&Object.isFrozen(unit.s.e));
const all=createScene1341ReadOnlyDisplayProjection([record]);
assert.equal(all.count,1);
assert.equal(all.getScene('SC50-0001').length,1);
assert.deepEqual(all.nativePlayableUnits,[]);
assert.equal(all.canCreateStudyQueue,false);
assert.equal(all.canWriteSrs,false);
assert.throws(()=>createScene1341ReadOnlyDisplayProjection([record,record]),/DUPLICATE_KU/);
assert.throws(()=>createScene1341ReadOnlyDisplayProjection([record,{...record,scene_ku_id:'SC1341-KU-00002'}]),/DUPLICATE_SCENE_RANK/);
assert.throws(()=>projectScene1341AnswerOnlyUnit({...record,scene_ku_id:'SC1341-KU-00365'}),/QA_V2_DUPLICATE_KU_HOLD/);
assert.throws(()=>projectScene1341AnswerOnlyUnit({...record,display:{...record.display,e:'different'}}),/DISPLAY_SOURCE_MISMATCH/);
assert.throws(()=>projectScene1341AnswerOnlyUnit({...record,display:{...record.display,c:'fake collocations'}}),/COLLOCATION_DISPLAY_CONFLICT/);
assert.throws(()=>projectScene1341AnswerOnlyUnit({...record,display:{...record.display,x:'made up note'}}),/USAGE_DISPLAY_CONFLICT/);
assert.throws(()=>projectScene1341AnswerOnlyUnit({...record,source_master_authorization_verified:true}),/NOT_ELIGIBLE/);
assert.throws(()=>projectScene1341AnswerOnlyUnit({...record,question:'unapproved question'}),/INVALID_ANSWER_ONLY/);
assert.equal(Object.prototype.hasOwnProperty.call(unit,'playable'),false);
console.log(JSON.stringify({status:'PASS',unit:'Scene500-answerHtml-compatible',safeReadOnly:true,srsWrites:0,sourceVerifiedByProjection:false}));
