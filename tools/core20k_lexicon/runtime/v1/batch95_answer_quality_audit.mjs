// Batch95: independent checks for answer ambiguity and certificate integrity.
// Open-ended Chinese responses must NOT be auto-scored by exact string matching.
import fs from 'node:fs';import assert from 'node:assert/strict';
const base=new URL('.',import.meta.url);
const pack=JSON.parse(fs.readFileSync(new URL('batch93_nonrelease_teaching_pack.json',base),'utf8'));
const cases={person:['人','一个人','个人'],time:['时间','时长'],know:['知道','了解'],people:['人们','人'],talk:['交谈','说话'],here:['这里','到这里']};
const report=[];
for(const r of pack.records){
 const answers=cases[r.headword];assert(answers);
 const issues=[];
 if(r.prompt.includes('what does')&&r.certificate?.assessment_type?.includes('short answer'))issues.push('OPEN_RESPONSE_REQUIRES_SEMANTIC_SCORER');
 if(!r.source_attribution?.length)issues.push('MISSING_DICTIONARY_REFERENCE');
 if(r.content_certified===true||r.production_ready===true)issues.push('UNSAFE_STAGING_STATUS');
 report.push({ku_id:r.ku_id,headword:r.headword,acceptable_chinese_examples:answers,assessment_mode:'HUMAN_OR_SEMANTIC_REVIEW_ONLY',automatic_exact_match_allowed:false,issues});
}
assert.equal(report.length,6);assert(report.every(x=>x.issues.includes('OPEN_RESPONSE_REQUIRES_SEMANTIC_SCORER')));
fs.writeFileSync(new URL('batch95_answer_quality_review.json',base),JSON.stringify({schema:'pai-core20k-batch95-qa',records:report,certified_human:0,production_ready:0},null,2)+'\n');
console.log('PASS: six open-answer risks identified, no unsafe exact-string grading');
