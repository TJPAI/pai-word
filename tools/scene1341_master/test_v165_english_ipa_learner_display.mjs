import assert from 'node:assert/strict';
import {displayEnglishIPA,describeEnglishIPADisplay} from './v165_english_ipa_learner_display.mjs';
const cases=[
 ['/ɹɛd/','/rɛd/'],
 ['/ˈfɹʌstɹeɪtɪd/','/ˈfrʌstreɪtɪd/'],
 ['/ˈɡɹiːn/','/ˈgriːn/'],
 ['/t͡ʃɪld/','/tʃɪld/'],
 ['/d͡ʒʌd͡ʒ/','/dʒʌdʒ/'],
 ['/ˌt͡ʃɹeɪnd͡ʒ/','/ˌtʃreɪndʒ/'],
 ['[t͡ʃɡɹ]','[tʃgr]'],
 ['/tʃ dʒ/','/tʃ dʒ/'],
 ['/t͜ʃ/','/t͜ʃ/'], // different tie bar intentionally held
 ['/p͡f/','/p͡f/'], // other affricates unchanged
 ['/ɡ̊/','/g̊/'], // glyph only, diacritic remains
 ['/ʀɾɫʰʔ/','/ʀɾɫʰʔ/'],
 ['/ˌoʊvɚˈweɪt/','/ˌoʊvɚˈweɪt/'],
 ['/ɝː əɹ/','/ɝː ər/'],
 ['ɡɹɛd','ɡɹɛd'], // non-enveloped content is not transformed
 ['/ɹɛd/（测试音标·未认证）','/ɹɛd/（测试音标·未认证）'],
 ['/ɹ/ [ɡ]','/ɹ/ [ɡ]'],
 ['/ɹɛd','/ɹɛd'],
 ['[ɹɛd/','[ɹɛd/'],
 ['', ''],
 [null, null],
 [' /ɹɡt͡ʃd͡ʒ/ ','/rgtʃdʒ/']
];
for(const [input,expected] of cases)
 assert.equal(displayEnglishIPA(input),expected,JSON.stringify(input));
for(const locale of ['fr','de','es','zh','unknown'])
 assert.equal(displayEnglishIPA('/ɹɡt͡ʃd͡ʒ/',{language:locale}),'/ɹɡt͡ʃd͡ʒ/');
for(const locale of ['en','en-US','en-GB'])
 assert.equal(displayEnglishIPA('/ɹɡt͡ʃd͡ʒ/',{language:locale}),'/rgtʃdʒ/');
const row=Object.freeze({ipa:'/ɹɡt͡ʃd͡ʒ/',qa_status:'DEFERRED',release_allowed:false});
const snapshot=JSON.stringify(row);
const audit=describeEnglishIPADisplay(row.ipa);
assert.deepEqual([audit.source_ipa,audit.display_ipa,audit.qa_approved,audit.release_allowed],
 [row.ipa,'/rgtʃdʒ/',false,false]);
assert.equal(JSON.stringify(row),snapshot);
assert.equal(displayEnglishIPA(audit.display_ipa),audit.display_ipa);
console.log('PASS V165 display-only conversion:',cases.length,'cases + locale/immutability/idempotence assertions');
