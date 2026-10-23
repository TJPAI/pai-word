// Reorder AI jobs for semantic yield, without deleting any term or certifying results.
// node prioritize-ai-semantic-jobs.mjs manifest.json output.json
import fs from 'node:fs';
const [src,out]=process.argv.slice(2);
if(!out)throw Error('USAGE: prioritize-ai-semantic-jobs.mjs input output');
const m=JSON.parse(fs.readFileSync(src,'utf8'));
if(m.schema!=='scene500-ai-semantic-job-manifest-v0.1'||m.status!=='JOBS_NOT_EXECUTED'||m.jobs?.length!==458)throw Error('INVALID_MANIFEST');
const weak=/^(?:一个|我们|他们|你们|这个|那个|这些|那些|因为|所以|但是|如果|没有|可以|不是|就是|已经|这个|什么|怎么|如何|一些|一种|还有|以及|为了|关于|可能|应该|需要|自己|现在|时候|非常|比较)$/u;
const entries=m.jobs.flatMap(j=>j.terms);
const unique=new Set(entries.map(x=>x.term_id));if(unique.size!==entries.length)throw Error('DUPLICATE_INPUT_TERM');
function tier(t){
 if(weak.test(t.term))return 3;
 if(/^[\u4e00-\u9fff]{2,6}$/u.test(t.term)&&t.term.length>=3)return 0;
 if(/^[\u4e00-\u9fff]{2,6}$/u.test(t.term))return 1;
 return 2;
}
entries.sort((a,b)=>tier(a)-tier(b)||String(a.term_id).localeCompare(String(b.term_id)));
const chunk=40,jobs=[];
for(let i=0;i<entries.length;i+=chunk)jobs.push({job_id:'zh-v0101-priority-'+String(i/chunk+1).padStart(4,'0'),terms:entries.slice(i,i+chunk),
 priority_tier:tier(entries[i]),task:'semantic_relation_proposal',max_scenes_per_term:5,
 rules:['Prioritize direct lexical sense-to-scene relevance','Abstain rather than force a match','Return evidence and a negative example','Never mark output approved']});
const result={schema:'scene500-ai-prioritized-manifest-v0.1',status:'JOBS_NOT_EXECUTED',lexicon_version:m.lexicon_version,
 source_jobs:m.job_count,term_count:entries.length,job_count:jobs.length,
 tier_counts:Object.fromEntries([0,1,2,3].map(n=>[n,entries.filter(t=>tier(t)===n).length])),
 scenes:m.scenes,jobs};
fs.writeFileSync(out,JSON.stringify(result)+'\n');
console.log(JSON.stringify({jobs:jobs.length,terms:entries.length,tiers:result.tier_counts}));
