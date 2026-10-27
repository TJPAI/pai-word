import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createPrototypeRetriever} from './prototype-retriever.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
const catalog=read('../../scene500-recommendation/catalog-v0.2.json');
const m=createPrototypeRetriever(catalog);
let n=0,h1=0,h5=0,english=0,englishHit=0,neg=0,leak=0;
for(const file of ['holdout-20-editorial-v1.json','prospective-24-v1.json','generalization-probe-20-v1.json']){
 for(const x of read('../../scene500-recommendation/qa/'+file).cases){const ids=m.search(x.query,{limit:10}).map(x=>x.sceneId),expected=x.expected||x.relevant||[];if(expected.length){n++;h1+=Number(expected.includes(ids[0]));h5+=Number(ids.slice(0,5).some(y=>expected.includes(y)));if(/[a-z]/i.test(x.query)&&!/[\u3400-\u9fff]/u.test(x.query)){english++;englishHit+=Number(ids.slice(0,5).some(y=>expected.includes(y)));}}if(x.excluded?.length){neg++;leak+=Number(ids.slice(0,5).some(y=>x.excluded.includes(y)));}}
}
const scenes={...catalog.scenes};for(let i=501;i<=1500;i++)scenes['S'+String(i).padStart(4,'0')]={name:'规模模拟场景'+i,aliases:['扩展'+i]};
const big=createPrototypeRetriever({...catalog,scenes,scene_count:1500});
assert.equal(big.sceneCount,1500);assert.equal(big.prototypeBytes,1500*(128+4));
assert.deepEqual(m.search('公交', {limit:5}),m.search('公交',{limit:5}));
console.log(JSON.stringify({status:'PASS_STRUCTURAL_ONLY',top1:h1,recall5_hits:h5,labeled:n,english_hit5:englishHit,english_labeled:english,excluded_leaks:leak,excluded_cases:neg,prototype500_bytes:m.prototypeBytes,prototype1500_bytes:big.prototypeBytes,note:'Untrained hashed vector encoder. Neither multilingual semantic capability nor 2MB full-package compliance is established.'},null,2));
