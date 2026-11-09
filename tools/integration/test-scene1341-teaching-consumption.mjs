import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createScene1341TeachingAdapter} from '../../rebuild-preview/scene1341-teaching-consumption.mjs';
import {parseRankedCsv} from '../../rebuild-preview/scene1341-ranked-preview.mjs';

const sourcePath='tools/integration/scene1341-ranked/v51-ranked.csv';
const packPath='tools/integration/scene1341-teaching/enteach-v51-first20-answer-only-v2.json';
const original=fs.readFileSync(sourcePath);
const sha=crypto.createHash('sha1').update('blob '+original.length+'\0').update(original).digest('hex');
assert.equal(sha,'eaa6d729bb04a9bedbafd8e1081a11fc791caa39');
const source=parseRankedCsv(original.toString('utf8'));
const pack=JSON.parse(fs.readFileSync(packPath,'utf8'));
assert.equal(pack.source.git_blob_sha,sha);
assert.equal(pack.records.length,20);
assert.equal(pack.release_status,'EDITORIAL_STAGING_ONLY');
const adapter=createScene1341TeachingAdapter(pack);
assert.equal(adapter.records,20);
assert.equal(adapter.srsNamespace,'scene1341-v2');
assert.equal(adapter.core20kKuReused,false);
assert.equal(adapter.activationAllowed,false);
assert.equal(adapter.canWriteSrs,false);
assert.equal(adapter.canCreateStudyQueue,false);
assert.equal(adapter.existingQuestionFaceCompatible,true);
assert.equal(adapter.currentAnswerPageShapeCompatible,true);
const bySense=new Map(source.map(r=>[r.sense_id,r]));
for(const r of pack.records){
 const src=bySense.get(r.source_sense_id);
 assert(src,'missing source '+r.source_sense_id);
 for(const [name,a,b] of [
  ['scene',r.scene_id,src.scene_id],['expression',r.expression,src.expression],
  ['zh',r.sense_zh,src.sense_zh],['rank',String(r.source_rank),src.rank],
  ['tier',r.source_tier,src.tier],['version',r.source_version,'V51']
 ])assert.equal(a,b,'source drift '+r.scene_ku_id+' '+name);
 assert(!Object.hasOwn(r,'question'),'answer-only pack must not generate a question');
 const q=adapter.question(r.scene_ku_id),a=adapter.answer(r.scene_ku_id);
 const legacy=adapter.toLegacyAnswerUnit(r.scene_ku_id);
 assert.equal(q.kind,'self_recall');
 assert.equal(q.automatedScoring,false);
 assert.equal(q.expression,src.expression);
 assert(a.exampleEn&&a.exampleZh&&a.meaningZh);
 assert.equal(a.meaningZh,r.sense_zh);
 assert.equal(legacy.s.playable,false);
 assert.equal(legacy.s.ku_id,r.scene_ku_id);
 assert.equal(legacy.s.m,r.sense_zh);
 assert.equal(legacy.s.e[0],r.answer.example_en);
 assert.equal(legacy.s.example_zh,r.answer.example_zh);
}
assert.equal(adapter.question('CORE20K-KU-00001'),null);
assert.equal(adapter.answer('SC1341-KU-99999'),null);
const withFakeQuestion={...pack,records:[{...pack.records[0],question:{type:'single_choice'}}]};
assert.throws(()=>createScene1341TeachingAdapter(withFakeQuestion),/SCENE1341_ANSWER_ONLY_RECORD_INVALID/);
const withApprovalFlags={...pack,release:{production_ready:true,activation_allowed:true}};
assert.equal(createScene1341TeachingAdapter(withApprovalFlags).activationAllowed,false,'draft must not activate');
const legacyRuntime=fs.readFileSync('rebuild-preview/learning-runtime.js','utf8');
for(const token of ['window.answerHtml=function(u)','u.s.m','u.s.c','u.s.e','u.s.x','study-screen learning-screen'])
 assert(legacyRuntime.includes(token),'legacy answer/learning UI missing '+token);
console.log(JSON.stringify({status:'PASS',sourceRows:source.length,
 answerOnlyDrafts:pack.records.length,questionFields:0,
 playbackApproved:0,SRSWrites:false,legacyAnswerMapping:true,
 questionMode:'self_recall',srsNamespace:adapter.srsNamespace}));
