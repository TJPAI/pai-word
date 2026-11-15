#!/usr/bin/env node
// Read-only CG-MASTER Phase1 editor provenance/identity gate. Does NOT certify language quality.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=process.cwd();
const base='tools/scene1341_master/qa_reports/';
const files=[
 ['CGMASTER_V199_PHASE1_35_SOURCE_LINKED_EDITOR_QUESTION_ANSWER_DRAFT_20261115.json',35],
 ['CGMASTER_V200_PHASE1_NEXT55_SOURCE_LINKED_EDITOR_QUESTION_ANSWER_DRAFT_20261115.json',55],
 ['CGMASTER_V201_PHASE1_NEXT61_SOURCE_LINKED_EDITOR_QUESTION_ANSWER_DRAFT_20261115.json',61],
 ['CGMASTER_V202_PHASE1_NEXT52_FRESH_KAIKKI_EDITOR_DRAFT_20261115.json',52],
 ['CGMASTER_V203_PHASE1_NATIVE_SINGLE_SENSE_55_UNREVIEWED_20261115.json',55]
];
const rawSha='4d03b6cba283744756c57ff661c2c6cbfe34fcf8ff513a966576cf7d97e91a99';
const expected={'SC50-0001':85,'SC50-0002':46,'SC50-0003':35,'SC50-0004':46,'SC50-0005':46};
const seenRows=new Set(), seenIds=new Set(), counts={}, risks=[];
let total=0, ipa=0;
function assert(x,msg){if(!x)throw new Error(msg);}
function sha(o){return crypto.createHash('sha256').update(JSON.stringify(o,Object.keys(o).sort())).digest('hex');}
function stable(o){if(Array.isArray(o))return '['+o.map(stable).join(',')+']';if(o&&typeof o==='object')return '{'+Object.keys(o).sort().map(k=>JSON.stringify(k)+':'+stable(o[k])).join(',')+'}';return JSON.stringify(o);}
for(const [file,n] of files){
 const doc=JSON.parse(fs.readFileSync(path.join(root,base,file),'utf8'));
 assert(doc.records?.length===n,'batch count '+file);
 for(const r of doc.records){
  const tag=file+':'+r.source_final_row;
  assert(Number.isInteger(r.source_final_row)&&r.source_final_row>=1&&r.source_final_row<=1241,'invalid row '+tag);
  assert(!seenRows.has(r.source_final_row)&&!seenIds.has(r.record_id),'duplicate source identity '+tag);
  seenRows.add(r.source_final_row);seenIds.add(r.record_id);
  assert(/^SC1341-FINAL-SRC-[0-9a-f]{32}$/.test(r.record_id),'bad record_id '+tag);
  assert(/^SC1341-LEX-[0-9a-f]{24}$/.test(r.lexical_entry_id),'bad lexical_entry_id '+tag);
  assert(Object.hasOwn(expected,r.scene_id),'out-of-scope scene '+tag);
  assert(r.source_evidence?.archive_sha256===rawSha,'wrong Kaikki archive '+tag);
  assert(r.source_evidence.kaikki_lemma===r.question_page?.english_expression,'lemma mismatch '+tag);
  assert(r.source_evidence.kaikki_pos===r.answer_page?.pos,'POS mismatch '+tag);
  assert(r.source_evidence.native_gloss===r.answer_page?.gloss_en,'gloss mismatch '+tag);
  assert(Number.isInteger(r.source_evidence.kaikki_exact_raw_line)&&r.source_evidence.kaikki_exact_raw_line>0,'source line missing '+tag);
  assert(Number.isInteger(r.source_evidence.sense_index_zero_based)&&r.source_evidence.sense_index_zero_based>=0,'sense index missing '+tag);
  assert(r.qa_stage_label==='待审'&&r.qa_first_review_verdict===null&&r.qa_reviewed_content_sha256===null,'author QA self-promotion '+tag);
  assert(r.formal_ready===0&&r.srs_eligible===false&&r.release_allowed===false,'release violation '+tag);
  assert(r.answer_page.answer_complete===false,'premature answer complete '+tag);
  assert(r.answer_page.examples?.every(e=>(e.source==='CG_MASTER_NEW_EDITOR_ORIGINAL_NOT_KAIKKI_ATTESTATION'||(e.source==='KAIKKI_NATIVE_EXAMPLE_UNTRANSLATED'&&e.example_zh===null))&&e.qa_status==='待审'),'unsourced example promotion '+tag);
  assert(Array.isArray(r.answer_page.collocations)&&r.answer_page.collocations.length===0,'unsupported collocations '+tag);
  assert(Array.isArray(r.answer_page.synonyms)&&r.answer_page.synonyms.length===0,'unsupported synonyms '+tag);
  assert(Array.isArray(r.answer_page.antonyms)&&r.answer_page.antonyms.length===0,'unsupported antonyms '+tag);
  const {content_sha256,...payload}=r;
  const actual=crypto.createHash('sha256').update(stable(payload)).digest('hex');
  assert(actual===content_sha256,'content sha mismatch '+tag);
  const variants=r.question_page.ipa_native_all_phonemic_candidates;
  assert(JSON.stringify(variants)===JSON.stringify(r.source_evidence.native_ipa_candidates),'IPA source mismatch '+tag);
  if(r.question_page.ipa!==null){
   assert(variants.length===1&&variants[0]===r.question_page.ipa,'unsourced IPA '+tag);ipa++;
  }else if(variants.length===1)risks.push({row:r.source_final_row,reason:'single IPA candidate unselected'});
  counts[r.scene_id]=(counts[r.scene_id]||0)+1;total++;
 }
}
assert(total===258,'cumulative count mismatch');
for(const [s,n] of Object.entries(expected))assert(counts[s]===n,'scene count '+s);
const state=JSON.parse(fs.readFileSync('tools/scene1341_master/CGMASTER_CURRENT_STATE.json','utf8'));
assert(state.phase1.fresh_editorial_drafts===total&&state.phase1.remaining_without_fresh_editorial_draft===1241-total,'checkpoint drift');
console.log(JSON.stringify({status:'PASS_PROVENANCE_ONLY_NOT_QA',total,counts,provisional_ipa:ipa,risks},null,2));
