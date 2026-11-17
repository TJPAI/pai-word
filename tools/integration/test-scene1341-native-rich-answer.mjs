import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const path='rebuild-preview/scene1341-readonly/';
const code=readFileSync(path+'scene1341-native-answer-rich.js','utf8');
new Script(code);
const root={};
runInNewContext(code,{window:root});
const api=root.PAI_SCENE1341_NATIVE_ANSWER_RICH;
assert.ok(api&&typeof api.project==='function'&&typeof api.append==='function');

const answer={
 meaning_zh:'醒来',pos:'verb',gloss_en:'To stop sleeping.',
 example_en:'I wake up early.',example_zh:'我起得早。',
 examples:[
  {example_en:'I wake up early.',example_zh:'我起得早。'},
  {example_en:'She woke up late.',example_zh:'她起晚了。'}
 ],
 synonyms:['awake'],synonyms_status:'UNVERIFIED',
 antonyms:['sleep'],antonyms_status:'VERIFIED',
 sense_disambiguation:{status:'VERIFIED',note_zh:'wake up 更常用于口语'}
};
const vetted={examples:[{en:'I wake up early.',zh:'我起得早.'},
 {en:'She woke up late.',zh:'她起晚了。'}],
 synonyms:[],antonyms:['sleep'],distinction:'wake up 更常用于口语'};
const view=api.project(answer,{},vetted);
assert.equal(view.gloss,'To stop sleeping.');
assert.equal(view.examples.length,2);
assert.equal(view.examples[1].en,'She woke up late.');
assert.equal(view.synonyms.length,0,'unreviewed synonym candidate must not appear');
assert.equal(view.antonyms.length,1);
assert.equal(view.distinction,'wake up 更常用于口语');
assert.equal(view.srsEligible,false);assert.equal(view.readOnly,true);
assert.equal(api.project(answer,{showEnglishDefinition:false,showExamples:false,
 showRelations:false,showCompare:false},vetted).gloss,'');
assert.equal(api.project(answer,{showEnglishDefinition:false,showExamples:false,
 showRelations:false,showCompare:false},vetted).examples.length,0);
assert.equal(api.project(answer,{showExampleTranslations:false},vetted).examples[0].zh,'');
const fakeDoc={createElement(name){
 return {name,className:'',dataset:{},children:[],textContent:'',type:null,
  classList:{add(){}},setAttribute(k,v){this[k]=v},append(...nodes){this.children.push(...nodes)}};
}};
const slot={ownerDocument:fakeDoc,children:[],append(node){this.children.push(node)}};
api.append(slot,view);
assert.equal(slot.children.length,4,'gloss + bilingual examples + vetted relations + contrast');
const examples=slot.children.find(x=>x.dataset.masterEnrichment==='examples');
assert.equal(examples.children.length,3,'section heading and both example rows');
assert.equal(examples.children[2].children[2].dataset.exampleAudio,'She woke up late.');
assert.throws(()=>api.append(slot,{...view,srsEligible:true}),/NOT_QUARANTINED/);
const html=readFileSync(path+'index.html','utf8');
assert.match(html,/function preferScene500Answer\(\)/);
assert.match(html,/get\('nativeAnswer'\)!=='0'/);
assert.match(html,/const nativePilot=preferScene500Answer\(\)/);
assert.match(html,/scene1341-native-answer-rich\.js/);
assert.match(html,/PAI_SCENE1341_NATIVE_ANSWER_RICH\.project\(r\.answer,prefs,answerView\)/);
assert.match(html,/PAI_SCENE1341_NATIVE_ANSWER_RICH\.append\(nativeSlot,rich\)/);
assert.match(html,/if\(!allowable\.some\(e=>e\.en===button\.dataset\.speak\)\)return;/);
assert.match(html,/playExampleSentence\(button\.dataset\.speak\)/);
console.log('PASS: Scene500 native answer + rich Master fields, multi-example speech, QA filter and SRS0');
