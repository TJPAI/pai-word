/* CG-MAIN: source-pinned, read-only V157 IPA integrity audit.
 * Fragment, phonetic-only and Sense-unresolved readings must never be released.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const COMMIT='276fa8f165772a98b4f2f9baa2df52aa6b3a81b3';
const FILE='tools/scene1341_master/qa_reports/CGMASTER_V157_SC0011_0014_243_IPA_INTEGRITY_FULL_AUDIT_20261114.json';
const BLOB='d5d862c2b1f6217ef5cc7ab3eff40b3cd4712b89';
const ARCHIVE='4d03b6cba283744756c57ff661c2c6cbfe34fcf8ff513a966576cf7d97e91a99';
const URL='https://raw.githubusercontent.com/TJPAI/pai-word/'+COMMIT+'/'+FILE;
const EXPECTED={
 MULTIPLE_FULL_READINGS_NEED_ADJUDICATION:86,
 REGION_UNIQUE_TEST_CANDIDATE_REQUIRES_SENSE_QA:140,
 NO_PHONEMIC_IPA_ONLY_PHONETIC_OR_MISSING:4,
 CONTAINS_FRAGMENT_KEEP_FULL_VARIANTS_ONLY:12,
 POS_DIFFERENT_READINGS_NEED_TARGET_SENSE:1
};
export function auditV157IpaIntegrity(raw){
 const bytes=Buffer.from(raw,'utf8');
 assert.equal(createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),BLOB,'V157 blob changed');
 const d=JSON.parse(raw);
 assert.equal(d.version,'V157');
 assert.equal(d.input_version,'V155');
 assert.equal(d.source_sha256,ARCHIVE);
 assert.equal(d.formal_ready,0);
 assert.equal(d.release_allowed,false);
 assert.equal(d.records?.length,243);
 assert.deepEqual(d.counts,EXPECTED);
 const ids=new Set(),rows=new Set(),categoryCounts={};
 for(const r of d.records){
  assert.match(r.scene_id,/^SC50-001[1-4]$/);
  assert.match(r.record_id,/^SC1341-FINAL-SRC-[0-9a-f]{32}$/);
  assert(Number.isSafeInteger(r.source_final_row)&&r.source_final_row>=2380&&r.source_final_row<=3375);
  assert(!ids.has(r.record_id)&&!rows.has(r.source_final_row),'Master identity collision');
  ids.add(r.record_id);rows.add(r.source_final_row);
  assert(typeof r.expression==='string'&&r.expression.trim().length);
  assert.equal(r.canonical_sense_id,null);
  assert.equal(r.qa_approved,false);
  assert.equal(r.release_allowed,false);
  assert(['HOLD_MULTI_IPA','AMERICAN_ACCENT_TEST_CANDIDATE_NOT_READY'].includes(r.v155_status));
  assert(Array.isArray(r.fragment_ipa));
  assert(Array.isArray(r.complete_phonemic_ipa_variants));
  assert(Array.isArray(r.source_evidence));
  assert(typeof r.evidence_pos_variants==='object'&&r.evidence_pos_variants!==null);
  for(const v of r.complete_phonemic_ipa_variants){
   assert(/^\/[^/]+\/$/.test(v));
   assert(!r.fragment_ipa.includes(v),'A fragment cannot be a full pronunciation');
  }
  for(const e of r.source_evidence){
   assert(typeof e.ipa==='string');
   assert(typeof e.pos==='string'&&e.pos);
   assert(Number.isSafeInteger(e.line)&&e.line>0);
   assert(Array.isArray(e.tags));
  }
  assert(Object.hasOwn(EXPECTED,r.integrity_category));
  categoryCounts[r.integrity_category]=(categoryCounts[r.integrity_category]||0)+1;
  if(r.integrity_category==='NO_PHONEMIC_IPA_ONLY_PHONETIC_OR_MISSING')assert.equal(r.complete_phonemic_ipa_variants.length,0);
  if(r.integrity_category==='CONTAINS_FRAGMENT_KEEP_FULL_VARIANTS_ONLY')assert(r.fragment_ipa.length>0);
  if(r.integrity_category==='REGION_UNIQUE_TEST_CANDIDATE_REQUIRES_SENSE_QA'){
   assert(r.v155_ipa_candidate!==null);
   assert(r.complete_phonemic_ipa_variants.includes(r.v155_ipa_candidate),'selected test candidate must be a complete IPA');
  }
 }
 assert.deepEqual(categoryCounts,EXPECTED);
 return {status:'PASS',audited:243,...EXPECTED,formalReady:0,release:false,selectedNewIPA:0,srsWrites:0,sourceBlob:BLOB};
}
if(import.meta.url===pathToFileURL(process.argv[1]).href){
 const r=await fetch(URL,{cache:'no-store'});
 assert(r.ok,'V157 pinned source HTTP '+r.status);
 console.log(JSON.stringify(auditV157IpaIntegrity(await r.text())));
}
