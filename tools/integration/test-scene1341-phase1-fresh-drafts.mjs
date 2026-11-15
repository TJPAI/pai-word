import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {validatePhase1FreshManifest,validatePhase1DraftRows,fetchPhase1FreshDrafts}
 from '../../rebuild-preview/scene1341-readonly/scene1341-phase1-fresh-drafts.mjs';
const V=['V199','V200','V201'],N=[35,55,61];
const counts=[79,40,13,12,7],sceneIds=counts.flatMap((n,i)=>Array(n).fill('SC50-000'+(i+1)));
const rawSource='4d03b6cba283744756c57ff661c2c6cbfe34fcf8ff513a966576cf7d97e91a99';
const rows=sceneIds.map((scene_id,i)=>({record_id:'SC1341-FINAL-SRC-'+(i+1).toString(16).padStart(32,'0'),
 scene_id,source_final_row:i+1,content_sha256:'a'.repeat(64),
 question_page:{english_expression:'test expression',cue_zh:'中文'},
 answer_page:{meaning_zh:'中文'},
 source_evidence:{archive_sha256:rawSource},qa_stage_label:'待审',qa_first_review_verdict:null,
 formal_ready:0,srs_eligible:false,release_allowed:false}));
const inputs=[],version_batches=[];
for(let i=0,j=0;i<3;i++){
 const payload={version:V[i],records:rows.slice(j,j+N[i])};
 j+=N[i];inputs.push(payload);
 const raw=JSON.stringify(payload);
 const sha=createHash('sha1').update('blob '+Buffer.byteLength(raw)+'\0').update(raw).digest('hex');
 version_batches.push({version:V[i],records:N[i],first_reviewed:0,
  git_blob_sha1:sha,path:'tools/scene1341_master/qa_reports/CGMASTER_'+V[i]+'_PHASE1_TEST.json'});
}
const manifest={version:'V201',original_associations:1241,native_kaikki_raw_sha256:rawSource,
 cumulative:{source_linked_editor_candidates_distinct:151,qa_first_reviewed:0,formal_ready:0,srs_eligible:false},
 version_batches,per_scene:Object.fromEntries(counts.map((n,i)=>['SC50-000'+(i+1),{editor_drafts:n}]))};
assert.equal(validatePhase1FreshManifest(manifest).records,151);
let result=validatePhase1DraftRows(manifest,inputs);
assert.equal(result.rows.length,151);assert.equal(result.canWriteSrs,false);assert.equal(result.perScene['SC50-0005'],7);
const altered=structuredClone(inputs);altered[0].records[0].qa_stage_label='1审';
assert.throws(()=>validatePhase1DraftRows(manifest,altered),/PHASE1_FRESH_ROW/);
const dup=structuredClone(inputs);dup[2].records[0].record_id=dup[1].records[0].record_id;
assert.throws(()=>validatePhase1DraftRows(manifest,dup),/PHASE1_FRESH_ROW/);
const callResponses=[JSON.stringify(manifest),...inputs.map(x=>JSON.stringify(x))];
const commit='f'.repeat(40),urls=[];
const fetched=await fetchPhase1FreshDrafts({commit,fetchImpl:async url=>{
 urls.push(url);return new Response(callResponses[urls.length-1],{status:200});
}});
assert.equal(fetched.verifiedBlobCount,3);assert.equal(fetched.unreviewed,151);
assert.equal(fetched.commit,commit);assert.equal(urls.length,4);
assert(urls.every(x=>x.includes('/'+commit+'/')));
await assert.rejects(()=>fetchPhase1FreshDrafts({commit,fetchImpl:async url=>{
 if(url.includes('FIRST151'))return new Response(JSON.stringify({...manifest,version_batches:[{...version_batches[0],git_blob_sha1:'0'.repeat(40)},...version_batches.slice(1)]}),{status:200});
 return new Response(JSON.stringify(inputs[0]),{status:200});
}}),/PHASE1_FRESH_GIT_BLOB_SHA1/);
console.log('PASS V199/V200/V201 fresh first151 immutable Git SHA1 and phase1 rows, independent QA pending, SRS0');
