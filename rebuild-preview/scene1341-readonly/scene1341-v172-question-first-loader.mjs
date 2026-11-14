/* CG-MAIN isolated question-first reader: 70 SC50 scenes, 15,078 Master source records.
 * Source remains pinned to CG-MASTER immutable commit. No answer synthesis,
 * no Core20K/Scene500 reuse, no SRS or certification.
 */
export const SOURCE_COMMIT='b28fb9da20d0e556b5283f4329750fab95901132';
export const SOURCE_MASTER_SHA256='62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986';
const ROOT='https://raw.githubusercontent.com/TJPAI/pai-word/'+SOURCE_COMMIT+'/tools/scene1341_master/qa_reports/';
export const QUESTION_SHARDS=Object.freeze([{"version":"V168","first":1,"last":1,"count":294,"ipa":294,"file":"CGMASTER_V168_SC0001_294_QUESTION_PAGE_TEST_OVERLAY_20261114.json","blob":"015c596b3cc019d47ad5d7908227f5ef9091543d"},{"version":"V169","first":2,"last":4,"count":688,"ipa":674,"file":"CGMASTER_V169_SC0002_0004_QUESTION_IPA_TEST_20261114.json","blob":"98e98641fe4dfe91452937cf46891deee2b66dd4"},{"version":"V169","first":5,"last":7,"count":717,"ipa":697,"file":"CGMASTER_V169_SC0005_0007_QUESTION_IPA_TEST_20261114.json","blob":"0e849f27cc838160954a20d0f8477814e4d42ab2"},{"version":"V169","first":8,"last":10,"count":680,"ipa":664,"file":"CGMASTER_V169_SC0008_0010_QUESTION_IPA_TEST_20261114.json","blob":"07d7bafedb2cd30e918356f22885d02b15cef40e"},{"version":"V169","first":11,"last":13,"count":753,"ipa":742,"file":"CGMASTER_V169_SC0011_0013_QUESTION_IPA_TEST_20261114.json","blob":"c274e573bbfd46f80295e44442f95b04006eaa7d"},{"version":"V170","first":14,"last":16,"count":791,"ipa":null,"file":"CGMASTER_V170_SC0014_0016_QUESTION_IPA_TEST_20261114.json","blob":"287b2dedfa7e418e7960e94af39f11d63addfeec"},{"version":"V170","first":17,"last":19,"count":687,"ipa":null,"file":"CGMASTER_V170_SC0017_0019_QUESTION_IPA_TEST_20261114.json","blob":"d7545dab52b3ffc18a9b37a66a6ff5b16a2215dc"},{"version":"V170","first":20,"last":22,"count":767,"ipa":null,"file":"CGMASTER_V170_SC0020_0022_QUESTION_IPA_TEST_20261114.json","blob":"5d7a46d1fb661c7b2da7af4298995f1963ae157c"},{"version":"V170","first":23,"last":25,"count":802,"ipa":null,"file":"CGMASTER_V170_SC0023_0025_QUESTION_IPA_TEST_20261114.json","blob":"1480a3f2f8bf975eb61aff76f646731824624a3b"},{"version":"V172","first":26,"last":29,"count":812,"ipa":796,"file":"CGMASTER_V172_SC0026_0029_QUESTION_IPA_TEST_20261114.json.gz","blob":"960327da061ffd4e1cb8be2863bd159bdb9508f7","compressed":true},{"version":"V172","first":30,"last":32,"count":580,"ipa":564,"file":"CGMASTER_V172_SC0030_0032_QUESTION_IPA_TEST_20261114.json.gz","blob":"1d9544b585d66179b848c62a17c2909dee74af69","compressed":true},{"version":"V172","first":33,"last":35,"count":695,"ipa":676,"file":"CGMASTER_V172_SC0033_0035_QUESTION_IPA_TEST_20261114.json.gz","blob":"d059760c982dc64b53cf8f830728f24538edfaaa","compressed":true},{"version":"V172","first":36,"last":39,"count":891,"ipa":870,"file":"CGMASTER_V172_SC0036_0039_QUESTION_IPA_TEST_20261114.json.gz","blob":"e3a0235304fe776d4b0d292a3b421fc40d16594f","compressed":true},{"version":"V173","first":40,"last":43,"count":881,"ipa":850,"file":"CGMASTER_V173_SC0040_0043_QUESTION_IPA_TEST_20261114.json.gz","blob":"24834dffe5627e720fc126208e2e60f690b8b424","compressed":true},{"version":"V173","first":44,"last":47,"count":782,"ipa":743,"file":"CGMASTER_V173_SC0044_0047_QUESTION_IPA_TEST_20261114.json.gz","blob":"d223542cf0f374f129a2ca1a3d298f9983b034a3","compressed":true},{"version":"V173","first":48,"last":51,"count":717,"ipa":696,"file":"CGMASTER_V173_SC0048_0051_QUESTION_IPA_TEST_20261114.json.gz","blob":"69ea8e35c5d5ea4f4a62ae2d34588a9fac70ea61","compressed":true},{"version":"V173","first":52,"last":54,"count":547,"ipa":540,"file":"CGMASTER_V173_SC0052_0054_QUESTION_IPA_TEST_20261114.json.gz","blob":"251a8e18772c8cf7568d69a0ded5b8cb2d6157f0","compressed":true},{"version":"V174","first":55,"last":58,"count":718,"ipa":706,"file":"CGMASTER_V174_SC0055_0058_QUESTION_IPA_TEST_20261114.json.gz","blob":"0dfab3211bf2ab6b7cead98784c108d2e12d9ef6","compressed":true},{"version":"V174","first":59,"last":62,"count":701,"ipa":691,"file":"CGMASTER_V174_SC0059_0062_QUESTION_IPA_TEST_20261114.json.gz","blob":"069c8763da6c54030924e1a84e5f726b116cfc89","compressed":true},{"version":"V174","first":63,"last":66,"count":802,"ipa":787,"file":"CGMASTER_V174_SC0063_0066_QUESTION_IPA_TEST_20261114.json.gz","blob":"a8404ee35a4f730ea72ddd3aaa05684c3ae58226","compressed":true},{"version":"V174","first":67,"last":70,"count":773,"ipa":755,"file":"CGMASTER_V174_SC0067_0070_QUESTION_IPA_TEST_20261114.json.gz","blob":"3e193610405da2d2197efa13ec2c51301a4e1904","compressed":true}]);
const COMPRESSED_COMMIT='29e1b9e55f20e753689289f6866a1e7bab3c7302';
const COMPRESSED_ROOT='https://raw.githubusercontent.com/TJPAI/pai-word/'+COMPRESSED_COMMIT+'/tools/scene1341_master/qa_reports/';
const CACHE=new Map();
async function gitBlob(raw){
 if(!globalThis.crypto?.subtle)throw Error('SC1341_CRYPTO_SUBTLE_UNAVAILABLE');
 const body=typeof raw==='string'?new TextEncoder().encode(raw):new Uint8Array(raw);
 const prefix=new TextEncoder().encode('blob '+body.length+'\\0');
 const bytes=new Uint8Array(prefix.length+body.length);bytes.set(prefix);bytes.set(body,prefix.length);
 const digest=await crypto.subtle.digest('SHA-1',bytes);
 return Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
}
async function decodeShardGzip(compressed){
 // Safari iOS 16.4+ native DecompressionStream; no third-party network script.
 // The compressed Git blob is cryptographically checked BEFORE decompression.
 if(typeof DecompressionStream!=='function')throw Error('SC1341_GZIP_UNSUPPORTED_BROWSER');
 const stream=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
 return new TextDecoder('utf-8',{fatal:true}).decode(await new Response(stream).arrayBuffer());
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
  const response=await fetchImpl((spec.compressed?COMPRESSED_ROOT:ROOT)+spec.file,{cache:'no-store'});
  if(!response.ok)throw Error('SC1341_MASTER_HTTP_'+response.status);
  const raw=spec.compressed?await response.arrayBuffer():await response.text();
  const actualBlob=await gitBlob(raw);
  if(actualBlob!==spec.blob)throw Error('SC1341_MASTER_BLOB_DRIFT_'+spec.file+'_expected_'+spec.blob+'_actual_'+actualBlob);
  const doc=JSON.parse(spec.compressed?await decodeShardGzip(raw):raw);
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
 if(rows.length!==15078||ids.size!==15078||sourceRows.size!==15078||scenes.size!==70||ipa!==14736||
    Math.min(...sourceRows)!==1||Math.max(...sourceRows)!==15078)
  throw Error('SC1341_V174_ALL_15078_IDENTITY_OR_IPA_DRIFT');
 return {records:15078,scenes:70,selectedIPA:14736,missingIPA:342,formalReady:0,canWriteSrs:false};
}
