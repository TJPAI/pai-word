#!/usr/bin/env node
// Convert audited ENTEACH blocks into a source-safe, prioritized production queue.
// Never guesses a missing field or changes Master.
import fs from 'node:fs';
const file=process.argv[2];
if(!file||!fs.existsSync(file))throw Error('usage: triage_enteach_blockers.mjs <blocked.jsonl>');
const records=fs.readFileSync(file,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);
const seen=new Set(),counts={},sceneCounts={},queue=[];
for(const r of records){
 const key=r.scene_id+':'+r.source_final_row;
 if(seen.has(key))throw Error('duplicate frozen identity '+key);
 seen.add(key);
 const missing=[...(r.missing_ipa?['ipa_candidate']:[]),...(r.missing_fields||[])];
 const conflicts=r.conflicting_fields||[];
 const reason=r.reason||null;
 const classification=reason?'IDENTITY_HOLD':conflicts.length?'CONFLICT_HOLD':missing.length===1?'SINGLE_FIELD_EVIDENCE_REQUIRED':'MULTI_FIELD_EVIDENCE_REQUIRED';
 counts[classification]=(counts[classification]||0)+1;
 sceneCounts[r.scene_id]=(sceneCounts[r.scene_id]||0)+1;
 // Only source-backed completion; conflicts and identity mismatches require human review.
 queue.push({scene_id:r.scene_id,source_final_row:r.source_final_row,expression:r.expression,classification,missing_fields:missing,conflicting_fields:conflicts,reason,priority:classification==='SINGLE_FIELD_EVIDENCE_REQUIRED'?1:classification==='MULTI_FIELD_EVIDENCE_REQUIRED'?2:3});
}
queue.sort((a,b)=>a.priority-b.priority||a.missing_fields.length-b.missing_fields.length||a.scene_id.localeCompare(b.scene_id)||a.source_final_row-b.source_final_row);
const output=file.replace(/\.jsonl$/,'-triage.jsonl');
fs.writeFileSync(output,queue.map(x=>JSON.stringify(x)).join('\n')+(queue.length?'\n':''));
const report={records:records.length,classification_counts:counts,scene_counts:sceneCounts,priority_queue:output,publication:'NONE_SOURCE_EVIDENCE_REQUIRED'};
console.log(JSON.stringify(report,null,2));
