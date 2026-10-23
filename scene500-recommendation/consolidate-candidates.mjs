import fs from 'node:fs';
const [lexFile,catalogFile,baselineFile,outputFile,...sourceFiles]=process.argv.slice(2);
if(!outputFile||!sourceFiles.length)throw Error('MISSING_INPUT');
const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const [lex,catalog,base]=[lexFile,catalogFile,baselineFile].map(load);
if(lex.data_version!=='0.10.1-evidence-compat'||lex.terms?.length!==20000||catalog.scene_count!==500||base.links?.length!==3553)throw Error('BAD_BASELINE');
const byId=new Map(lex.terms.map(t=>[t.term_id,t]));
const baselinePairs=new Set(base.links.map(x=>JSON.stringify([x.term_id,x.scene_id])));
const merged=new Map(),sources=[];
for(const file of sourceFiles){
 const data=load(file);
 const types={'scene500-semantic-workset-v0.1':'NOT_APPROVED','scene500-compound-evidence-v0.1':'REVIEW_ONLY_NOT_APPROVED','scene500-compound-inheritance-proposals-v0.1':'REVIEW_ONLY_NOT_APPROVED','scene500-semantic-priority-queue-v0.1':'REVIEW_ONLY_NOT_APPROVED'};
 if(types[data.schema]!==data.status)throw Error('UNSAFE_SOURCE');
 const rows=data.schema==='scene500-semantic-priority-queue-v0.1'?[...data.queue,...data.deferred]:data.candidates;
 if(!Array.isArray(rows))throw Error('INVALID_ROWS');
 for(const x of rows){
  if(x.release_eligible!==false||byId.get(x.term_id)?.term!==x.term||!catalog.scenes[x.scene_id])throw Error('INVALID_CANDIDATE');
  const key=JSON.stringify([x.term_id,x.scene_id]);
  if(baselinePairs.has(key))continue;
  if(!merged.has(key))merged.set(key,{term_id:x.term_id,term:x.term,scene_id:x.scene_id,scene_name:catalog.scenes[x.scene_id].name,status:'REVIEW_REQUIRED',release_eligible:false,evidence:[]});
  const dest=merged.get(key);
  const origin=data.schema==='scene500-semantic-priority-queue-v0.1'?'scene500-semantic-workset-v0.1':data.schema;
  if(!dest.evidence.some(e=>e.schema===origin))dest.evidence.push({schema:origin,type:x.evidence_type??null});
 }
 sources.push({schema:data.schema,count:rows.length});
}
const rows=[...merged.values()].sort((a,b)=>a.term_id.localeCompare(b.term_id)||a.scene_id.localeCompare(b.scene_id));
const baselineTerms=new Set(base.links.map(x=>x.term_id));
const result={schema:'scene500-unified-review-queue-v0.1',status:'REVIEW_ONLY_NOT_APPROVED',sourceVersion:lex.data_version,
 baselineLinks:base.links.length,uniqueCandidates:rows.length,candidateTerms:new Set(rows.map(x=>x.term_id)).size,
 newlyCoveredIfApproved:new Set(rows.filter(x=>!baselineTerms.has(x.term_id)).map(x=>x.term_id)).size,sources,provenancePolicy:'Prioritization queues are derivatives of semantic-workset and never independent evidence.',rows};
fs.writeFileSync(outputFile,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({candidates:result.uniqueCandidates,terms:result.candidateTerms,newTerms:result.newlyCoveredIfApproved}));
