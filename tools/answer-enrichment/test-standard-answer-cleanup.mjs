// Regression for the one existing PAI Word answer page.
// Run from repository root: node tools/answer-enrichment/test-standard-answer-cleanup.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync('rebuild-preview/learning-runtime.js','utf8');
const start=src.indexOf('  window.answerHtml=function(u){');
const end=src.indexOf('\n  // Settings actions',start);
assert(start>=0&&end>start,'original answer renderer must remain');
const renderer=src.slice(start,end);
for(const forbidden of ['previewHotel','data-test-teaching','测试搭配（未认证）','测试英汉例句（未认证）','测试辨析（未认证）']){
 assert(!renderer.includes(forbidden),'legacy unapproved demo must not render: '+forbidden);
}
for(const required of ['PAI_APPROVED_TEACHING_OVERLAY','data-approved-teaching-ku','data-approved-collocation-ku','data-approved-grammar-ku','data-approved-contrast-ku','data-example-audio','showExamples','showCollocations','showCompare']){
 assert(renderer.includes(required),'original certified rendering/audio/settings must remain: '+required);
}
const window={PAI_APPROVED_TEACHING_OVERLAY:{enabled:false,accepted:new Map()}};
const state={showExamples:true,showCollocations:true,showCompare:true};
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const contrastData=()=>({items:[]});
new Function('window','state','escapeHtml','contrastData',renderer)(window,state,escapeHtml,contrastData);
const unit={w:{w:'hotel',pos:'noun',rank:1100,allSenses:[]},s:{ku_id:'w_0771_hotel_ku01',pos:'noun',m:'酒店',definition:'a place where travelers can stay',e:[],c:'',x:''}};
const plain=window.answerHtml(unit);
assert(plain.includes('酒店'),'retain original runtime meaning');
assert(!plain.includes('book a hotel'),'never inject invented hotel example');
assert(!plain.includes('hotel room'),'never inject invented hotel collocation');
assert(!plain.includes('hostel'),'never inject invented comparison');
window.PAI_APPROVED_TEACHING_OVERLAY={enabled:true,accepted:new Map([[unit.s.ku_id,{gloss_en:'a certified hotel definition',example_en:'This hotel is near the station.',example_zh:'这家酒店靠近车站。',collocation:'stay at a hotel',grammar_note:'Countable noun',contrast_note:'Not a hostel'}]])};
const certified=window.answerHtml(unit);
for(const fragment of ['a certified hotel definition','This hotel is near the station.','这家酒店靠近车站。','stay at a hotel','Countable noun','Not a hostel','data-example-audio']){
 assert(certified.includes(fragment),'certified enrichment must remain: '+fragment);
}
state.showExamples=false;
assert(!window.answerHtml(unit).includes('This hotel is near the station.'),'example setting must work');
state.showExamples=true;state.showCollocations=false;
assert(!window.answerHtml(unit).includes('stay at a hotel'),'collocation setting must work');
state.showCollocations=true;state.showCompare=false;
assert(!window.answerHtml(unit).includes('Not a hostel'),'comparison setting must work');
console.log('PASS standard answer: no uncertified hotel demo, certified overlay and settings preserved');
