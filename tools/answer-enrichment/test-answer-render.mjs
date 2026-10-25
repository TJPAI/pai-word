// Run: node tools/answer-enrichment/test-answer-render.mjs
// Isolated rendering contract tests: no DOM, no network, no learning-state writes.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../../rebuild-preview/learning-runtime.js',import.meta.url),'utf8');
const start=source.indexOf('  window.answerHtml=function(u){');
const end=source.indexOf('\n  // Settings actions',start);
assert(start>=0&&end>start,'answer renderer boundaries');
const renderer=source.slice(start,end);
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={showCollocations:true,showExamples:true,showCompare:true};
const window={PAI_APPROVED_TEACHING_OVERLAY:null};
const contrastData=()=>({items:[]});
new Function('window','state','escapeHtml','contrastData',renderer)(window,state,escapeHtml,contrastData);
const unit={s:{ku_id:'KU-1',m:'原有释义',pos:'n.',c:'常用搭配',e:['原有例句'],x:'注意事项'},w:{w:'word',pos:'n.',allSenses:[]}};
const original=window.answerHtml(unit);
assert(original.includes('原有释义')&&original.includes('常用搭配')&&original.includes('原有例句'));
assert(!original.includes('英文释义')&&!original.includes('认证教学例句'));
// Core20K runtime carries an English definition even without an approved overlay.
const runtimeUnit={...unit,s:{...unit.s,definition:'a brief account of the main points'}};
const runtimeHtml=window.answerHtml(runtimeUnit);
assert(runtimeHtml.includes('英文释义')&&runtimeHtml.includes('a brief account of the main points'));
assert(!runtimeHtml.includes('认证教学例句'));

window.PAI_APPROVED_TEACHING_OVERLAY={enabled:true,accepted:null};
assert.equal(window.answerHtml(unit),original,'malformed overlay must fail closed');
window.PAI_APPROVED_TEACHING_OVERLAY={enabled:false,accepted:new Map([['KU-1',{gloss_en:'disabled'}]])};
assert.equal(window.answerHtml(unit),original,'disabled overlay must not display');
window.PAI_APPROVED_TEACHING_OVERLAY={enabled:true,accepted:new Map([['KU-1',{gloss_en:'English meaning',example_en:'An example.',example_zh:'例句翻译',collocation:'a phrase',grammar_note:'grammar note',contrast_note:'contrast note'}]])};
const enhanced=window.answerHtml(unit);
for(const token of ['English meaning','An example.','例句翻译','a phrase','grammar note','contrast note','原有释义'])assert(enhanced.includes(token),token);
state.showExamples=false;state.showCollocations=false;state.showCompare=false;
const hidden=window.answerHtml(unit);
for(const token of ['An example.','a phrase','contrast note'])assert(!hidden.includes(token),'toggle: '+token);
assert(hidden.includes('English meaning')&&hidden.includes('grammar note'));
state.showExamples=true;state.showCollocations=true;state.showCompare=true;
window.PAI_APPROVED_TEACHING_OVERLAY.accepted.set('KU-1',{gloss_en:'<script>alert(1)</script>',example_en:'<img src=x onerror=1>',example_zh:'安全'});
const escaped=window.answerHtml(unit);
assert(!escaped.includes('<script>')&&!escaped.includes('<img src=x'));
assert(escaped.includes('&lt;script&gt;')&&escaped.includes('&lt;img'));
assert(!('records' in state),'renderer must not write SRS records');
console.log('PASS: base rendering, Core20K runtime English definition, disabled/malformed overlay, approved content, toggles, HTML escaping');
