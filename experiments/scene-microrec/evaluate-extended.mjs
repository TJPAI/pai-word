import fs from 'node:fs';
import {createScene500Recommender} from '../../scene500-recommendation/engine.mjs';
import {createMicroRec} from './microrec.mjs';
import {createIntentAware} from './intent-aware.mjs';
const load=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const catalog=load('../../scene500-recommendation/catalog-v0.2.json');
const base=createScene500Recommender({catalog,minimumScore:3}), micro=createMicroRec(catalog),intent=createIntentAware(catalog);
const files=['../../scene500-recommendation/qa/holdout-20-editorial-v1.json','../../scene500-recommendation/qa/prospective-24-v1.json','../../scene500-recommendation/qa/generalization-probe-20-v1.json'];
for(const p of files){const dataset=load(p);const cases=dataset.cases;const rows={};
for(const mode of ['current-rule','lexical','hashed-semantic','hybrid','intent-aware']){let ok1=0,ok5=0,ok10=0,n=0,excludedN=0,excludedErrors=0,empty=0;
for(const t of cases){const r=mode==='current-rule'?base.search(t.query,{limit:10}).results:mode==='intent-aware'?intent.search(t.query,{limit:10}):micro.search(t.query,{method:mode,limit:10});const ids=r.map(x=>x.sceneId);if(ids.length===0)empty++;
const expected=t.relevant||t.expected;if(expected?.length){n++;const i=ids.findIndex(x=>expected.includes(x));if(i===0)ok1++;if(i>=0&&i<5)ok5++;if(i>=0&&i<10)ok10++;}
if(t.excluded?.length){excludedN++;if(t.excluded.some(x=>ids.slice(0,5).includes(x)))excludedErrors++;}
}
rows[mode]={positive_cases:n,top1:n?+(ok1/n).toFixed(4):null,recall5:n?+(ok5/n).toFixed(4):null,recall10:n?+(ok10/n).toFixed(4):null,excluded_cases:excludedN,excluded_violations:excludedErrors,empty_results:empty};}
console.log(JSON.stringify({dataset:p.split('/').at(-1),status:dataset.status,cases:cases.length,results:rows},null,2));}
