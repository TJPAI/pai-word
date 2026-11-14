/* CG-MAIN V163: execute real learner formatter and shared question/answer IPA renderer. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('rebuild-preview/scene1341-readonly/index.html','utf8');
const source=fs.readFileSync('rebuild-preview/scene1341-readonly/scene1341-v163-ipa-learner-display.js','utf8');
assert(html.includes('<script src="./scene1341-v163-ipa-learner-display.js"></script>'));
const context={window:{}};
vm.runInNewContext(source,context);
const format=context.window.PAI_SCENE1341_V163_IPA_DISPLAY.displayEnglishIPA;
const cases=[
 ['/ˈfɹʌstɹeɪtɪd/','/ˈfrʌstreɪtɪd/'],
 ['/ˌoʊvɚˈweɪt/','/ˌoʊvɚˈweɪt/'],
 ['/ɝ/','/ɝ/'],
 ['/ɹɚɝ/','/rɚɝ/'],
 ['[ɹɛd]','[rɛd]'],
 ['/-ˈmiɚ/','/-ˈmiɚ/'],
 ['音标待补','音标待补'],
 ['/ɹ/（测试音标·未认证）','/ɹ/（测试音标·未认证）'],
 ['/ɹ/ /ɹ/','/ɹ/ /ɹ/'],
 ['/ɹ]','/ɹ]'],
 ['[ɹ/','[ɹ/'],
 ['  /ɹeɪn/  ','/reɪn/']
];
for(const [original,expected] of cases)assert.equal(format(original),expected,original);
assert.equal(format('/ɹ/',{language:'zh'}),'/ɹ/','non-English data must remain unchanged');
assert.equal(format('/ɹ/',{language:'en-US'}),'/r/');
assert.equal(context.window.PAI_SCENE1341_V163_IPA_DISPLAY.policy,'EN_IPA_APPROXIMANT_R_TO_LEARNER_R_DISPLAY_ONLY_V163');
// Test the actual shared scene1341 question/answer page formatter, not a duplicate rendering policy.
const inline=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(inline);
const begin=inline.indexOf('function renderQuestionIPA(card){');
const end=inline.indexOf('\nfunction renderCard(){',begin);
assert(begin>=0&&end>begin);
const el={textContent:'',title:'',dataset:{}};
let current=null;
const renderContext={
 window:context.window,
 $:id=>{assert.equal(id,'ipa');return el},
 subset:()=>[current],
 index:0,
 ipaSequence:0
};
vm.runInNewContext(inline.slice(begin,end)+'\nthis.renderQuestionIPA=renderQuestionIPA;',renderContext);
function render(question){
 current={scene_ku_id:'SC1341-TEST-UNIT',expression:'red',question};
 const before=JSON.stringify(question);
 renderContext.renderQuestionIPA(current);
 assert.equal(JSON.stringify(question),before,'formatter must not mutate Master source JSON');
 return {text:el.textContent,status:el.dataset.ipaStatus};
}
const archive={source_type:'CGMASTER_LOCAL_KAIKKI_ARCHIVE_TEST',sense_match_approved:false,qa_approved:false};
let result=render({ipa:'/ɹɛd/',ipa_status:'FULL_LOCAL_KAIKKI_SINGLE_PHONEMIC_TEST_ONLY',ipa_provisional:true,ipa_source:archive});
assert.equal(result.text,'/rɛd/（本地Kaikki·测试未认证）');
assert.equal(result.status,'local-kaikki-provisional-test');
// The same native hero IPA line is used on both preferred QUESTION and ANSWER screens.
assert(inline.includes('renderQuestionIPA(r);'));
result=render({ipa:'/ɹɛd/',ipa_status:'HOLD_MULTI_IPA',ipa_candidates_pending:['/ɹɛd/']});
assert.equal(result.text,'音标待补');
assert.equal(result.status,'missing','HOLD may not be promoted by display formatter');
result=render({ipa:'/ɹɛd/',ipa_status:'NATIVE_KAIKKI_SINGLE_PHONEMIC_VARIANT_PROVISIONAL',ipa_provisional:true,ipa_source:{source_sha256:'test-sha'}});
assert.equal(result.text,'/rɛd/（测试音标·未认证）');
assert.equal(result.status,'provisional-master-test');
console.log(JSON.stringify({status:'PASS',formatterCases:cases.length,renderCases:3,mutations:0,approvedIPA:0,srsWrites:0}));
