// Compare independently generated AI proposals with reviewer verdicts.
// Does NOT authenticate reviewer independence or promote anything to production.
import fs from 'node:fs';
const [manifestPath,proposalsPath,reviewsPath,outPath]=process.argv.slice(2);
if(!outPath)throw Error('USAGE: validate-ai-semantic-reviews.mjs manifest proposals reviews output');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const [m,p,r]=[manifestPath,proposalsPath,reviewsPath].map(read);
if(m.schema!=='scene500-ai-semantic-job-manifest-v0.1'||m.status!=='JOBS_NOT_EXECUTED'||
 p.schema!=='scene500-ai-proposal-v0.1'||r.schema!=='scene500-ai-review-v0.1'||
 !Array.isArray(p.edges)||!Array.isArray(r.verdicts))throw Error('INVALID_AI_BATCH_CONTRACT');
const validTerms=new Map(m.jobs.flatMap(j=>j.terms).map(t=>[t.term_id,t.term]));
const sceneIds=new Set(m.scenes.map(s=>s.id));
const proposals=new Map(),verdicts=new Map();
for(const x of p.edges){
 const k=JSON.stringify([x.term_id,x.scene_id]);
 if(!validTerms.has(x.term_id)||validTerms.get(x.term_id)!==x.term||!sceneIds.has(x.scene_id)||
 typeof x.rationale_zh!=='string'||x.rationale_zh.trim().length<8||
 typeof x.counterexample_zh!=='string'||x.counterexample_zh.trim().length<5||
 proposals.has(k))throw Error('INVALID_AI_PROPOSAL');
 proposals.set(k,x);
}
for(const v of r.verdicts){
 const k=JSON.stringify([v.term_id,v.scene_id]);
 if(!proposals.has(k)||verdicts.has(k)||!['agree','reject','uncertain'].includes(v.verdict)||
 typeof v.reason_zh!=='string'||v.reason_zh.trim().length<6)throw Error('INVALID_REVIEW_VERDICT');
 verdicts.set(k,v);
}
const rows=[...proposals].map(([key,edge])=>{
 const review=verdicts.get(key);
 const state=review?.verdict==='reject'?'REJECTED':
  review?.verdict==='agree'?'AI_AGREEMENT_NEEDS_INDEPENDENT_QA':'MANUAL_REVIEW_REQUIRED';
 return {...edge,review:review??null,status:state,release_eligible:false};
});
const counts={proposalEdges:rows.length,agreement:rows.filter(x=>x.status==='AI_AGREEMENT_NEEDS_INDEPENDENT_QA').length,
 rejected:rows.filter(x=>x.status==='REJECTED').length,manual:rows.filter(x=>x.status==='MANUAL_REVIEW_REQUIRED').length};
const out={schema:'scene500-ai-adjudication-result-v0.1',status:'NOT_CERTIFIED_NOT_DEPLOYABLE',
 counts,rows,notes:['AI agreement is correlated evidence, not independently verified truth',
 'Second reviewer must use separate prompt/context/model configuration','All rows remain release_eligible=false']};
fs.writeFileSync(outPath,JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify(counts));
