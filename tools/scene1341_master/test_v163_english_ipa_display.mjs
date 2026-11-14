import assert from 'node:assert/strict';
import {displayEnglishIPA,describeEnglishIPADisplay} from './v163_english_ipa_display.mjs';
const cases=[
  ['/ɹɛd/','/rɛd/'],
  ['/ˈfɹʌstɹeɪtɪd/','/ˈfrʌstreɪtɪd/'],
  ['/ˌoʊvɚˈweɪt/','/ˌoʊvɚˈweɪt/'],
  ['/rɛd/','/rɛd/'],
  ['[ɹɛd]','[rɛd]'],
  ['ɹɛd','ɹɛd'],
  ['/ɹɛd/（测试音标·未认证）','/ɹɛd/（测试音标·未认证）'],
  ['/ʀɛd/','/ʀɛd/'],
  ['/r/','/r/'],
  ['/ɹ/','/r/'],
  ['',''],
  [null,null],
  [' /ɹaɪt/ ','/raɪt/'],
  ['[ɹ]','[r]'],
  ['/ɹ/ [ɹ]','/ɹ/ [ɹ]']
];
for(const [src,expected] of cases)assert.equal(displayEnglishIPA(src),expected,String(src));
assert.equal(displayEnglishIPA('/ɹɛd/',{language:'fr'}),'/ɹɛd/');
assert.equal(displayEnglishIPA('/ɹɛd/',{language:'en-US'}),'/rɛd/');
const audit=describeEnglishIPADisplay('/ɹɛd/');
assert.equal(audit.source_ipa,'/ɹɛd/');
assert.equal(audit.display_ipa,'/rɛd/');
assert.equal(audit.qa_approved,false);
assert.equal(audit.source_preserved,true);
console.log('V163: '+cases.length+' source/display cases plus locale and source-integrity checks PASS');
