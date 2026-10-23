// Deterministic QA triage for character-overlap candidates, NEVER approval.
// Run: node scene500-recommendation/triage-semantic-candidates.mjs input.json output.json
import fs from 'node:fs';
const [input,output]=process.argv.slice(2);
if(!input||!output)throw Error('USAGE: triage-semantic-candidates.mjs input.json output.json');
const payload=JSON.parse(fs.readFileSync(input,'utf8'));
if(payload.status!=='CANDIDATE_ONLY_NOT_SEMANTICALLY_VERIFIED'||!Array.isArray(payload.candidates))throw Error('INVALID_CANDIDATE_INPUT');
const falseFriends=new Set(['企业管理','内存管理','版本控制','线上服务','教育经费','购房合同','主流媒体','不可再生能源','产业转型','研究方向','实验设备','搜索结果']);
const rows=payload.candidates.map(x=>{
 let triage,triage_reason;
 if(falseFriends.has(x.term)){triage='reject_observed_false_friend';triage_reason='known_character_overlap_counterexample';}
 else if(/^[不非无反未]/u.test(x.term)&&!x.matched_text?.startsWith(x.term[0])){
  triage='review_risk';triage_reason='possible_polarity_difference';
 }else if(x.proxy_score>=.66&&['name','aliases','actions'].includes(x.field)){
  triage='review_priority';triage_reason='strong_character_evidence_not_semantic_proof';
 }else{triage='review_risk';triage_reason='weak_character_evidence';}
 return {...x,triage,triage_reason,review_status:'candidate_review_only'};
});
const counts={input:rows.length,reject_observed_false_friend:0,review_priority:0,review_risk:0};
for(const x of rows)counts[x.triage]++;
const result={status:'TRIAGED_NOT_VERIFIED_NOT_APPROVED',baseline_unchanged:true,source:payload.source,counts,candidates:rows};
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(counts));
