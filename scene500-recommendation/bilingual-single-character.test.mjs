import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createScene500ContractAdapter} from './contract-adapter.mjs';
import {extractMixedLanguageEvidence,expandMixedQuery} from './bilingual-evidence.mjs';
const catalog=JSON.parse(fs.readFileSync(new URL('./catalog-v0.2.json',import.meta.url),'utf8'));
test('single-character Chinese term is matched only as a complete query',()=>{
 const lexicon={source_version:'fixture',terms:[{term_id:'zh_book',term:'书',normalized_term:'书',aliases:[],source_version:'fixture'}]};
 const associations={association_version:'fixture',links:[{term_id:'zh_book',scene_id:'S004',rank:1,score:1,confidence:1,evidence_type:'fixture',association_version:'fixture'}]};
 const engine=createScene500ContractAdapter({catalog,lexicon,associations});
 const exact=engine.search('书',{limit:10,eligibleSceneIds:['S004']});
 assert.ok(exact.results.some(x=>x.sceneId==='S004'&&x.reason.includes('term_scene_association')));
 const phrase=engine.search('书店',{limit:10,eligibleSceneIds:['S004']});
 assert.ok(phrase.results.every(x=>!x.reason.includes('term_scene_association')));
});
test('bilingual phrases support mixed language and require English boundaries',()=>{
 const examples=extractMixedLanguageEvidence('我要学 Machine   Learning 然后开 meeting');
 assert.deepEqual(examples.map(x=>x.chinese),['机器学习','会议']);
 assert.deepEqual(extractMixedLanguageEvidence('premeeting'),[]);
 assert.deepEqual(extractMixedLanguageEvidence('meetingroom'),[]);
 const expanded=expandMixedQuery('学习 data analysis');
 assert.ok(expanded.expandedQuery.includes('数据分析'));
});
