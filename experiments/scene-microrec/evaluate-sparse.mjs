import fs from 'node:fs';
import {trainSparse} from './sparse-supervised.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
const cat=read('../../scene500-recommendation/catalog-v0.2.json');
const model=trainSparse(cat);
const names=['holdout-20-editorial-v1.json','prospective-24-v1.json','generalization-probe-20-v1.json'];
let positives=0,top1=0,top5=0,negative=0,leaks=0,queries=0;
for(const filename of names){const suite=read('../../scene500-recommendation/qa/'+filename);for(const item of suite.cases){queries++;const results=model.search(item.query,{limit:10}),ids=results.map(x=>x.sceneId),expected=item.expected||item.relevant||[];if(expected.length){positives++;if(expected.includes(ids[0]))top1++;if(ids.slice(0,5).some(id=>expected.includes(id)))top5++;}if(item.excluded?.length){negative++;if(ids.slice(0,5).some(id=>item.excluded.includes(id)))leaks++;}}}
const output={status:'CORPUS_FITTED_NOT_SEMANTIC_DISTILLED_NOT_BLIND',queries,positive_cases:positives,top1,top5,negative_cases:negative,negative_leaks:leaks,model:{scenes:model.scenes},note:'Feature weights derive from Scene500 catalog fields, not externally labeled supervision. No claim of trained multilingual semantic encoder.'};
console.log(JSON.stringify(output,null,2));
