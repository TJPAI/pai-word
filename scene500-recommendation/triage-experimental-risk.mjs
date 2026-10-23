// Deterministic risk triage for previously generated candidate-only compound edges.
import fs from 'node:fs';
import crypto from 'node:crypto';
const [input,output]=process.argv.slice(2);
if(!input||!output)throw Error('USAGE: triage-experimental-risk.mjs source.json output.json');
const bytes=fs.readFileSync(input),d=JSON.parse(bytes);
if(d.schema!=='scene500-experimental-compound-extension-v0.1'||d.status!=='EXPERIMENTAL_NOT_APPROVED'||d.production_ready!==false||!Array.isArray(d.candidates))throw Error('INVALID_INPUT');
const groups={blocked:[],priority_manual_review:[],manual_review:[]};
for(const c of d.candidates){
 if(c.release_eligible!==false||c.status!=='EXPERIMENTAL_UNVERIFIED')throw Error('UNSAFE_INPUT');
 const term=c.term,anchor=c.anchor_term,flags=[];
 if(/^(不|非|无|反|未|失)/u.test(term)&&!/^(不|非|无|反|未|失)/u.test(anchor))flags.push('NEGATION_OR_SEMANTIC_REVERSAL');
 if(/(国|政府|主义|国家|地区|省|市)$/u.test(term))flags.push('NAMED_ENTITY_OR_ABSTRACT_INSTITUTION');
 if(anchor.length/term.length<.6)flags.push('SHORT_ANCHOR');
 const lane=flags.includes('NEGATION_OR_SEMANTIC_REVERSAL')?'blocked':flags.length?'manual_review':'priority_manual_review';
 groups[lane].push({...c,risk_flags:flags,risk_lane:lane});
}
const out={schema:'scene500-experimental-risk-triage-v0.1',status:'RISK_TRIAGE_NOT_APPROVED',
 source_sha256:crypto.createHash('sha256').update(bytes).digest('hex'),
 input_links:d.candidates.length,input_terms:new Set(d.candidates.map(x=>x.term_id)).size,
 blocked_links:groups.blocked.length,priority_manual_review_links:groups.priority_manual_review.length,
 manual_review_links:groups.manual_review.length,
 production_ready:false,requires_opt_in:true,
 candidates:[...groups.blocked,...groups.priority_manual_review,...groups.manual_review]};
fs.writeFileSync(output,JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({blocked:out.blocked_links,priority:out.priority_manual_review_links,manual:out.manual_review_links}));
