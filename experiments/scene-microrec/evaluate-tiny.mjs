import fs from 'node:fs';
import {trainTinyRanker} from './tiny-ranker.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const catalog=read('../../scene500-recommendation/catalog-v0.2.json');
const model=trainTinyRanker(catalog);
const suites=['holdout-20-editorial-v1.json','prospective-24-v1.json','generalization-probe-20-v1.json'];
let labeled=0,top1=0,top5=0,neg=0,leaks=0,en=0,enhit=0;
for(const name of suites)for(const x of read('../../scene500-recommendation/qa/'+name).cases){
 const ids=model.search(x.query,{limit:10}).map(r=>r.sceneId),correct=x.expected||x.relevant||[];
 if(correct.length){labeled++;if(correct.includes(ids[0]))top1++;if(ids.slice(0,5).some(id=>correct.includes(id)))top5++;if(/[a-z]/i.test(x.query)&&!/[\u3400-\u9fff]/u.test(x.query)){en++;if(ids.slice(0,5).some(id=>correct.includes(id)))enhit++;}}
 if(x.excluded?.length){neg++;if(ids.slice(0,5).some(id=>x.excluded.includes(id)))leaks++;}
}
const result={status:'TRAINED_CATALOG_ONLY_NOT_BLIND',model:'hashed linear pairwise ranker, int8',dimension:model.dimension,trainingPairs:model.trainingPairs,weight_bytes:model.quantizedBytes,queries_labeled:labeled,top1,top5,english_labeled:en,english_hit5:enhit,negative_checks:neg,negative_leaks:leaks,warning:'Training examples derive from Scene500 aliases/example queries and can overlap evaluation surface forms. Not a trained pretrained bilingual semantic model.'};
console.log(JSON.stringify(result,null,2));
if(model.quantizedBytes>2000000)process.exitCode=1;
