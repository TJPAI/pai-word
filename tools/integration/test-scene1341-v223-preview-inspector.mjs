import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {
 selectPreviewPayloadArtifact,validatePreviewPayload,
 previewV223Row,fetchCurrentPreviewPayload
} from '../../rebuild-preview/scene1341-readonly/scene1341-v223-preview-inspector.mjs';
const path='tools/scene1341_master/qa_reports/CGMASTER_V223_38_PREVIEW_QUESTION_ANSWER_PAGE_PAYLOADS_20261115.json';
const stale='tools/scene1341_master/qa_reports/CGMASTER_V219_38_PREVIEW_QUESTION_ANSWER_PAGE_PAYLOADS_20261115.json';
const state={schema:'cgmaster-current-state/v1',role:'CG-MASTER',
 branch:'cg-master-kaikki-evidence-intake-20261111',
 phase1:{original_source_associations:1241,editorial_artifacts:[stale,path]}};
const selected=selectPreviewPayloadArtifact(state);
assert.deepEqual(selected,{path,version:223,expected:38});
assert.equal(selectPreviewPayloadArtifact({...state,phase1:{...state.phase1,editorial_artifacts:[]}}),null);
assert.throws(()=>selectPreviewPayloadArtifact({...state,role:'CG-QA'}),/MASTER_PREVIEW_STATE/);
const records=Array.from({length:38},(_,i)=>({
 source_final_row:i+20,
 record_id:'SC1341-FINAL-SRC-'+(i+1).toString(16).padStart(32,'0'),
 scene_id:'SC50-000'+(i%5+1),
 question_page:{expression:'test word '+i,ipa:null,ipa_candidates:['/tɛst/'],
  qa_label:'待审',complete:false},
 answer_page:{expression:'test word '+i,ipa:null,pos:'noun',pos_abbr:'n',
  meaning_zh:'测试',meaning_display:'n. 测试',gloss_en:'A test',
  examples:i<35?[{en:'English example.',zh:'中文例句。',
   origin:'CGMASTER_ORIGINAL_EDITORIAL_EXAMPLE_NOT_KAIKKI'}]:[],
  qa_label:'待审',complete:false},
 native_source_line:500+i,
 sense_source_status:i===0?'ERRATA_PENDING_QA':'EDITORIAL_PENDING_QA',
 content_status:i===0?'HOLD':'BILINGUAL_EXAMPLE_DRAFT_UNREVIEWED',
 qa_stage:'待审',formal_ready:0,release_allowed:false
}));
const doc={version:'V223',scope:'SC50-0001..0005',total:38,question_pages:38,
 answer_pages:38,answer_pages_with_examples:35,
 complete_question_pages:0,complete_answer_pages:0,
 ipa_approved_count:0,release_allowed:false,qa_stage:'待审',records};
assert.equal(validatePreviewPayload(doc,selected).exampleRecords,35);
assert.equal(previewV223Row(records[0]).hold,true);
assert.equal(previewV223Row(records[0]).ipa,'音标待核验');
assert.equal(previewV223Row(records[0]).meaning,'n. 测试');
assert.equal(previewV223Row(records[0]).stage,'待审');
assert.equal(previewV223Row(records[0]).canWriteSrs,false);
assert.throws(()=>validatePreviewPayload({...doc,ipa_approved_count:1},selected),/MASTER_PREVIEW_CONTRACT/);
assert.throws(()=>validatePreviewPayload({...doc,complete_answer_pages:1},selected),/MASTER_PREVIEW_CONTRACT/);
const forged=structuredClone(doc);forged.records[0].qa_label='1审';
assert.throws(()=>validatePreviewPayload(forged,selected),/MASTER_PREVIEW_ROW/);
const forged2=structuredClone(doc);forged2.records[0].answer_page.qa_label='1审';
assert.throws(()=>validatePreviewPayload(forged2,selected),/MASTER_PREVIEW_ROW/);
const forged3=structuredClone(doc);forged3.records[0].question_page.ipa='/tɛst/';
assert.throws(()=>validatePreviewPayload(forged3,selected),/MASTER_PREVIEW_ROW/);
const wrongSense=structuredClone(doc);wrongSense.records[0].native_source_line=null;
assert.throws(()=>validatePreviewPayload(wrongSense,selected),/MASTER_PREVIEW_ROW/);
const blob=JSON.stringify(doc);
const gitSha=createHash('sha1').update('blob '+Buffer.byteLength(blob)+'\0').update(blob).digest('hex');
const commit='a'.repeat(40);
const fetchImpl=async url=>{
 if(url.includes('CGMASTER_CURRENT_STATE.json'))return new Response(JSON.stringify(state));
 if(url.includes('/contents/'+path))return new Response(JSON.stringify({
  type:'file',path,sha:gitSha,size:Buffer.byteLength(blob)}));
 if(url.includes(path))return new Response(blob);
 throw Error('UNEXPECTED_FETCH_'+url);
};
const native=globalThis.crypto;
if(!globalThis.crypto)Object.defineProperty(globalThis,'crypto',{value:webcrypto,configurable:true});
try{
 const actual=await fetchCurrentPreviewPayload({commit,fetchImpl});
 assert.equal(actual.rows.length,38);
 assert.equal(actual.version,'V223');
 assert.equal(actual.sourceBlob,gitSha);
 assert.equal(actual.formalReady,0);
 assert.equal(actual.canWriteSrs,false);
 await assert.rejects(()=>fetchCurrentPreviewPayload({commit,fetchImpl:async url=>
  url.includes('/contents/'+path)?new Response(JSON.stringify({
   type:'file',path,sha:'0'.repeat(40),size:Buffer.byteLength(blob)})):fetchImpl(url)}),
  /MASTER_PREVIEW_BLOB_SHA/);
}finally{
 if(!native)delete globalThis.crypto;
}
console.log('PASS V223 38 source-linked preview-only rows, 4 HOLD pathway, SHA1 check, zero approved IPA/pages and SRS');
