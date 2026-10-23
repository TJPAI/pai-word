// Audit editorial scene suggestions without confusing identity QA for semantic evidence.
import fs from 'node:fs';
const [input,output]=process.argv.slice(2);
if(!input||!output)throw Error('USAGE: audit-chat-candidate-evidence.mjs input.json output.json');
const data=JSON.parse(fs.readFileSync(input,'utf8'));
if(!Array.isArray(data.edges)||data.production_ready!==false)throw Error('INVALID_EDITORIAL_CANDIDATE_DATA');
const weak=/直接涉及的概念、对象或活动|需复核具体词义|仅提及「.+」的其他语境/u;
const keys=new Set(),rows=[];
for(const e of data.edges){
 const k=JSON.stringify([e.term_id,e.scene_id]);
 if(keys.has(k)||e.release_eligible!==false)throw Error('DUPLICATE_OR_UNSAFE_EDGE');
 keys.add(k);
 const templated=weak.test(e.rationale_zh??'')||weak.test(e.counterexample_zh??'');
 rows.push({term_id:e.term_id,term:e.term,scene_id:e.scene_id,
  evidence_quality:templated?'GENERIC_TEMPLATE_INSUFFICIENT':'EDITORIAL_REASON_NEEDS_SEMANTIC_REVIEW',
  release_eligible:false});
}
const result={schema:'scene500-chat-candidate-evidence-audit-v0.1',status:'NON_CERTIFIED',
 total:rows.length,templated:rows.filter(x=>x.evidence_quality==='GENERIC_TEMPLATE_INSUFFICIENT').length,
 certified:0,rows};
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({total:result.total,templated:result.templated,certified:0}));
