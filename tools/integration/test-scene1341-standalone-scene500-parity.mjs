/* CG-MAIN fixed Scene1341-only Pages preview contract.
 * Prevents mutating original Scene500 entry; locks in previously validated
 * question/answer/voice/handwriting/swipe semantics rather than rewriting.
 */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const gitBlob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0'+s).digest('hex');
const original={
 '../../rebuild-preview/index.html':'4f68df5f88b7baa64a30be643232d22374034055',
 '../../rebuild-preview/welcome.js':'94ac15a3f52ab2a78e228b8a80ba3d7229c5cf44',
 '../../rebuild-preview/home-dashboard.js':'14570b9dec288f139be0fc9e843e3e8683f99a6f',
 '../../rebuild-preview/bootstrap.js':'8d47714dc0433d78eb110502c6481abf0ddf2441'
};
for(const [path,blob] of Object.entries(original))
 assert.equal(gitBlob(read(path)),blob,'Original Scene500 must remain byte-for-byte unchanged: '+path);
const html=read('../../rebuild-preview/scene1341-readonly/index.html');
const welcome=read('../../rebuild-preview/scene1341-readonly/scene1341-welcome.js');
const sourceQa=read('../../rebuild-preview/scene1341-readonly/scene1341-qa-preview-loader.mjs');
const enlex=read('../../rebuild-preview/scene1341-readonly/scene1341-enlex-preview.mjs');
const core=read('../../rebuild-preview/scene1341-search-core.mjs');
assert(welcome.includes('1,341 个真实场景'));
assert(welcome.includes('pai-word-scene1341-welcome-seen-v1'),'Onboarding state must not contaminate Scene500');
assert(html.includes('href="../welcome.css"'),'Reuse Scene500 welcome stylesheet');
assert(html.includes('scene1341-welcome.js'),'Reuse native welcome markup');
assert(html.includes('window.PAI_OPEN_CATALOG_LAZY=()=>(\'$browse\')')===false,'No unexpected catalog bypass');
assert(html.includes("window.PAI_OPEN_CATALOG_LAZY=()=>$('browse').click();"),'Welcome catalog action bound to standalone list');
assert(html.includes("window.dispatchEvent(new Event('pai-home-ready'))"),'Welcome must not get stuck waiting for core app event');
for(const text of ['你现在想学什么？','找场景','浏览场景目录','继续学习','class="home-topbar"','class="scene-search-card"']){
 assert(html.includes(text),'Original Scene500 homepage section missing '+text);
}
assert(!html.includes('切换到 Scene1341 场景'),'Legacy switch must not show in Scene1341');
for(const token of [
 'id="learning"','class="study-top"','class="word-hero"','class="answer"',
 'class="pai-scratch-area"','class="pai-scratch-canvas"',
 'data-grade="again"','data-grade="hard"','data-grade="good"',
 'scene500-native-scratch.js','scene500-readonly-phase.js',
 'scene500-readonly-settings.js','scene1341-auto-preference.js',
 'scene1341-display-bookmark.js','function fitQuestionExpression()',
 'function scheduleQuestionFit()','function moveBatch(delta)',
 'function currentBatchNext','function openStudy(id,resume=false)',
 'phaseController.choose(grade)','phaseController.state().preferredFace',
 'getVisibleLearningUnit','touchstart','touchend','visibilitychange',
 'speechSynthesis','window.render=renderCard'
 ])assert(html.includes(token),'Original Scene500-equivalent learning contract missing: '+token);
for(const grade of ['again','hard','good'])assert(html.includes('data-grade="'+grade+'"'));
assert(html.includes('loadScene1341QAProvisional()'));
assert(html.includes('loadScene1341QAProvisional()'));
assert(html.includes('scene1341-enlex-preview.mjs'));
assert(html.includes('scene1341-rec-bridge.mjs'));
assert(sourceQa.includes("const MANIFEST_SHA='f8967fb97573bbccd89b4c645303dd2c983bb1da'"));
assert(sourceQa.includes('included_cg_pass_no_known_mu_objection!==1778'));
assert(sourceQa.includes('blocked!==260'));
assert(sourceQa.includes('canWriteSrs:false'));
assert(enlex.includes('source_sense_count!==27471'));
assert(enlex.includes('can_write_srs!==false'));
assert.equal(gitBlob(core),'9273661434948d48ecdd36c520f37f2a1da362c1',
 'Search must reuse original current CG-REC source without edits');
const matches=[...html.matchAll(/data-grade="(again|hard|good)"/g)];
assert.deepEqual(matches.map(x=>x[1]),['again','hard','good']);
console.log(JSON.stringify({status:'PASS',originalScene500FilesUnchanged:4,
 fixedScene1341Url:'v22-integration/rebuild-preview/scene1341-readonly/index.html',
 welcomeSameDesign:true,originalHomeLayout:true,
 nativeStudyFace:true,nativeGestureAndHandwriting:true,
 originalCGRECBlob:'9273661434948d48ecdd36c520f37f2a1da362c1',
 qaProvisionalKUs:1778,blockedKUs:260,englishCore20KSenses:27471,
 productionSRSWrites:0,deployed:false}));
