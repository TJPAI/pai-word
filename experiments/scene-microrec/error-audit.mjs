import fs from 'node:fs';
import {createScene500Recommender} from '../../scene500-recommendation/engine.mjs';
import {createMicroRec} from './microrec.mjs';
import {createIntentAware} from './intent-aware.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const catalog=read('../../scene500-recommendation/catalog-v0.2.json');
const suites=['holdout-20-editorial-v1.json','prospective-24-v1.json','generalization-probe-20-v1.json'];
const baseline=createScene500Recommender({catalog}),micro=createMicroRec(catalog),intent=createIntentAware(catalog);
const methods={baseline:q=>baseline.search(q,{limit:10}).results,micro_lex:q=>micro.search(q,{method:'lexical',limit:10}),micro_hybrid:q=>micro.search(q,{method:'hybrid',limit:10}),intent:q=>intent.search(q,{limit:10})};
const rows=[];
for(const name of suites){const suite=read('../../scene500-recommendation/qa/'+name);for(const x of suite.cases){const expected=x.relevant||x.expected||[],excluded=x.excluded||[];for(const [method,fn] of Object.entries(methods)){const ids=fn(x.query).map(x=>x.sceneId);rows.push({suite:name,group:x.group||x.category||'other',query:x.query,method,expected,excluded,top5:ids.slice(0,5),top1_hit:expected.length?expected.includes(ids[0]):null,top5_hit:expected.length?ids.slice(0,5).some(y=>expected.includes(y)):null,negative_leak:excluded.length?excluded.some(y=>ids.slice(0,5).includes(y)):null,empty:ids.length===0});}}}
const summary={};for(const method of Object.keys(methods)){const own=rows.filter(x=>x.method===method),pos=own.filter(x=>x.top1_hit!==null),neg=own.filter(x=>x.negative_leak!==null);summary[method]={positive_cases:pos.length,top1:pos.filter(x=>x.top1_hit).length,top5:pos.filter(x=>x.top5_hit).length,negative_cases:neg.length,negative_leaks:neg.filter(x=>x.negative_leak).length,empty:own.filter(x=>x.empty).length};}
const errors=rows.filter(x=>x.method==='intent'&&((x.top5_hit===false)||(x.negative_leak===true))).map(x=>({suite:x.suite,group:x.group,query:x.query,expected:x.expected,excluded:x.excluded,top5:x.top5,miss:x.top5_hit===false,leak:x.negative_leak===true}));
const report={status:'NONBLIND_EDITORIAL_DIAGNOSTIC',taxonomy:catalog.schema,summary,errors,notes:['All tests are editorial; do not train/tune on held-out items and then describe them as blind','Open-ended queries are only negative-control checks where excluded labels exist','Existing base is not the complete Core20K V0.10.1 runtime']};
console.log(JSON.stringify({status:report.status,summary,error_count:errors.length,first_errors:errors.slice(0,12)},null,2));
if(process.argv.includes('--write'))fs.writeFileSync(new URL('./error-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
