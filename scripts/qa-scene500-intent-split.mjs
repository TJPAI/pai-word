import fs from 'node:fs';
import {createScene500ContractAdapter} from '../scene500-recommendation/contract-adapter.mjs';
import {evaluateIntentCase} from '../scene500-recommendation/intent-evaluation.mjs';
const [catalogPath,lexiconPath,associationPath,outputPath]=process.argv.slice(2);
if(!catalogPath||!lexiconPath||!associationPath||!outputPath)throw Error('Usage: node scripts/qa-scene500-intent-split.mjs catalog.json compact-lexicon.json associations.json report.json');
const catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8'));
const v=JSON.parse(fs.readFileSync(lexiconPath,'utf8'));
const associations=JSON.parse(fs.readFileSync(associationPath,'utf8'));
const lexicon={source_version:v.version,terms:v.terms.map(t=>({term_id:t.id,term:t.t,normalized_term:t.n,aliases:[],source_version:v.version,frequency_rank:null,frequency_score:null,pos:null}))};
const engine=createScene500ContractAdapter({catalog,lexicon,associations});
const cases=[
 {query:'我想买公交车票',type:'single',mustTop1:'S092'},
 {query:'怎么买公交车票',type:'single',mustTop1:'S092'},
 {query:'我要乘公交车去学校',type:'single',mustTop1:'S078'},
 {query:'公交车在哪里上车',type:'single',mustTop1:'S078'},
 {query:'乘公交车怎么付钱买票',type:'multi',mustTop5:['S078','S092']},
 {query:'我要乘地铁然后买交通卡',type:'multi',mustTop5:['S079','S092']},
 {query:'我想购买一张火车票',type:'single',mustTop1:'S092'},
 {query:'请教我怎么购买机票',type:'single',mustTop1:'S103'},
 {query:'我要去酒店前台办理入住',type:'single',mustTop1:'S114'},
 {query:'给审稿人回复修改意见',type:'single',mustTop1:'S169'}
];
const results=cases.map(c=>{const top5=engine.search(c.query,{limit:5}).results.map(r=>r.sceneId);const verdict=evaluateIntentCase(c,top5);return {...c,top5,...verdict};});
const report={schema:'scene500-intent-split-qa-v0.1',provenance:'10 authored regression queries, NOT blind',asset_scene_count:catalog.scene_count,association_edges:associations.links.length,summary:{total:results.length,passed:results.filter(x=>x.passed).length,failed:results.filter(x=>!x.passed).length,single:8,multi:2},results};
fs.writeFileSync(outputPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.summary));
if(report.summary.failed)process.exitCode=1;
