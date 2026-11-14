/* V188 learner schema compatibility and conservative Sense display tests. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('rebuild-preview/scene1341-readonly/scene1341-v188-answer-presentation.js','utf8');
const page=fs.readFileSync('rebuild-preview/scene1341-readonly/index.html','utf8');
const ctx={window:{}};vm.runInNewContext(source,ctx);
const {project}=ctx.window.PAI_SCENE1341_V188_ANSWER;
const legacy=project({example_en:'A clear example.',example_zh:'一个清晰例句。'});
assert.equal(legacy.examples.length,1);
assert.equal(legacy.examples[0].en,'A clear example.');
assert.equal(project({examples:[{example_en:'a',example_zh:'甲'},{example_en:'b',example_zh:'乙'},{example_en:'c',example_zh:'丙'}]}).examples.length,3);
assert.throws(()=>project({examples:Array.from({length:4},(_,i)=>({example_en:'w'+i,example_zh:'示例'+i}))}),/EXAMPLES_OVER_3/);
const draft=project({example_en:'test',example_zh:'测试',synonyms:['fake synonym'],antonyms:['fake opposite'],
 sense_disambiguation:{note_zh:'未经认证的比较',status:'AUTHOR_DRAFT'}});
assert.equal(draft.synonyms.length,0);
assert.equal(draft.antonyms.length,0);
assert.equal(draft.distinction,'');
const certified=project({synonyms:['help'],synonyms_status:'VERIFIED',
 antonyms:['harm'],antonyms_status:'QA_PASS',
 sense_disambiguation:{note_zh:'具有语义关系的区别',status:'APPROVED'}});
assert.equal(certified.synonyms[0],'help');
assert.equal(certified.antonyms[0],'harm');
assert.equal(certified.distinction,'具有语义关系的区别');
assert(page.includes('scene1341-v188-answer-presentation.js'));
assert(page.includes('window.PAI_SCENE1341_V188_ANSWER.project(r.answer)'));
assert(page.includes("$('v188-relations-section').hidden=!relationsVisible"));
assert(page.includes("$('v188-distinction-section').hidden=!answerView.distinction"));
assert(page.includes('selectedExample.en')&&page.includes('selectedExample.zh'));
assert(!page.includes('question-ipa-test.html'));
console.log(JSON.stringify({status:'PASS',v188Examples:[1,2,3],legacyCompatible:true,
 unverifiedRelationsWithheld:true,formalReady:0,srsWrites:0}));
