// Read-only Rule vs Hybrid mixed-language diagnostic, no quality gate or release decision.
import fs from 'node:fs';
import {createScene500Recommender} from '../engine.mjs';
import {loadScene500WithChineseLexicon} from '../chinese-lexicon-loader.mjs';
const [catPath,lexPath,linkPath]=process.argv.slice(2);
if(!catPath||!lexPath||!linkPath)throw Error('USAGE: catalog lexicon associations');
const [cat,lex,links]=[catPath,lexPath,linkPath].map(p=>JSON.parse(fs.readFileSync(p,'utf8')));
const resp=data=>({ok:true,json:async()=>data});
const hybrid=await loadScene500WithChineseLexicon({catalog:cat,lexiconUrl:'lex',associationUrl:'assoc',fetchImpl:async u=>resp(u==='lex'?lex:links)});
if(hybrid.mode!=='hybrid')throw Error('EXPECTED_HYBRID');
const rule=createScene500Recommender({catalog:cat});
const queries=[
 {id:'M01',query:'I want to book 酒店 room',intent:'hotel_booking'},
 {id:'M02',query:'酒店 check in 前台',intent:'hotel_checkin'},
 {id:'M03',query:'地铁停运了，怎么 take a taxi?',intent:'taxi_fallback'},
 {id:'M04',query:'不要地铁，坐 bus',intent:'negated_metro'},
 {id:'M05',query:'怎么 order coffee 在咖啡店',intent:'coffee_order'},
 {id:'M06',query:'我要练习 English speaking，不是 machine learning',intent:'english_speaking'},
 {id:'M07',query:'software app 闪退怎么修复',intent:'software_error'},
 {id:'M08',query:'我想学 AI 和 deep learning',intent:'technical_ml'},
 {id:'M09',query:'机场 check in 取 boarding pass',intent:'airport_checkin'},
 {id:'M10',query:'租房 deposit 退押金',intent:'deposit_return'},
 {id:'M11',query:'我需要 prepare an academic paper 论文摘要',intent:'academic_writing'},
 {id:'M12',query:'整理卧室，但不是搬家',intent:'bedroom_not_moving'}
];
const rows=queries.map(q=>{
 const opts={limit:10};
 const a=rule.search(q.query,opts).results,b=hybrid.search(q.query,opts).results;
 const eligible=new Set(['S001','S002','S003']);
 const limited=hybrid.search(q.query,{limit:10,eligibleSceneIds:eligible}).results;
 if(limited.some(x=>!eligible.has(x.sceneId)))throw Error('ELIGIBILITY_BYPASS '+q.id);
 if(JSON.stringify(b)!==JSON.stringify(hybrid.search(q.query,opts).results))throw Error('NONDETERMINISTIC '+q.id);
 if(new Set(b.map(x=>x.sceneId)).size!==b.length)throw Error('DUPLICATE '+q.id);
 return {...q,ruleTop5:a.slice(0,5).map(x=>x.sceneId),hybridTop5:b.slice(0,5).map(x=>x.sceneId),hybridEmpty:b.length===0};
});
console.log(JSON.stringify({status:'PROVISIONAL_DIAGNOSTIC_NOT_GOLD',label_status:'NOT_BLIND_ADJUDICATED',runtime_changed:false,count:rows.length,rows},null,2));
