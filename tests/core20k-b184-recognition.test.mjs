import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fromJsonl,validatePack,publicQuestion,revealAnswer,shuffledChoices,CASE_POLICY,SCHEMA} from '../rebuild-preview/b184-recognition/contract.mjs';
const file=new URL('../rebuild-preview/b184-recognition/candidates-b184.jsonl',import.meta.url);
const records=fromJsonl(fs.readFileSync(file,'utf8')).records;
const clone=v=>structuredClone(v);
test('four raw B184 candidates validate without registered KU or sense IDs',()=>{
 assert.equal(records.length,4);
 for(const r of records){assert.equal(r.ku_id,null);assert.equal(r.sense_id,null);assert.equal(r.srs_write_allowed,false);}
});
test('exactly four unique choices and exactly one canonical answer',()=>{
 for(const r of records){assert.equal(r.question.choices.length,4);assert.equal(new Set(r.question.choices).size,4);assert.equal(r.question.choices.filter(x=>x===r.response.canonical_answer).length,1)}
});
test('Fisher-Yates actually changes order and does not mutate originals',()=>{
 const original=records[0].question.choices.slice();
 const moved=shuffledChoices(original,()=>0);
 assert.notDeepEqual(moved,original);
 assert.deepEqual(records[0].question.choices,original);
 assert.deepEqual(new Set(moved),new Set(original));
});
test('pre-answer public question excludes canonical answer and examples as separate fields',()=>{
 for(const r of records){
  const shown=publicQuestion(r,()=>0);
  assert.deepEqual(Object.keys(shown).sort(),['choices','id','prompt']);
  assert.equal(shown.prompt.includes(r.response.canonical_answer),false);
  assert.equal(JSON.stringify(shown).includes(r.question.context_en_after_answer),false);
  assert.equal(JSON.stringify(shown).includes(r.question.context_zh_after_answer),false);
 }
});
test('post-answer feedback reveals canonical answer and bilingual examples; never scores SRS',()=>{
 for(const r of records){
  let result=revealAnswer(r,r.response.canonical_answer);
  assert.equal(result.correct,true);
  assert.equal(result.answer,r.response.canonical_answer);
  assert.equal(result.example_en,r.question.context_en_after_answer);
  assert.equal(result.example_zh,r.question.context_zh_after_answer);
  assert.equal(result.scoring_mode,CASE_POLICY);
  assert.equal(result.srs_write_allowed,false);
  result=revealAnswer(r,r.question.choices.find(x=>x!==r.response.canonical_answer));
  assert.equal(result.correct,false);
 }
});
test('rejects unsafe release flags, malformed choices and identity registration',()=>{
 const base={schema_version:SCHEMA,test_only:true,release_eligible:false,srs_write_allowed:false,records:clone(records)};
 const mutations=[
  p=>p.release_eligible=true,
  p=>p.srs_write_allowed=true,
  p=>p.records[0].ku_id='real-ku',
  p=>p.records[0].question.choices[1]=p.records[0].question.choices[0],
  p=>p.records[0].response.canonical_answer='not an option',
  p=>p.records[0].question.context_visibility='BEFORE_ANSWER',
  p=>p.records[0].question.text+=' '+p.records[0].response.canonical_answer,
  p=>p.records[0].semantic_certification='PRODUCTION_READY'
 ];
 for(const mutate of mutations){const p=clone(base);mutate(p);assert.throws(()=>validatePack(p))}
});
test('standalone preview cannot load official app/SRS or store results',()=>{
 const html=fs.readFileSync(new URL('../rebuild-preview/b184-recognition/index.html',import.meta.url),'utf8');
 assert.ok(html.includes('publicQuestion(')&&html.includes('revealAnswer('));
 for(const forbidden of ['localStorage','sessionStorage','indexedDB','PAI_CORE','PAI_TAP_FLOW','scheduleRecord(','fetch(\'../data/core20k-runtime','PAI_KU_DURABLE']){
   assert.equal(html.includes(forbidden),false,forbidden);
 }
});
