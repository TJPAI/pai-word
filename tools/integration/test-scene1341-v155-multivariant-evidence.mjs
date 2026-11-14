/* CG-MAIN V155: independently validate CG-MASTER's 243 multivariant IPA decisions.
 * Evidence audit ONLY. Never mount regional candidates into question pages or SRS.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const MASTER_COMMIT='919e2fef1005846ea2192a810e356d2ce51643ec';
const PATH='tools/scene1341_master/qa_reports/CGMASTER_V155_SC0011_0014_243_MULTIVARIANT_FULL_EVIDENCE_20261114.json';
const BLOB='9de667e851abd86989e9979f4e8bf0ab87cb55c9';
const ARCHIVE='4d03b6cba283744756c57ff661c2c6cbfe34fcf8ff513a966576cf7d97e91a99';
const URL='https://raw.githubusercontent.com/TJPAI/pai-word/'+MASTER_COMMIT+'/'+PATH;
export function auditV155Evidence(raw){
 const bytes=Buffer.from(raw,'utf8');
 const actual=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
 assert.equal(actual,BLOB,'V155 Git blob must remain immutable');
 const data=JSON.parse(raw);
 assert.equal(data.version,'V155');
 assert.equal(data.source_version,'V154');
 assert.equal(data.source_sha256,ARCHIVE);
 assert.equal(data.release_allowed,false);
 assert.equal(data.counts?.total,243);
 assert.equal(data.counts?.american_region_unique_test,142);
 assert.equal(data.counts?.hold,101);
 assert.equal(data.counts?.release_allowed,false);
 assert.equal(data.records?.length,243);
 const ids=new Set(),rows=new Set();let candidate=0,hold=0;
 const reasons={};
 for(const rec of data.records){
  assert.match(rec.scene_id,/^SC50-001[1-4]$/);
  assert.match(rec.record_id,/^SC1341-FINAL-SRC-[a-f0-9]{32}$/);
  assert(Number.isSafeInteger(rec.source_final_row)&&rec.source_final_row>=2380&&rec.source_final_row<=3375);
  assert(!ids.has(rec.record_id)&&!rows.has(rec.source_final_row),'duplicate authoritative Master source');
  ids.add(rec.record_id);rows.add(rec.source_final_row);
  assert.equal(rec.release_allowed,false);
  assert.equal(rec.canonical_sense_id,null);
  assert.equal(typeof rec.expression,'string');
  assert(rec.expression.trim().length>0);
  assert(Array.isArray(rec.phonemic_variants));
  assert(Array.isArray(rec.source_evidence));
  for(const e of rec.source_evidence){
   assert(/^\/[^/]+\/$/.test(e.ipa),'source IPA format');
   assert(Number.isSafeInteger(e.line)&&e.line>0,'source line');
   assert(Array.isArray(e.tags),'source region tags');
   assert(typeof e.pos==='string'&&e.pos.length>0,'source POS');
  }
  reasons[rec.selection_reason]=(reasons[rec.selection_reason]||0)+1;
  if(rec.status==='AMERICAN_ACCENT_TEST_CANDIDATE_NOT_READY'){
   candidate++;
   assert(rec.phonemic_variants.length>=1&&rec.source_evidence.length>0,'candidate evidence mandatory');
   assert(['GENERAL_AMERICAN_UNIQUE_REGION_EVIDENCE','US_UNIQUE_REGION_EVIDENCE'].includes(rec.selection_reason));
   assert(/^\/[^/]+\/$/.test(rec.ipa_candidate));
   assert(rec.phonemic_variants.includes(rec.ipa_candidate));
   assert(rec.source_evidence.some(e=>e.ipa===rec.ipa_candidate&&e.tags.some(t=>t==='General-American'||t==='US')));
  }else{
   hold++;
   assert.equal(rec.status,'HOLD_MULTI_IPA');
   assert.equal(rec.ipa_candidate,null,'HOLD must not select IPA');
   assert(['NO_UNAMBIGUOUS_AMERICAN_REGION_EVIDENCE','MULTIPLE_US_PRONUNCIATIONS_REQUIRE_POS_SENSE_REVIEW','GA_US_REGION_CONFLICT'].includes(rec.selection_reason));
  }
 }
 assert.equal(candidate,142);assert.equal(hold,101);
 assert.deepEqual(reasons,data.counts.reasons);
 return Object.freeze({records:243,regionalCandidates:142,hold:101,certified:0,ready:0,published:0,sourceBlob:BLOB});
}
if(import.meta.url===pathToFileURL(process.argv[1]).href){
 const response=await fetch(URL,{cache:'no-store'});
 assert(response.ok,'pinned V155 upstream source HTTP '+response.status);
 const result=auditV155Evidence(await response.text());
 console.log(JSON.stringify({status:'PASS',...result,productionRelease:false,srsWrites:0}));
}
