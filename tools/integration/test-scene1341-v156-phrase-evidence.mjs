/* CG-MAIN V156 evidence-only QA. Never construct phrase IPA from token fragments. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const COMMIT='48f98bac70d9962df56a1d1a7aee014d9215bc15';
const FILE='tools/scene1341_master/qa_reports/CGMASTER_V156_SC0011_0014_548_PHRASE_COMPONENT_FULL_EVIDENCE_20261114.json';
const BLOB='844a3db9efa4bedf3788075c8c5a393887813fc5';
const SOURCE='4d03b6cba283744756c57ff661c2c6cbfe34fcf8ff513a966576cf7d97e91a99';
const URL='https://raw.githubusercontent.com/TJPAI/pai-word/'+COMMIT+'/'+FILE;
export function auditV156PhraseEvidence(raw){
 const bytes=Buffer.from(raw,'utf8');
 assert.equal(createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),BLOB);
 const data=JSON.parse(raw);
 assert.equal(data.version,'V156');
 assert.equal(data.source_sha256,SOURCE);
 assert.equal(data.release_allowed,false);
 assert.equal(data.records?.length,548);
 assert.equal(data.counts?.ALL_COMPONENTS_SOME_IPA_EVIDENCE_ONLY,6);
 assert.equal(data.counts?.PARTIAL_COMPONENT_EVIDENCE_ONLY,200);
 assert.equal(data.counts?.NO_COMPONENT_EVIDENCE,342);
 const ids=new Set(),rows=new Set(),counts={};
 for(const r of data.records){
  assert.match(r.scene_id,/^SC50-001[1-4]$/);
  assert.match(r.record_id,/^SC1341-FINAL-SRC-[a-f0-9]{32}$/);
  assert(Number.isSafeInteger(r.source_final_row)&&r.source_final_row>=2380&&r.source_final_row<=3375);
  assert(!ids.has(r.record_id)&&!rows.has(r.source_final_row),'crosswalk Master identity duplicate');
  ids.add(r.record_id);rows.add(r.source_final_row);
  assert(typeof r.expression==='string'&&r.expression.trim());
  assert.equal(r.phrase_ipa,null,'No synthetic whole-phrase IPA may be released');
  assert.equal(r.canonical_sense_id,null);
  assert.equal(r.qa_approved,false);
  assert.equal(r.release_allowed,false);
  assert(Array.isArray(r.components)&&r.components.length>=1);
  let known=0;
  for(const c of r.components){
   assert(typeof c.token==='string'&&c.token);
   assert(Array.isArray(c.ipa_variants));
   assert(Array.isArray(c.source_lines));
   assert(Array.isArray(c.source_record_ids));
   if(c.ipa_variants.length){
    known++;
    assert(c.source_lines.length&&c.source_record_ids.length,'token IPA must cite source');
    for(const v of c.ipa_variants)assert(/^\/[^/]+\/$/.test(v));
    for(const n of c.source_lines)assert(Number.isSafeInteger(n)&&n>0);
    for(const id of c.source_record_ids)assert.match(id,/^SC1341-FINAL-SRC-[a-f0-9]{32}$/);
   }else assert.equal(c.source_lines.length,0,'unknown token may not claim IPA lines');
  }
  if(r.status==='ALL_COMPONENTS_SOME_IPA_EVIDENCE_ONLY')assert.equal(known,r.components.length);
  else if(r.status==='PARTIAL_COMPONENT_EVIDENCE_ONLY')assert(known>0&&known<r.components.length);
  else {assert.equal(r.status,'NO_COMPONENT_EVIDENCE');assert.equal(known,0);}
  counts[r.status]=(counts[r.status]||0)+1;
 }
 assert.deepEqual(counts,data.counts);
 return {status:'PASS',audited:548,allComponents:6,partial:200,noComponents:342,phraseIpaSelected:0,ready:0,formalRelease:false,srsWrites:0,sourceBlob:BLOB};
}
if(import.meta.url===pathToFileURL(process.argv[1]).href){
 const response=await fetch(URL,{cache:'no-store'});
 assert(response.ok,'V156 pinned source HTTP '+response.status);
 console.log(JSON.stringify(auditV156PhraseEvidence(await response.text())));
}
