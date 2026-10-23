// Build deterministic, privacy-safe AI adjudication jobs for Chinese Core20K -> Scene500.
// This is a job builder, NOT an AI invocation or approval system.
// Usage: node make-ai-semantic-jobs.mjs lex.json catalog.json baseline.json out.json [batchSize]
import fs from 'node:fs';
import crypto from 'node:crypto';
const [lexPath,catPath,assocPath,outPath,chunk='40']=process.argv.slice(2);
if(!outPath)throw Error('USAGE: make-ai-semantic-jobs.mjs lex catalog associations output [batchSize]');
const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const [lex,catalog,base]=[lexPath,catPath,assocPath].map(load);
if(lex.data_version!=='0.10.1-evidence-compat'||lex.terms?.length!==20000||
 catalog.scene_count!==500||Object.keys(catalog.scenes??{}).length!==500||base.links?.length!==3553)throw Error('INVALID_REAL_BASELINE');
const batchSize=Number(chunk);
if(!Number.isInteger(batchSize)||batchSize<5||batchSize>100)throw Error('INVALID_BATCH_SIZE');
const covered=new Set(base.links.map(x=>x.term_id));
const targets=lex.terms.filter(t=>!covered.has(t.term_id)&&t.stopword_hint!==true);
const scenes=Object.entries(catalog.scenes).map(([id,s])=>({
 id,name:s.name,aliases:(s.aliases??[]).slice(0,10),
 actions:(s.actions??[]).slice(0,12),objects:(s.objects??[]).slice(0,12),
 description:String(s.description_enriched??'').slice(0,250),
 negative_terms:(s.negative_terms??[]).slice(0,10)
}));
const jobs=[];
for(let i=0;i<targets.length;i+=batchSize){
 const terms=targets.slice(i,i+batchSize).map(x=>({
  term_id:x.term_id,term:x.term,normalized_term:x.normalized_term,
  pos:x.pos??null,frequency_rank:x.frequency_rank??null
 }));
 const id='zh-v0101-'+String(i/batchSize+1).padStart(4,'0');
 jobs.push({job_id:id,terms,task:'propose_semantic_scene_links',max_scenes_per_term:5,
  rules:['Use semantics rather than character substring overlap',
   'Use only given scene IDs; exclude vague classroom/discussion links without topical support',
   'Avoid negations, named-entity conflation, polysemy and false compounds',
   'Every proposed pair needs a concrete Chinese rationale and counterexample',
   'Return an empty array for terms without a defensible Scene500 relation',
   'All outputs remain UNVERIFIED; do not assert approval']});
}
const output={schema:'scene500-ai-semantic-job-manifest-v0.1',status:'JOBS_NOT_EXECUTED',
 lexicon_version:lex.data_version,association_baseline:base.links.length,
 scene_count:scenes.length,unlinked_content_terms:targets.length,
 job_count:jobs.length,scenes,jobs};
const data=JSON.stringify(output);
fs.writeFileSync(outPath,data+'\n');
console.log(JSON.stringify({jobs:jobs.length,terms:targets.length,bytes:Buffer.byteLength(data),
 sha256:crypto.createHash('sha256').update(data+'\n').digest('hex')}));
