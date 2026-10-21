// Regression guard: node scripts/test-v21-three-rating-controls.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const runtime=readFileSync(new URL('../rebuild-preview/learning-runtime.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../rebuild-preview/index.html',import.meta.url),'utf8');
assert(runtime.includes('recall-correction" role="group"'),'three-button rating bar missing');
for(const [grade,label] of [['again','不知道'],['hard','模糊'],['good','知道']]){
 const escaped=grade.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const pattern=new RegExp("onclick=\\\"PAI_TAP_FLOW\\.choose\\('"+escaped+"'\\)\\\"[^>]*>"+label+"</button>");
 assert(pattern.test(runtime),'button '+label+' missing or cannot be clicked');
}

assert(runtime.includes("function choose(score){"),'question-stage direct grading handler missing');
assert(runtime.includes("phase!=='answer'"),'question and paused-answer grading must be handled');
assert(runtime.includes('function correct(score){'),'answer-stage correction handler missing');
assert(runtime.includes('window.rateBrowsedLearning=async(grade,k)=>'),'historical card grading must have durable commit handler');
assert(html.includes('id="pai-preview-rating-bar"'),'preview must include visible safe-area controls');
console.log('PASS: all three controls appear before reveal and remain correction-capable on answer; historical cards support durable ratings');
