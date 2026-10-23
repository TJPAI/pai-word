// Reproducible 20,000-term Scene500 triage ledger. Never promotes an edge.
// node build-zh20k-coverage-ledger.mjs v0101.json v094-links.json review-queue.json output.jsonl summary.json
import fs from 'node:fs';
const [lexPath,linksPath,queuePath,outputPath,summaryPath]=process.argv.slice(2);
if(!lexPath||!linksPath||!queuePath||!outputPath||!summaryPath)throw Error('USAGE: build-zh20k-coverage-ledger.mjs lex.json links.json queue.json output.jsonl summary.json');
const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const lex=load(lexPath),links=load(linksPath),queue=load(queuePath);
if(lex.data_version!=='0.10.1-evidence-compat'||lex.terms?.length!==20000||
 links.links?.length!==3553||queue.status!=='REVIEW_ONLY_NOT_APPROVED')
 throw Error('INVALID_BASELINE');
const terms=new Map(lex.terms.map(t=>[t.term_id,t]));
if(terms.size!==20000)throw Error('DUPLICATE_TERM_ID');
const existing=new Map(),pending=new Map(),allKeys=new Set(),candidateKeys=new Set();
for(const a of links.links){
 if(!terms.has(a.term_id))throw Error('MISSING_BASELINE_TERM');
 const k=a.term_id+'\u0000'+a.scene_id;
 if(allKeys.has(k))throw Error('DUPLICATE_BASELINE_LINK');
 allKeys.add(k);
 if(!existing.has(a.term_id))existing.set(a.term_id,[]);
 existing.get(a.term_id).push(a.scene_id);
}
for(const a of [...queue.queue,...queue.deferred]){
 if(!terms.has(a.term_id)||a.release_eligible!==false)throw Error('INVALID_REVIEW_LINK');
 const k=a.term_id+'\u0000'+a.scene_id;
 if(allKeys.has(k)||candidateKeys.has(k))throw Error('DUPLICATE_REVIEW_LINK');
 candidateKeys.add(k);
 if(!pending.has(a.term_id))pending.set(a.term_id,[]);
 pending.get(a.term_id).push({scene_id:a.scene_id,priority:a.review_priority??'deferred'});
}
const counts={linked:0,unlinked:0,unlinkedWithReviewCandidates:0,unlinkedWithoutCandidates:0,
 stopwordHint:0,stopwordHintUnlinked:0,contentTriageUnlinked:0,candidates:queue.queue.length+queue.deferred.length};
const rows=[];
for(const t of lex.terms){
 const approved=existing.get(t.term_id)??[];
 const review=pending.get(t.term_id)??[];
 const isStopword=t.stopword_hint===true;
 if(isStopword)counts.stopwordHint++;
 if(approved.length)counts.linked++;else{
  counts.unlinked++;
  if(isStopword)counts.stopwordHintUnlinked++;
  if(!isStopword)counts.contentTriageUnlinked++;
  if(review.length)counts.unlinkedWithReviewCandidates++;else counts.unlinkedWithoutCandidates++;
 }
 rows.push({term_id:t.term_id,term:t.term,source_version:lex.data_version,
  stopword_hint:isStopword,baseline_links:approved.length,baseline_scenes:approved,
  unapproved_candidates:review.length,review_scene_ids:review.map(x=>x.scene_id),
  disposition:approved.length?'linked_baseline':isStopword?'exception_review':
   review.length?'candidate_review_needed':'semantic_evidence_needed',
  production_eligible:false});
}
fs.writeFileSync(outputPath,rows.map(x=>JSON.stringify(x)).join('\n')+'\n');
const summary={schema:'scene500-zh20k-coverage-ledger-v0.1',status:'AUDIT_ONLY',
 runtimeVersion:lex.data_version,termCount:rows.length,baselineLinks:links.links.length,
 reviewCandidateLinks:counts.candidates,counts,
 policies:['Stopword hint means exemption review, not automatic exclusion',
 'No review-only candidate is a certified relation','No frequency or sense evidence is invented']};
fs.writeFileSync(summaryPath,JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary));
