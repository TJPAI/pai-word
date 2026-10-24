#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const [candidatePath,chatgptPath,musePath]=process.argv.slice(2);
if(!candidatePath||!chatgptPath||!musePath){console.error('Usage: node scripts/core20k-b172-dual-ai-consensus.mjs candidates.jsonl chatgpt.json muse.json');process.exit(2)}
const rows=readFileSync(candidatePath,'utf8').trim().split(/\r?\n/).map(JSON.parse);
const reviews=[chatgptPath,musePath].map(x=>JSON.parse(readFileSync(x,'utf8')));
const fields=['sense_alignment','pos','gloss_zh','gloss_en','example_naturalness','question_answer','answer_variants','pedagogic_value'];
const valid=new Set(['PASS','FAIL','UNRESOLVED']);
const issues=[],lookups=[];
const candidateIds=new Set(rows.map(x=>x.ku_id));
if(candidateIds.size!==rows.length)issues.push('DUPLICATE_CANDIDATE_KU');
if(rows.some(x=>!x.ku_id||!x.headword_id||!x.sense_id||!Number.isInteger(x.rank)))issues.push('INCOMPLETE_CANDIDATE_IDENTITY');
for(let i=0;i<2;i++){
 const r=reviews[i],who=['ChatGPT','Muse'][i];
 if(r.reviewer!==who||r.independently_reviewed!==true||r.saw_other_review!==false||!Array.isArray(r.items)||!r.review_id||!r.reviewed_at||!r.model_identifier)issues.push('INVALID_HEADER_'+who);
 if(new Set((r.items||[]).map(x=>x.ku_id)).size!==(r.items||[]).length)issues.push('DUPLICATE_REVIEW_ITEM_'+who);
 if((r.items||[]).some(x=>!candidateIds.has(x.ku_id)))issues.push('UNKNOWN_REVIEW_KU_'+who);
 lookups.push(new Map((r.items||[]).map(x=>[x.ku_id,x])));
}
if(reviews[0].review_id&&reviews[0].review_id===reviews[1].review_id)issues.push('DUPLICATE_REVIEW_ID');
// Self-declared provenance is not independently authenticated. Require operator-verifiable artifact references.
for(let i=0;i<2;i++){
 const r=reviews[i],who=['ChatGPT','Muse'][i];
 if(typeof r.provenance_uri!=='string'||!/^https:\/\/github\.com\/TJPAI\/pai-word\/(blob|commit)\//.test(r.provenance_uri))issues.push('MISSING_AUDITABLE_PROVENANCE_'+who);
}
if(reviews[0].provenance_uri&&reviews[0].provenance_uri===reviews[1].provenance_uri)issues.push('SHARED_PROVENANCE_URI');
const items=rows.map(row=>{
 const sha=createHash('sha256').update(JSON.stringify({ku_id:row.ku_id,headword_id:row.headword_id,sense_id:row.sense_id,rank:row.rank,content:row})).digest('hex');
 const [a,b]=lookups.map(m=>m.get(row.ku_id));const reasons=[];
 if(!a||!b)reasons.push('MISSING_INDEPENDENT_REVIEW');
 for(const x of [a,b].filter(Boolean)){if(x.candidate_sha256!==sha)reasons.push('CANDIDATE_DIGEST_MISMATCH');if(typeof x.rationale!=='string'||!x.rationale.trim())reasons.push('MISSING_RATIONALE');if(!x.fields||fields.some(f=>!valid.has(x.fields[f])))reasons.push('INCOMPLETE_FIELD_VERDICTS')}
 if(a&&b)for(const f of fields){if(a.fields?.[f]!==b.fields?.[f])reasons.push('DISAGREEMENT_'+f);else if(a.fields?.[f]!=='PASS')reasons.push('NONPASS_'+f)}
 if(row.test_only!==true||row.release_eligible!==false||row.srs_write_allowed!==false)reasons.push('STAGING_SAFETY_VIOLATION');
 if(!['LOW','MEDIUM'].includes(row.risk_level))reasons.push('HIGH_OR_UNASSESSED_RISK_REQUIRES_DIRECT_EVIDENCE');
 return {ku_id:row.ku_id,candidate_sha256:sha,status:issues.length===0&&reasons.length===0?'DUAL_AI_CONSENSUS_CANDIDATE':'STAGING_REVIEW_REQUIRED',release_eligible:false,srs_write_allowed:false,reasons:[...new Set(reasons)]};
});
const approved=items.filter(x=>x.status==='DUAL_AI_CONSENSUS_CANDIDATE').length;
console.log(JSON.stringify({schema:'pai-core20k-b172-dual-ai-consensus-v1',input_rows:rows.length,review_headers_valid:issues.length===0,provenance_status:'SELF_DECLARED_UNTIL_OPERATOR_VERIFICATION',global_issues:issues,dual_ai_consensus_candidates:approved,semantic_certified:0,staging_review_required:rows.length-approved,production_ready:0,items},null,2));
process.exitCode=issues.length||items.some(x=>x.reasons.includes('STAGING_SAFETY_VIOLATION'))?1:0;
