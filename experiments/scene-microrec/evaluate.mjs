import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import {gzipSync} from 'node:zlib';
import {createScene500Recommender} from '../../scene500-recommendation/engine.mjs';
import {createMicroRec} from './microrec.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const catalog=read('../../scene500-recommendation/catalog-v0.2.json');
const holdout=read('../../scene500-recommendation/qa/holdout-20-editorial-v1.json');
const baseline=createScene500Recommender({catalog,minimumScore:3});
const candidate=createMicroRec(catalog);
const methods=['current-rule','lexical','hashed-semantic','hybrid'];
const cases=holdout.cases.filter(x=>Array.isArray(x.relevant)&&x.relevant.length);
function evaluate(method){let hit1=0,hit5=0,hit10=0,mrr=0,negative=0,violations=0,count=0;
 for(const x of cases){const results=method==='current-rule'?baseline.search(x.query,{limit:10}).results:candidate.search(x.query,{method,limit:10});const ids=results.map(z=>z.sceneId);
 const rank=ids.findIndex(id=>x.relevant.includes(id));count++;
 if(rank===0)hit1++;if(rank>=0&&rank<5)hit5++;if(rank>=0&&rank<10)hit10++;if(rank>=0)mrr+=1/(rank+1);
 if(x.excluded){negative++;if(x.excluded.some(id=>ids.slice(0,5).includes(id)))violations++;}
 }return {cases:count,top1:hit1/count,recall5:hit5/count,recall10:hit10/count,mrr10:mrr/count,excluded_cases:negative,excluded_top5_violations:violations};}
function time(method){for(let i=0;i<20;i++)for(const x of cases)(method==='current-rule'?baseline.search(x.query,{limit:5}):candidate.search(x.query,{method,limit:5}));
 const times=[];for(let k=0;k<40;k++){for(const x of cases){const t=performance.now();method==='current-rule'?baseline.search(x.query,{limit:5}):candidate.search(x.query,{method,limit:5});times.push(performance.now()-t);}}
 times.sort((a,b)=>a-b);return {p50ms:+times[Math.floor(times.length*.5)].toFixed(3),p95ms:+times[Math.floor(times.length*.95)].toFixed(3),samples:times.length};}
const code=fs.readFileSync(new URL('./microrec.mjs',import.meta.url));
const catalogBytes=fs.readFileSync(new URL('../../scene500-recommendation/catalog-v0.2.json',import.meta.url));
const originalCode=fs.readFileSync(new URL('../../scene500-recommendation/engine.mjs',import.meta.url));
const stats={size:{candidate_js_bytes:code.length,candidate_js_gzip_bytes:gzipSync(code).length,catalog_bytes:catalogBytes.length,catalog_gzip_bytes:gzipSync(catalogBytes).length,baseline_code_bytes:originalCode.length},note:'Prototype only; hashed semantic embeddings are random feature hashing, not trained cross-lingual AI. Dataset is editorial, not blind. Node timings are not Safari timings.',catalogCount:Object.keys(catalog.scenes).length};
const report={source:'scene500-recommendation-dev fork at 79d2ce4281eb85bc95315a042f025fb03983d487',methods:Object.fromEntries(methods.map(m=>[m,{quality:evaluate(m),performance:time(m)}])),...stats};
if(Object.keys(catalog.scenes).length!==500)throw Error('Scene count changed');
console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--write')){fs.writeFileSync(new URL('./results.json',import.meta.url),JSON.stringify(report,null,2)+'\n');}
