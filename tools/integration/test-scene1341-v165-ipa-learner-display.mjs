/* CG-MAIN V165: execute real learner formatter and shared question/answer IPA renderer. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('rebuild-preview/scene1341-readonly/index.html','utf8');
const source=fs.readFileSync('rebuild-preview/scene1341-readonly/scene1341-v165-ipa-learner-display.js','utf8');
assert(html.includes('<script src="./scene1341-v165-ipa-learner-display.js"></script>'));
const context={window:{}};
vm.runInNewContext(source,context);
const format=context.window.PAI_SCENE1341_V165_IPA_DISPLAY.displayEnglishIPA;
const cases=[
 ['/ˈfɹʌstɹeɪtɪd/','/ˈfrʌstreɪtɪd/'],
 ['/ˌoʊvɚˈweɪt/','/ˌoʊvɚˈweɪt/'],
 ['/ɝ/','/ɝ/'],
 ['/ɹɚɝ/','/rɚɝ/'],
 ['/ˈɡɹiːn/','/ˈgriːn/'],
 ['/t͡ʃɪld/','/tʃɪld/'],
 ['/d͡ʒʌd͡ʒ/','/dʒʌdʒ/'],
 ['/ˌt͡ʃɹeɪnd͡ʒ/','/ˌtʃreɪndʒ/'],
 ['[t͡ʃɡɹ]','[tʃgr]'],
 ['/ɡ̊/','/g̊/'],
 ['/t͜ʃ/','/t͜ʃ/'],
 ['/p͡f/','/p͡f/'],
 ['/ʀɾɫʰʔ/','/ʀɾɫʰʔ/'],
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
assert.equal(format('/ɹɡt͡ʃd͡ʒ/',{language:'zh'}),'/ɹɡt͡ʃd͡ʒ/','non-English data must remain unchanged');
assert.equal(format('/ɹɡt͡ʃd͡ʒ/',{language:'en-US'}),'/rgtʃdʒ/');
assert.equal(context.window.PAI_SCENE1341_V165_IPA_DISPLAY.policy,'EN_IPA_LEARNER_NOTATION_DISPLAY_ONLY_V165');
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
function render(question,cardExtras={}){
 current={scene_ku_id:'SC1341-TEST-UNIT',expression:'red',question,...cardExtras};
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
assert.equal(result.text,'音标待核验');
assert.equal(result.status,'pending-ipa-adjudication','HOLD may not be promoted by display formatter');
// Real Kaikki Phase1 source-bound single IPA is displayed as unreviewed TEST.
const phase1Id='SC1341-FINAL-SRC-'+'a'.repeat(32);
result=render({ipa:'/ɹɛd/',ipa_status:'PHASE1_KAIKKI_NATIVE_SINGLE_UNREVIEWED',
 ipa_source:{record_id:phase1Id}}, {master_phase1_source:'KAIKKI_FRESH_EDITOR_TEST',
 master_record_id:phase1Id});
assert.equal(result.text,'/rɛd/','review stage must be a separate plain-text marker adjacent to IPA');
assert.equal(result.status,'phase1-kaikki-unreviewed');
// Even if the old learning-card IPA has a value, an unknown Phase1 source
// must HOLD rather than borrow a potentially wrong Sense/pronunciation.
result=render({ipa:'/ɹɛd/',ipa_status:'PHASE1_KAIKKI_IPA_HOLD',
 ipa_source:{record_id:phase1Id}}, {master_phase1_source:'KAIKKI_FRESH_EDITOR_TEST',
 master_record_id:phase1Id});
assert.equal(result.text,'音标待核验');
assert.equal(result.status,'phase1-hold');
result=render({ipa:'/ɹɛd/',ipa_status:'NATIVE_KAIKKI_SINGLE_PHONEMIC_VARIANT_PROVISIONAL',ipa_provisional:true,ipa_source:{source_sha256:'test-sha'}});
assert.equal(result.text,'/rɛd/（测试音标·未认证）');
assert.equal(result.status,'provisional-master-test');
// Even a provenance-marked source cannot display missing, malformed or
// concatenated IPA. No new candidate or formal approval may be inferred.
for(const invalid of [null,undefined,'','ɹɛd','/ɹɛd','/ɹɛd/ /ɹɪd/','/ɹɛd/（未认证）','[ɹɛd/','/   /','[\t]','/\u00a0/']){
 const guarded=render({ipa:invalid,ipa_status:'NATIVE_KAIKKI_SINGLE_PHONEMIC_VARIANT_PROVISIONAL',ipa_provisional:true,ipa_source:{source_sha256:'test-sha'}});
 assert.equal(guarded.text,'音标待补',String(invalid));
 assert.equal(guarded.status,'missing',String(invalid));
}
// Execute the real statistics counting expression against valid and invalid
// test-only readings: the stats panel must never inflate selected IPA coverage.
const statStart=inline.indexOf('const withIpa=items.filter(x=>{');
const statEnd=inline.indexOf('.length;',statStart);
assert(statStart>0&&statEnd>statStart,'actual IPA stats predicate must exist');
const statSource=inline.slice(statStart,statEnd+'.length;'.length);
const statContext={items:[
 {question:{ipa:'/rɛd/'}},{question:{ipa:'[tʃɪld]'}},
 {question:{ipa:null}},{question:{ipa:''}},
 {question:{ipa:'/   /'}},{question:{ipa:'[\t]'}},
 {question:{ipa:'/rɛd/ /rɪd/'}},{question:{ipa:'rɛd'}},
 {question:{ipa:'/rɛd/（测试）'}}
]};
vm.runInNewContext(statSource+'\nthis.selectedCount=withIpa;',statContext);
assert.equal(statContext.selectedCount,2,'statistics count only two complete IPA candidates');
console.log(JSON.stringify({status:'PASS',formatterCases:cases.length,renderCases:14,statsCases:9,mutations:0,approvedIPA:0,srsWrites:0}));
