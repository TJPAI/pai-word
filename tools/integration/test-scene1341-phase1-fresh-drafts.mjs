import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {validatePhase1FreshManifest,validatePhase1DraftRows,fetchPhase1FreshDrafts,fetchPhase1FreshDraftsLatest}
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

const newRows=Array.from({length:52},(_,i)=>({
 ...structuredClone(rows[0]),
 record_id:'SC1341-FINAL-SRC-'+(i+152).toString(16).padStart(32,'0'),
 source_final_row:i+152,scene_id:i<25?'SC50-0004':'SC50-0005'
}));
const latestPayload={version:'V202',source_associations_total:1241,new_records:52,records:newRows};
const latestText=JSON.stringify(latestPayload);
const latestBlob=createHash('sha1').update('blob '+Buffer.byteLength(latestText)+'\0').update(latestText).digest('hex');
const latestReport={version:'V202',original_associations:1241,prior_editor_drafts:151,new_editor_drafts:52,
 distinct_editorial_drafts_total:203,source:{fresh_kaikki_english_raw_sha256:rawSource},
 qa:{first_reviewed:0,formal_ready:0,srs_eligible:false},
 by_scene:Object.fromEntries([79,40,13,37,34].map((n,i)=>['SC50-000'+(i+1),{new_editor_drafts_total:n}])),
 artifacts:{real_full_json_git_path:'tools/scene1341_master/qa_reports/CGMASTER_V202_PHASE1_NEXT52_FRESH_KAIKKI_EDITOR_DRAFT_20261115.json',real_json_git_blob_sha1:latestBlob}};
const serveLatest=async url=>{
 if(url.includes('FIRST151'))return new Response(JSON.stringify(manifest));
 if(url.includes('FIRST203'))return new Response(JSON.stringify(latestReport));
 if(url.includes('NEXT52_FRESH'))return new Response(latestText);
 for(let i=0;i<3;i++)if(url.includes('CGMASTER_'+V[i]+'_PHASE1_TEST.json'))
  return new Response(JSON.stringify(inputs[i]));
 return new Response('not found',{status:404});
};
const latest=await fetchPhase1FreshDraftsLatest({commit,fetchImpl:serveLatest});
assert.equal(latest.rows.length,203);assert.equal(latest.verifiedBlobCount,4);
assert.equal(latest.perScene['SC50-0004'],37);assert.equal(latest.perScene['SC50-0005'],34);
assert.equal(latest.canWriteSrs,false);assert.equal(latest.onlyDiagnostic,true);
const modified=structuredClone(latestReport);modified.artifacts.real_json_git_blob_sha1='0'.repeat(40);
await assert.rejects(()=>fetchPhase1FreshDraftsLatest({commit,fetchImpl:async url=>
 url.includes('FIRST203')?new Response(JSON.stringify(modified)):serveLatest(url)
}),/PHASE1_FRESH_V202_GIT_BLOB_SHA1/);
console.log('PASS V202 incremental 203/1241, four SHA-pinned Git blobs, no review promotion or SRS');
