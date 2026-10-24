// Run: node zh-core20k/qa/validate-compositional-evidence.mjs <review.json> <runtime.json>
// Read-only QA: checks identity and prevents promoting supporting/contextual citations to headword evidence.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const validGrades=new Set(['DIRECT_DICTIONARY_HEADWORD','COMPONENT_DICTIONARY_USAGE_ONLY','COMPONENT_USAGE_ONLY','LONGER_IDIOM_ONLY','LONGER_CONSTRUCTION_ONLY','NEAR_FORM_NOT_EQUIVALENT','AI_TRIAGE_ONLY']);
export function validateEvidence(review,runtime){
 const errors=[],terms=new Map((runtime?.terms||[]).map(t=>[t.term,t]));
 if(review?.input_runtime_sha256!=='18adea58a3615935c1b632c22934a91855171063862f7471999f9900415e8093')errors.push('UNEXPECTED_RUNTIME_BASELINE');
 const seen=new Set();
 for(const r of review?.records||[]){
   if(seen.has(r.term))errors.push('DUPLICATE_REVIEW:'+r.term);seen.add(r.term);
   const t=terms.get(r.term);
   if(!t||t.term_id!==r.term_id||r.term_id!=='zh_'+createHash('sha256').update(r.term).digest('hex').slice(0,20))errors.push('IDENTITY_MISMATCH:'+r.term);
   if(!validGrades.has(r.evidence_grade))errors.push('INVALID_GRADE:'+r.term);
   if(r.evidence_grade==='DIRECT_DICTIONARY_HEADWORD'&&!/^https:\/\//.test(r.source||''))errors.push('DIRECT_ENTRY_MISSING_URL:'+r.term);
   if(r.action?.startsWith('DELETE')||r.action?.startsWith('REPLACE'))errors.push('UNAUTHORIZED_MUTATION:'+r.term);
 }
 if(seen.size!==7)errors.push('EXPECTED_SEVEN_REVIEW_ROWS');
 return {ok:errors.length===0,reviewed:seen.size,errors};
}
if(process.argv[1]?.endsWith('validate-compositional-evidence.mjs')){
 const [reviewPath,runtimePath]=process.argv.slice(2);
 if(!reviewPath||!runtimePath)throw Error('Provide review.json and runtime.json');
 const bytes=fs.readFileSync(runtimePath);
 const sha=createHash('sha256').update(bytes).digest('hex');
 const review=JSON.parse(fs.readFileSync(reviewPath,'utf8'));
 const result=validateEvidence(review,JSON.parse(bytes.toString('utf8')));
 if(sha!==review.input_runtime_sha256){result.ok=false;result.errors.push('RUNTIME_FILE_SHA_MISMATCH');}
 console.log(JSON.stringify(result,null,2));
 if(!result.ok)process.exitCode=1;
}
