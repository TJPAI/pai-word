import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createTrainedStudent} from './student-package.mjs';
import {createConservativeMicro} from './conservative.mjs';
globalThis.atob ??= s=>Buffer.from(s,'base64').toString('binary');
const file=process.argv[2];if(!file)throw Error('USAGE: node evaluate-real-student.mjs <actual-student.json>');
const raw=fs.readFileSync(file),pkg=JSON.parse(raw);
if(pkg.teacher?.model_id!=='intfloat/multilingual-e5-small'||pkg.teacher?.revision!=='fd1525a9fd15316a2d503bf26ab031a61d056e98')throw Error('UNEXPECTED_REAL_TEACHER');
const student=createTrainedStudent(pkg);
const load=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const catalog=load('../../scene500-recommendation/catalog-v0.2.json');
const conservative=createConservativeMicro(catalog);
if(student.sceneCount!==500)throw Error('BAD_SCENE_COUNT');
const sets=['holdout-20-editorial-v1.json','prospective-24-v1.json','generalization-probe-20-v1.json'].flatMap(name=>load('../../scene500-recommendation/qa/'+name).cases.map(x=>({...x,suite:name})));
function evalSystem(search){const m={labeled:0,top1:0,hit5:0,ndcg5:0,mrr10:0,exclusion:0,leaks:0,empty:0,byLanguage:{zh:{n:0,hit5:0},en:{n:0,hit5:0},mixed:{n:0,hit5:0}}};const mistakes=[];
for(const x of sets){const ids=search(x.query).map(z=>z.sceneId);if(!ids.length)m.empty++;if(ids.some(id=>!catalog.scenes[id]))throw Error('INVALID_SCENE');const positives=x.expected||x.relevant||[],negative=x.excluded||[];const lang=/[\u3400-\u9fff]/u.test(x.query)?(/[a-z]/i.test(x.query)?'mixed':'zh'):'en';if(positives.length){m.labeled++;m.byLanguage[lang].n++;if(positives.includes(ids[0]))m.top1++;if(ids.slice(0,5).some(id=>positives.includes(id))){m.hit5++;m.byLanguage[lang].hit5++;}const first=ids.findIndex(id=>positives.includes(id));if(first>=0)m.mrr10+=1/(first+1);const ideal=Array.from({length:Math.min(5,new Set(positives).size)},(_,i)=>1/Math.log2(i+2)).reduce((a,b)=>a+b,0);m.ndcg5+=ids.slice(0,5).reduce((s,id,i)=>s+(positives.includes(id)?1/Math.log2(i+2):0),0)/(ideal||1);if(!ids.slice(0,5).some(id=>positives.includes(id)))mistakes.push({query:x.query,suite:x.suite,expected:positives,top5:ids.slice(0,5)});}
if(negative.length){m.exclusion++;if(ids.slice(0,5).some(id=>negative.includes(id)))m.leaks++;}}
m.ndcg5=+(m.ndcg5/m.labeled).toFixed(4);m.mrr10=+(m.mrr10/m.labeled).toFixed(4);return {metrics:m,errors:mistakes};}
const studentResult=evalSystem(q=>student.search(q,{limit:10})),baseline=evalSystem(q=>conservative.search(q,{limit:10}));
const codeBytes=['student-package.mjs'].reduce((n,p)=>n+fs.statSync(new URL('./'+p,import.meta.url)).size,0),catalogBytes=fs.statSync(new URL('../../scene500-recommendation/catalog-v0.2.json',import.meta.url)).size;
const report={status:'REAL_TEACHER_DISTILLED_STUDENT_EDITORIAL_AB_NONBLIND',teacher:pkg.teacher,modelSha256:createHash('sha256').update(raw).digest('hex'),packageBytes:raw.length+codeBytes+catalogBytes,modelBytes:raw.length,catalogBytes,runtimeCodeBytes:codeBytes,limitBytes:2000000,queryCount:sets.length,student:studentResult,conservative:baseline,disclosure:'Existing editorial queries may overlap source training expressions. Not independent blinded certification. Full deployed application size not measured.'};
console.log(JSON.stringify({status:report.status,modelSha256:report.modelSha256,packageBytes:report.packageBytes,student:studentResult.metrics,conservative:baseline.metrics},null,2));fs.writeFileSync(new URL('./real-student-ab-report.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
if(report.packageBytes>2000000)process.exitCode=1;
