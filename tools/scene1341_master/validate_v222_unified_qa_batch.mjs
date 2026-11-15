import fs from 'node:fs';
import assert from 'node:assert/strict';
const root='tools/scene1341_master/qa_reports/';
const load=n=>JSON.parse(fs.readFileSync(root+n,'utf8'));
const a=load('CGMASTER_V214_11_SCENE_FIT_BILINGUAL_EXAMPLE_QA_HANDOFF_20261115.json');
const b=load('CGMASTER_V220_27_SOURCE_PROVENANCE_RECONCILED_QA_LEDGER_20261115.json');
const c=load('CGMASTER_V221_38_RECORD_UNIFIED_BILINGUAL_QA_BATCH_20261115.json');
const byId=new Map();
for(const x of a.records){assert(!byId.has(x.record_id));byId.set(x.record_id,{kind:'native',row:x});}
for(const x of b.records){assert(!byId.has(x.record_id));byId.set(x.record_id,{kind:'editorial',row:x});}
assert.equal(byId.size,38);assert.equal(c.records.length,38);
const seen=new Set();let pairs=0, withExamples=0, holds=0;
for(const x of c.records){
 assert(!seen.has(x.record_id),'duplicate record');seen.add(x.record_id);
 const y=byId.get(x.record_id);assert(y,'unknown record');
 assert.equal(x.source_final_row,y.row.source_final_row);assert.equal(x.expression,y.row.expression);
 assert.equal(x.qa_stage,'待审');assert.equal(x.formal_ready,0);assert.equal(x.release_allowed,false);
 assert.equal(x.qa_reviewer,null);assert.equal(x.approved_content_hash,null);
 assert(Number.isInteger(x.native_source_line)&&x.native_source_line>0);
 assert.equal(x.source_kind,y.kind==='native'?'KAIKKI_NATIVE_EXAMPLE_WITH_EDITORIAL_TRANSLATION':'CGMASTER_ORIGINAL_EDITORIAL_EXAMPLE_NOT_KAIKKI');
 if(y.kind==='native'){
  assert.equal(x.native_source_line,y.row.native_source_line);
  assert.deepEqual(x.examples,y.row.examples.map(e=>({en:e.example_en,zh:e.translation_zh_draft})));
 }else{
  assert.equal(x.native_source_line,y.row.proposed_native_source_line);
  assert.deepEqual(x.examples,y.row.example_en?[{en:y.row.example_en,zh:y.row.example_zh}]:[]);
  assert.equal(x.prior_native_source_line,y.row.prior_native_source_line);
  assert.equal(Boolean(x.hold),y.row.decision.startsWith('HOLD'));
 }
 for(const ex of x.examples){assert(ex.en?.trim()&&ex.zh?.trim());pairs++;}
 if(x.examples.length)withExamples++;
 if(x.hold)holds++;
}
assert.equal(withExamples,35);assert.equal(pairs,36);assert.equal(holds,4);
assert.equal(c.counts.total,38);assert.equal(c.counts.with_examples,35);assert.equal(c.counts.example_pairs,36);
console.log('V222 PASS: 38 records, 35 with examples, 36 pairs, 4 HOLD; provenance and release gates intact');
