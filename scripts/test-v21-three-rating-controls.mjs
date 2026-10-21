// Regression guard: node scripts/test-v21-three-rating-controls.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const runtime=readFileSync(new URL('../rebuild-preview/learning-runtime.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../rebuild-preview/index.html',import.meta.url),'utf8');
assert(runtime.includes('${!browsedUnit?`<div class="recall-correction"'),'three-button bar must appear even before answer reveal');
for(const [grade,label] of [['again','不知道'],['hard','模糊'],['good','知道']]){
 assert(runtime.includes("PAI_TAP_FLOW.choose('"+grade+"')>"+label+"</button>"),'button '+label+' missing');
}
assert(runtime.includes("function choose(score){"),'question-stage direct grading handler missing');
assert(runtime.includes("if(phase==='question'){"),'question stage must be handled');
assert(runtime.includes("correct(score);"),'answer-stage correction handler missing');
assert(runtime.includes('window.rateBrowsedLearning=()=>{}'),'historical cards must remain read-only');
assert(html.includes('id="pai-preview-rating-bar"'),'preview must include visible safe-area controls');
console.log('PASS: all three controls appear before reveal and remain correction-capable on answer; historic cards read-only');
