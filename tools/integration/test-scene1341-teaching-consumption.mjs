import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createScene1341TeachingAdapter} from '../../rebuild-preview/scene1341-teaching-consumption.mjs';
import {parseRankedCsv} from '../../rebuild-preview/scene1341-ranked-preview.mjs';

const sourcePath='tools/integration/scene1341-ranked/v51-ranked.csv';
const packPath='tools/integration/scene1341-teaching/enteach-v51-first20-author-draft.json';
const original=fs.readFileSync(sourcePath);
const hash=crypto.createHash('sha1').update('blob '+original.length+'\0').update(original).digest('hex');
assert.equal(hash,'eaa6d729bb04a9bedbafd8e1081a11fc791caa39');
const source=parseRankedCsv(original.toString('utf8'));
const pack=JSON.parse(fs.readFileSync(packPath,'utf8'));
assert.equal(pack.source.git_blob,hash);
assert.equal(pack.records.length,20);
assert.equal(pack.release.activation_allowed,false);
const adapter=createScene1341TeachingAdapter(pack);
assert.equal(adapter.records,20);
assert.equal(adapter.srsNamespace,'scene1341-v1');
assert.equal(adapter.core20kKuReused,false);
assert.equal(adapter.activationAllowed,false);
assert.equal(adapter.canWriteSrs,false);
assert.equal(adapter.canCreateStudyQueue,false);
assert.equal(adapter.currentAnswerPageShapeCompatible,true);
assert.equal(adapter.currentQuestionPageSingleChoiceCompatible,false);
const rows=new Map(source.map(r=>[r.sense_id,r]));
for(const r of pack.records){
 const original=rows.get(r.source_sense_id);
 assert(original,'missing original '+r.source_sense_id);
 for(const [key,a,b] of [
 ['scene',r.scene_id,original.scene_id],
 ['expression',r.expression,original.expression],
 ['zh',r.sense_zh,original.sense_zh],
 ['rank',String(r.source_rank),original.rank],
 ['tier',r.source_tier,original.tier]])assert.equal(a,b,'source drift '+r.scene_ku_id+' '+key);
 assert.equal(r.scene_ku_id,'SC1341-KU-'+r.source_sense_id.slice('SC-SENSE-'.length));
 const q=adapter.question(r.scene_ku_id),a=adapter.answer(r.scene_ku_id),legacy=adapter.toLegacyAnswerUnit(r.scene_ku_id);
 assert.equal(q.choices.length,4);
 assert.equal(q.releaseEligible,false);
 assert.equal(q.choices.find(x=>x.id===q.correctChoiceId).text,r.expression);
 assert(a.exampleEn&&a.exampleZh&&a.explanationZh);
 assert.equal(legacy.s.playable,false);
 assert.equal(legacy.s.m,r.sense_zh);
 assert.equal(legacy.s.c,r.answer.collocations.join('；'));
 assert.equal(legacy.s.e[0],r.answer.example_en);
 assert.equal(legacy.s.x,r.answer.explanation_zh);
}
assert.equal(adapter.question('CORE20K-KU-00001'),null);
assert.equal(adapter.answer('SC1341-KU-99999'),null);
const unsafe={...pack,release:{...pack.release,activation_allowed:true,production_ready:true}};
assert.equal(createScene1341TeachingAdapter(unsafe).activationAllowed,false,'unaudited KU must remain blocked');
const legacyRuntime=fs.readFileSync('rebuild-preview/learning-runtime.js','utf8');
for(const required of ['window.answerHtml=function(u)','u.s.m','u.s.c','u.s.e','u.s.x'])
 assert(legacyRuntime.includes(required),'answer renderer missing '+required);
assert(legacyRuntime.includes("class=\"learning-screen"),'original learning shell missing');
console.log(JSON.stringify({status:'PASS',sourceRows:2038,authorDraftKu:20,
 sceneIds:1,first20SourceIdentityVerified:true,legacyAnswerAdapter:true,
 nativeSingleChoiceQuestionUI:false,independentQaPass:0,playable:0,srsWrites:false}));
