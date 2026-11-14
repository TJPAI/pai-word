/* CG-MAIN isolated question-first reader: 39 SC50 scenes, 9,157 Master source records.
 * Source remains pinned to CG-MASTER immutable commit. No answer synthesis,
 * no Core20K/Scene500 reuse, no SRS or certification.
 */
export const SOURCE_COMMIT='b28fb9da20d0e556b5283f4329750fab95901132';
export const SOURCE_MASTER_SHA256='62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986';
const ROOT='https://raw.githubusercontent.com/TJPAI/pai-word/'+SOURCE_COMMIT+'/tools/scene1341_master/qa_reports/';
export const QUESTION_SHARDS=Object.freeze([{"version":"V168","first":1,"last":1,"count":294,"ipa":294,"file":"CGMASTER_V168_SC0001_294_QUESTION_PAGE_TEST_OVERLAY_20261114.json","blob":"015c596b3cc019d47ad5d7908227f5ef9091543d"},{"version":"V169","first":2,"last":4,"count":688,"ipa":674,"file":"CGMASTER_V169_SC0002_0004_QUESTION_IPA_TEST_20261114.json","blob":"98e98641fe4dfe91452937cf46891deee2b66dd4"},{"version":"V169","first":5,"last":7,"count":717,"ipa":697,"file":"CGMASTER_V169_SC0005_0007_QUESTION_IPA_TEST_20261114.json","blob":"0e849f27cc838160954a20d0f8477814e4d42ab2"},{"version":"V169","first":8,"last":10,"count":680,"ipa":664,"file":"CGMASTER_V169_SC0008_0010_QUESTION_IPA_TEST_20261114.json","blob":"07d7bafedb2cd30e918356f22885d02b15cef40e"},{"version":"V169","first":11,"last":13,"count":753,"ipa":742,"file":"CGMASTER_V169_SC0011_0013_QUESTION_IPA_TEST_20261114.json","blob":"c274e573bbfd46f80295e44442f95b04006eaa7d"},{"version":"V170","first":14,"last":16,"count":791,"ipa":null,"file":"CGMASTER_V170_SC0014_0016_QUESTION_IPA_TEST_20261114.json","blob":"287b2dedfa7e418e7960e94af39f11d63addfeec"},{"version":"V170","first":17,"last":19,"count":687,"ipa":null,"file":"CGMASTER_V170_SC0017_0019_QUESTION_IPA_TEST_20261114.json","blob":"d7545dab52b3ffc18a9b37a66a6ff5b16a2215dc"},{"version":"V170","first":20,"last":22,"count":767,"ipa":null,"file":"CGMASTER_V170_SC0020_0022_QUESTION_IPA_TEST_20261114.json","blob":"5d7a46d1fb661c7b2da7af4298995f1963ae157"},{"version":"V170","first":23,"last":25,"count":802,"ipa":null,"file":"CGMASTER_V170_SC0023_0025_QUESTION_IPA_TEST_20261114.json","blob":"1480a3f2f8bf975eb61aff76f646731824624a3b"},{"version":"V172","first":26,"last":29,"count":812,"ipa":796,"file":"CGMASTER_V172_SC0026_0029_QUESTION_IPA_TEST_20261114.json","blob":"b141879b6cb843ce677db6218be6dc2733f4a61d"},{"version":"V172","first":30,"last":32,"count":580,"ipa":564,"file":"CGMASTER_V172_SC0030_0032_QUESTION_IPA_TEST_20261114.json","blob":"4818a0efb1c13206825bf0912eaa6e6a67765244"},{"version":"V172","first":33,"last":35,"count":695,"ipa":676,"file":"CGMASTER_V172_SC0033_0035_QUESTION_IPA_TEST_20261114.json","blob":"a1f8d63ed38eb9269c70b4e0fe00e9fe00aff3ff"},{"version":"V172","first":36,"last":39,"count":891,"ipa":870,"file":"CGMASTER_V172_SC0036_0039_QUESTION_IPA_TEST_20261114.json","blob":"27d8bc4517e27efcbb7787d84e778d6c846bf565"}]);
const CACHE=new Map();
async function gitBlob(raw){
 if(!globalThis.crypto?.subtle)throw Error('SC1341_CRYPTO_SUBTLE_UNAVAILABLE');
 const encoder=new TextEncoder(),body=encoder.encode(raw),prefix=encoder.encode('blob '+body.length+'\0');
 const bytes=new Uint8Array(prefix.length+body.length);bytes.set(prefix);bytes.set(body,prefix.length);
 const digest=await crypto.subtle.digest('SHA-1',bytes);
 return Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
}
const isIPA=raw=>typeof raw==='string'&&/^(?:\/[^\/\]\r\n]+\/|\[[^\/\]\r\n]+\])$/u.test(raw.trim())&&raw.trim().slice(1,-1).trim().length>0;
export function sourceStatus(record){return record?.question_page?.ipa_status||'IPA_MISSING_REVIEW_REQUIRED'}
export function previewIPA(record){
 const q=record?.question_page;
 return isIPA(q?.ipa)?q.ipa:null;
}
export async function loadQuestionShard(spec,{fetchImpl=fetch}={}){
 if(!QUESTION_SHARDS.includes(spec))throw Error('SC1341_SHARD_NOT_MANIFESTED');
 if(CACHE.has(spec.file))return CACHE.get(spec.file);
 const task=(async()=>{
  const response=await fetchImpl(ROOT+spec.file,{cache:'no-store'});
  if(!response.ok)throw Error('SC1341_MASTER_HTTP_'+response.status);
  const raw=await response.text();
  if(await gitBlob(raw)!==spec.blob)throw Error('SC1341_MASTER_BLOB_DRIFT_'+spec.file);
  const doc=JSON.parse(raw);
  if(doc.version!==spec.version||
     (spec.version==='V168'?(doc.ready!==0||doc.formal_certification!==false):doc.release_allowed!==false)||
     !Array.isArray(doc.records)||doc.records.length!==spec.count)
   throw Error('SC1341_MASTER_MANIFEST_DRIFT');
  const records=new Set(),rows=new Set();let countIPA=0;
  for(const rec of doc.records){
   const q=rec.question_page,n=Number(rec.scene_id?.slice(5));
   if(!Number.isInteger(n)||n<spec.first||n>spec.last||
      !/^SC1341-FINAL-SRC-[a-f0-9]{32}$/.test(rec.record_id)||
      !Number.isSafeInteger(rec.source_final_row)||rec.source_final_row<1||
      records.has(rec.record_id)||rows.has(rec.source_final_row)||
      !q?.english_expression?.trim()||!q?.cue_zh?.trim()||
      rec.canonical_sense_id!==null||rec.release_allowed!==false||
      rec.cg_qa_status!=='DEFERRED'||rec.mu_qa_status!=='DEFERRED')
    throw Error('SC1341_MASTER_IDENTITY_RELEASE_CONFLICT_'+rec.source_final_row);
   if(doc.source_master_sha256&&doc.source_master_sha256!==SOURCE_MASTER_SHA256)
    throw Error('SC1341_MASTER_SOURCE_SHA_CONFLICT');
   records.add(rec.record_id);rows.add(rec.source_final_row);
   if(previewIPA(rec)!==null)countIPA++;
  }
  if(spec.ipa!==null&&countIPA!==spec.ipa)throw Error('SC1341_MASTER_IPA_COUNT_DRIFT_'+spec.file);
  return Object.freeze({records:Object.freeze(doc.records),count:doc.records.length,
    selectedIPA:countIPA,formalReady:0,releaseAllowed:false,sourceGitBlob:spec.blob});
 })();
 CACHE.set(spec.file,task);
 try{return await task}catch(e){CACHE.delete(spec.file);throw e}
}
export async function loadQuestionScene(sceneId,opts={}){
 const n=Number(String(sceneId).replace(/^SC50-/,'')),spec=QUESTION_SHARDS.find(x=>n>=x.first&&n<=x.last);
 if(!spec||!/^(?:SC50-)\d{4}$/.test(sceneId))throw Error('SC1341_SCENE_NOT_IN_QUESTION_TEST');
 const shard=await loadQuestionShard(spec,opts);
 const rows=shard.records.filter(x=>x.scene_id===sceneId).sort((a,b)=>a.source_final_row-b.source_final_row);
 if(!rows.length)throw Error('SC1341_SCENE_EMPTY');
 return {sceneId,records:rows,selectedIPA:rows.filter(x=>previewIPA(x)!==null).length,
         releaseAllowed:false,canWriteSrs:false,formalReady:0,sourceGitBlob:spec.blob};
}
export async function auditAllQuestionShards(opts={}){
 const rows=[];for(const spec of QUESTION_SHARDS)rows.push(...(await loadQuestionShard(spec,opts)).records);
 const ids=new Set(rows.map(x=>x.record_id)),sourceRows=new Set(rows.map(x=>x.source_final_row));
 const scenes=new Set(rows.map(x=>x.scene_id)),ipa=rows.filter(x=>previewIPA(x)!==null).length;
 if(rows.length!==9157||ids.size!==9157||sourceRows.size!==9157||scenes.size!==39||ipa!==8968||
    Math.min(...sourceRows)!==1||Math.max(...sourceRows)!==9157)
  throw Error('SC1341_V172_ALL_9157_IDENTITY_OR_IPA_DRIFT');
 return {records:9157,scenes:39,selectedIPA:8968,missingIPA:189,formalReady:0,canWriteSrs:false};
}
