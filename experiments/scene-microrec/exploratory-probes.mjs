import fs from 'node:fs';
import {createIntentAware} from './intent-aware.mjs';
import {createConservativeMicro} from './conservative.mjs';
const catalog=JSON.parse(fs.readFileSync(new URL('../../scene500-recommendation/catalog-v0.2.json',import.meta.url)));
const engines={intent:createIntentAware(catalog),conservative:createConservativeMicro(catalog)};
const probes=[
 {q:'I want to practise English pronunciation',excluded:['S279','S280'],group:'english-language'},
 {q:'我想学英语口语，不是机器学习',excluded:['S279','S280'],group:'cross-domain'},
 {q:'Can you explain machine learning?',expected:['S279'],group:'technical'},
 {q:'帮我查询hotel入住时间',expected:['S114'],group:'mixed-language'},
 {q:'No subway, take the bus instead',expected:['S078'],excluded:['S079'],group:'negation-en'},
 {q:'我不是要订酒店，是要办理入住',expected:['S114'],excluded:['S113'],group:'contrast'},
 {q:'I need to check in at my hotel',expected:['S114'],group:'english-hotel'},
 {q:'不乘公交，改搭地铁',expected:['S079'],excluded:['S078'],group:'negation-zh'},
 {q:'I'd like a cappuccino',expected:['S039'],group:'paraphrase'},
 {q:'想了解量子计算的科研资料',expected:['S137'],group:'academic'}
];
const report={status:'NEW_AUTHOR_AUTHORED_EXPLORATORY_NOT_BLIND',notes:'Authored after candidate implementation; no training claim. Do not count these as blind generalization.',probes:probes.map(p=>({query:p.q,group:p.group,expected:p.expected||[],excluded:p.excluded||[],systems:Object.fromEntries(Object.entries(engines).map(([name,engine])=>{const ids=engine.search(p.q,{limit:5}).map(x=>x.sceneId);return [name,{top5:ids,hit:p.expected?.length?ids.some(id=>p.expected.includes(id)):null,excluded_leak:p.excluded?.length?ids.some(id=>p.excluded.includes(id)):null}]}))}))};
console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--write'))fs.writeFileSync(new URL('./exploratory-probes.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
