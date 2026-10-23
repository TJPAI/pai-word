// Batch88: bulk candidate-risk grouping on existing Core13K Sense KU JSONL.
// This script never authorizes Content Certified or Production Ready.
// Usage: node batch88-bulk-sense-triage.mjs <eligible_structure_pool.jsonl> <out.jsonl>
import fs from 'node:fs';import assert from 'node:assert/strict';
const [src,dest]=process.argv.slice(2);if(!dest)throw Error('usage: node batch88-bulk-sense-triage.mjs pool.jsonl out.jsonl');
const data=fs.readFileSync(src,'utf8').trim().split('\n').map(JSON.parse);
assert.equal(data.length,5438);
const byHead=new Map();let withExample=0,legacySpotcheck=0;
for(const row of data){
 if(row.example_en)withExample++;
 if(row.legacy_ku_status==='dictionary_verified_spotcheck')legacySpotcheck++;
 const issues=[];
 if(!row.example_en)issues.push('SENSE_ALIGNED_EXAMPLE_REQUIRED');
 if(!String(row.legacy_ku_status).includes('dictionary_verified'))issues.push('DIRECT_SENSE_EVIDENCE_REQUIRED');
 if(!/dictionary_verified|cambridge_us_verified/.test(row.legacy_pronunciation_status||''))issues.push('IPA_POS_SOURCE_REQUIRED');
 if(/[ˈˌ]/.test(row.legacy_us_ipa||''))issues.push('IPA_STRESS_BOUNDARY_CHECK');
 if(['device','pride','revise'].includes(row.headword))issues.push('TEACHING_FIRST_SENSE_REVIEW');
 const r={...row,review_issues:issues,content_certified:false,production_ready:false,teaching_first_sense_approved:false};
 if(!byHead.has(row.headword_id))byHead.set(row.headword_id,[]);
 byHead.get(row.headword_id).push(r);
}
assert.equal(byHead.size,3851);assert.equal(withExample,442);assert.equal(legacySpotcheck,29);
const shortlist=[...byHead.values()].map(group=>{
 const g=[...group].sort((a,b)=>(!!b.example_en-!!a.example_en)||(a.review_issues.length-b.review_issues.length)||a.ku_id.localeCompare(b.ku_id));
 return {...g[0],candidate_senses_in_filtered_pool:g.length};
}).sort((a,b)=>(!!b.example_en-!!a.example_en)||(a.review_issues.length-b.review_issues.length)||a.rank-b.rank).slice(0,200);
assert.equal(shortlist.length,200);assert.equal(new Set(shortlist.map(x=>x.headword_id)).size,200);
fs.writeFileSync(dest,shortlist.map(x=>JSON.stringify(x)).join('\n')+'\n');
console.log(JSON.stringify({pool:data.length,headwords:byHead.size,examples:withExample,spotcheck:legacySpotcheck,shortlist:shortlist.length,L2:0}));
