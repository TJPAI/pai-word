/* CG-MAIN V190 latest Master incremental answer intake.
 * Strict Git SHA1/SHA256, immutable 3000 association rows, identity-only joins.
 * Preserve preexisting learner content and IPA; no SRS, no ready promotion.
 */
const PIN='acda081836511707bc12d8360fa0472ff12401b8';
const BASE='https://raw.githubusercontent.com/TJPAI/pai-word/'+PIN+'/tools/scene1341_master/qa_reports/';
const PARTS=[
 ['CGMASTER_V190_SOURCE00001_01000_BATCH03_AUTHOR_MERGED_OVERLAY.jsonl.gz','b63daf359370a254491188188cbb036496d9a258','12c4d4b088d670feb6d9ec7cd895c8cdfb8fc08c42100b529bb9966ed12ba60c'],
 ['CGMASTER_V190_SOURCE01001_02000_BATCH03_AUTHOR_MERGED_OVERLAY.jsonl.gz','ca147731e67979e875f3e37a95514a9bfeb3e9f0','05786ca01ba101373a711254d490552b7654693252af3f1b039737eb1325e148'],
 ['CGMASTER_V190_SOURCE02001_03000_BATCH03_AUTHOR_MERGED_OVERLAY.jsonl.gz','effac2ddb1fd145927d4ff41a130820d81ff83b2','90afbdfb00536cd8c8840a7f88898c8b79e9bb14b884c604d0b32a6ba5bf703a']
];
const BRANCH='cg-master-kaikki-evidence-intake-20261111';
const API='https://api.github.com/repos/TJPAI/pai-word/';
const staticV190={version:'V190',commit:PIN,shards:PARTS.map(([name,blob,sha256])=>({name,git_blob_sha1:blob,sha256,records:1000})),
 expected:{records:3000,examples:1461,ipa:1478,usage:1461,collocations:1461},fallback:true};
function assertSourceManifest(m,version){
 if(m.version!==version||m.formal_ready!==0||m.srs_eligible!==false||
   !Array.isArray(m.shards)||m.shards.length!==3||m.shards.some(x=>x.records!==1000)||
   m.source_master_sha256!=='62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986')
  throw Error('MASTER_LIVE_MANIFEST_NOT_INTEGRABLE');
 const range=m.source_final_rows||m.scope?.source_final_rows;
 if(!Array.isArray(range)||range[0]!==1||range[1]!==3000)
  throw Error('MASTER_LIVE_MANIFEST_WRONG_BATCH');
 const c=m.counts||{};
 const expected={records:3000,examples:c.examples_filled,ipa:c.test_ipa_nonempty??c.ipa_test_nonempty,
  usage:c.usage_note_filled,collocations:c.collocations_filled};
 if(![expected.examples,expected.ipa,expected.usage,expected.collocations].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=3000))
  throw Error('MASTER_LIVE_MANIFEST_UNSUPPORTED_COUNTS');
 return {expected,shards:m.shards.map(x=>({
  name:x.name,git_blob_sha1:x.git_blob_sha1,sha256:x.sha256,records:x.records
 }))};
}
/* Refresh the live Git ref once per page visit, then freeze ALL subsequent reads
 * to that SHA. Branch changes during loading cannot mix shard versions.
 */
export async function resolveLatestMasterSnapshot({fetchImpl=fetch}={}){
 try{
  const options={cache:'no-store',headers:{Accept:'application/vnd.github+json'}};
  const branchResponse=await fetchImpl(API+'branches/'+BRANCH,options);
  if(!branchResponse.ok)throw Error('MASTER_LIVE_REF_HTTP_'+branchResponse.status);
  const branch=await branchResponse.json(),commit=branch.commit?.sha;
  if(!/^[a-f0-9]{40}$/.test(commit))throw Error('MASTER_LIVE_REF_INVALID');
  const treeResponse=await fetchImpl(API+'git/trees/'+commit+'?recursive=1',options);
  if(!treeResponse.ok)throw Error('MASTER_LIVE_TREE_HTTP_'+treeResponse.status);
  const tree=await treeResponse.json();
  if(tree.truncated||!Array.isArray(tree.tree))throw Error('MASTER_LIVE_TREE_INCOMPLETE');
  const matches=tree.tree.map(x=>{
    const m=x.path?.match(/^tools\/scene1341_master\/qa_reports\/CGMASTER_V(\d+)_MANIFEST_\d{8}\.json$/);
    return m?{version:'V'+m[1],number:Number(m[1]),path:x.path}:null;
  }).filter(Boolean).filter(x=>x.number>=190).sort((a,b)=>b.number-a.number);
  if(!matches.length)throw Error('MASTER_LIVE_NO_COMPLETE_MANIFEST');
  // A newer manifest may belong to the NEXT 3000-association batch.
  // Keep consuming the newest compatible first-batch full page snapshot,
  // instead of misclassifying the next batch as a corrupt first batch.
  // Never silently downgrade within the same batch if its source is broken.
  for(const latest of matches){
   const manifestResponse=await fetchImpl(
    'https://raw.githubusercontent.com/TJPAI/pai-word/'+commit+'/'+latest.path,{cache:'no-store'});
   if(!manifestResponse.ok)throw Error('MASTER_LIVE_MANIFEST_HTTP_'+manifestResponse.status);
   const manifest=await manifestResponse.json();
   const range=manifest.source_final_rows||manifest.scope?.source_final_rows;
   if(!Array.isArray(range)||range.length!==2||range[0]!==1||range[1]!==3000)continue;
   const spec=assertSourceManifest(manifest,latest.version);
   const basePath='tools/scene1341_master/qa_reports/';
   for(const part of spec.shards){
    const inTree=tree.tree.find(x=>x.path===basePath+part.name);
    if(!inTree||inTree.sha!==part.git_blob_sha1)throw Error('MASTER_LIVE_SHARD_MISSING_OR_MISMATCH');
   }
   return {version:latest.version,commit,shards:spec.shards,expected:spec.expected,
     fallback:false,manifest:latest.path};
  }
  throw Error('MASTER_LIVE_NO_FIRST_BATCH_FULL_PAGES');
 }catch(error){
  // Stable previously tested V190 remains available when GitHub API is
  // blocked/offline or when the new Master delivery is not yet complete.
  return {...staticV190,liveError:String(error?.message||error)};
 }
}

const digest=async(data,algorithm)=>Array.from(new Uint8Array(await crypto.subtle.digest(algorithm,data)),x=>x.toString(16).padStart(2,'0')).join('');
const clean=v=>typeof v==='string'?v.trim():'';
const normalize=s=>clean(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ');
const stablePair=x=>x&&typeof x==='object'&&clean(x.example_en)&&clean(x.example_zh);
async function loadSnapshot(cards,{fetchImpl,selected}){
 if(!Array.isArray(selected.shards)||selected.shards.length!==3||!selected.expected)throw Error('MASTER_LIVE_SNAPSHOT_INVALID');
 if(!Array.isArray(cards)||cards.length!==2873)throw Error('V190_BASE_CARD_DRIFT');
 if(!globalThis.crypto?.subtle||typeof DecompressionStream==='undefined')throw Error('V190_GZIP_CRYPTO_UNSUPPORTED');
 const byId=new Map(cards.map(c=>[c.master_record_id,c]));
 if(byId.size!==2873)throw Error('V190_BASE_DUPLICATE_IDS');
 const all=[];
 for(let p=0;p<selected.shards.length;p++){
  const {name,git_blob_sha1:gitSha,sha256,records:partRows}=selected.shards[p];
  const response=await fetchImpl('https://raw.githubusercontent.com/TJPAI/pai-word/'+selected.commit+'/tools/scene1341_master/qa_reports/'+name,{cache:'no-store'});
  if(!response.ok)throw Error('V190_HTTP_'+response.status+'_'+name);
  const bytes=new Uint8Array(await response.arrayBuffer());
  const head=new TextEncoder().encode('blob '+bytes.length+'\0');
  const combined=new Uint8Array(head.length+bytes.length);
  combined.set(head);combined.set(bytes,head.length);
  if(await digest(combined,'SHA-1')!==gitSha||await digest(bytes,'SHA-256')!==sha256)
   throw Error('V190_IMMUTABLE_SOURCE_HASH_MISMATCH_'+name);
  const decoded=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  const lines=decoded.trimEnd().split('\n');
  if(lines.length!==partRows)throw Error('MASTER_LIVE_SHARD_ROW_COUNT_'+name);
  all.push(...lines.map(x=>JSON.parse(x)));
 }
 const unique=new Set(),sourceById=new Map(),counts={examples:0,ipa:0,usage:0,collocations:0};
 for(let i=0;i<all.length;i++){
  const r=all[i],q=r.question_page,a=r.answer_page;
  if(r.source_final_row!==i+1||!/^SC1341-FINAL-SRC-[a-f0-9]{32}$/.test(r.record_id)||
   !/^SC50-\d{4}$/.test(r.scene_id)||!clean(q?.expression)||!clean(q?.cue_zh)||
   !clean(a?.meaning_zh)||unique.has(r.record_id)||r.release_allowed===true||
   r.srs_eligible===true||!Array.isArray(a.examples)||a.examples.length>3||
   !Array.isArray(a.synonyms)||!Array.isArray(a.antonyms))
   throw Error('V190_IDENTITY_OR_RELEASE_DRIFT_ROW_'+(i+1));
  unique.add(r.record_id);sourceById.set(r.record_id,r);
  counts.examples+=a.examples.length>0?1:0;
  counts.ipa+=clean(q.ipa)?1:0;
  counts.usage+=clean(a.usage_note)?1:0;
  counts.collocations+=Array.isArray(a.collocations)?Number(a.collocations.length>0):Number(!!clean(a.collocations));
 }
 if(all.length!==selected.expected.records||unique.size!==selected.expected.records||
  counts.examples!==selected.expected.examples||counts.ipa!==selected.expected.ipa||
  counts.usage!==selected.expected.usage||counts.collocations!==selected.expected.collocations)
  throw Error('V190_COVERAGE_MANIFEST_DRIFT_'+JSON.stringify(counts));
 let exact=0,held=0,enriched=0,preserved=0,examplesAdded=0,liveIPATest=0,ipaUpdated=0;
 const perScene=new Map();const touchedSourceIds=new Set();
 const track=(scene,field)=>{const entry=perScene.get(scene)||{matched:0,enriched:0,preserved:0,identityHold:0};entry[field]++;perScene.set(scene,entry);};
 const result=cards.map(card=>{
  const source=sourceById.get(card.master_record_id);
  if(!source)return card;
  touchedSourceIds.add(source.record_id);
  const q=source.question_page,a=source.answer_page;
  if(source.scene_id!==card.scene_id||source.source_final_row!==card.master_final_row||
   normalize(q.expression)!==normalize(card.expression)||
   normalize(q.cue_zh)!==normalize(card.question?.cue_zh)||
   normalize(a.meaning_zh)!==normalize(card.answer?.meaning_zh)){
   held++;track(card.scene_id,'identityHold');return card;
  }
  exact++;track(card.scene_id,'matched');
  const old=card.answer||{},next={...old},oldQuestion=card.question||{};
  let nextQuestion=oldQuestion,questionChanged=false;
  // Only a source-native unique entry or exact CMUdict 1.1.3
  // candidate is eligible for learner-facing TEST display. No Sense
  // or regional pronunciation is certified by this rule.
  const eligibleStatus=['KAIKKI_EXACT_UNIQUE_HEADWORD_TEST_ONLY',
   'CMUDICT113_EXACT_ARPABET_CONVERTED_TEST_ONLY'];
  const candidate=clean(q.ipa);
  const correctEnvelope=((candidate.startsWith('/')&&candidate.endsWith('/'))||
   (candidate.startsWith('[')&&candidate.endsWith(']')))&&candidate.length>2&&
   !candidate.includes('\n')&&!candidate.includes('\r');
  if(eligibleStatus.includes(q.ipa_status)&&correctEnvelope){
   liveIPATest++;
   const valueChanged=oldQuestion.ipa!==candidate;
   if(valueChanged)ipaUpdated++;
   nextQuestion={...oldQuestion,ipa:candidate,
    ipa_status:'CGMASTER_LATEST_EXACT_TEST_ONLY',
    ipa_provisional:true,master_live_ipa_test:true,
    master_live_ipa_version:selected.version,
    master_live_ipa_source_status:q.ipa_status,
    master_live_ipa_source_commit:selected.commit,
    master_previous_ipa_test:oldQuestion.ipa||null,
    ipa_source:{source_type:'CGMASTER_LATEST_SOURCE_PINNED_EXACT_TEST_ONLY',
      source_final_row:source.source_final_row,record_id:source.record_id,
      git_commit:selected.commit,original_ipa_status:q.ipa_status,
      sense_match_approved:false,qa_approved:false}};
   questionChanged=true;
  }
  let changed=false;
  const addText=(field)=>{if(!clean(next[field])&&clean(a[field])){next[field]=a[field];changed=true;}};
  for(const field of ['gloss_en','pos','usage_note'])addText(field);
  if((!Array.isArray(next.collocations)||!next.collocations.length)&&
   Array.isArray(a.collocations)&&a.collocations.length){
    next.collocations=[...a.collocations];changed=true;
  }
  const oldExamples=Array.isArray(next.examples)&&next.examples.length?
   next.examples.filter(stablePair):stablePair({example_en:old.example_en,example_zh:old.example_zh})?
    [{example_en:old.example_en,example_zh:old.example_zh}]:[];
  const additions=a.examples.filter(stablePair);
  const merged=[...oldExamples];
  for(const item of additions){
   if(merged.length>=3)break;
   if(merged.some(e=>normalize(e.example_en)===normalize(item.example_en)&&normalize(e.example_zh)===normalize(item.example_zh)))continue;
   // Do not append potentially different Sense examples to existing teaching content.
   if(oldExamples.length)continue;
   merged.push({example_en:item.example_en,example_zh:item.example_zh,source:'CGMASTER_V190_AUTHOR_TEST',status:'UNVERIFIED'});
   changed=true;examplesAdded++;
  }
  if(!oldExamples.length&&merged.length){next.examples=merged;changed=true;}
  // V190 has no certified semantic relations: NEVER erase legacy Sense
  // annotations or fabricate an approval. New fields stay absent unless
  // already present in the legacy answer.
  if(!('synonyms' in next))next.synonyms=[];
  if(!('antonyms' in next))next.antonyms=[];
  if(!('synonyms_status' in next))next.synonyms_status='UNVERIFIED';
  if(!('antonyms_status' in next))next.antonyms_status='UNVERIFIED';
  if(!('sense_disambiguation' in next))next.sense_disambiguation={note_zh:'',comparisons:[],status:'UNVERIFIED',source:null};
  if(changed||questionChanged){enriched++;track(card.scene_id,'enriched');return {...card,answer:next,
     question:nextQuestion,master_latest_answer_source:selected.version+'_TEST_ONLY',
     production_release_allowed:false};}
  preserved++;track(card.scene_id,'preserved');return card;
 });
 const unmatchedSourceRows=3000-touchedSourceIds.size,legacyOutsideBatch=2873-touchedSourceIds.size;
 if(exact+held>2873||new Set(result.map(x=>x.master_record_id)).size!==2873||
    unmatchedSourceRows!==selected.expected.records-touchedSourceIds.size||legacyOutsideBatch!==2873-touchedSourceIds.size)throw Error('V190_MERGE_IDENTITY_DRIFT');
 return Object.freeze({items:result,sourceRows:3000,exact,held,enriched,preserved,
  examplesAdded,liveIPATest,ipaUpdated,unmatchedSourceRows,legacyOutsideBatch,
  perScene:Object.freeze(Object.fromEntries([...perScene.entries()].sort((a,b)=>a[0].localeCompare(b[0])))),
  sourceCommit:selected.commit,sourceVersion:selected.version,sourceFallback:selected.fallback===true,
  sourceError:selected.liveError||'',formalReady:0,canWriteSrs:false,releaseAllowed:false});
}

/** Dynamic Master on every page open. Source failure never hides all legacy
 * study cards: a pinned tested V190 snapshot is the explicit safe fallback.
 * The UI reports fallback + reason rather than pretending it is up to date.
 */
export async function applyV190MasterAnswerIntake(cards,{fetchImpl=fetch,snapshot=null}={}){
 const selected=snapshot||await resolveLatestMasterSnapshot({fetchImpl});
 try{
  return await loadSnapshot(cards,{fetchImpl,selected});
 }catch(error){
  if(snapshot||selected.fallback)throw error;
  const fallback=await loadSnapshot(cards,{fetchImpl,selected:staticV190});
  return Object.freeze({...fallback,sourceFallback:true,
   sourceError:'MASTER_LIVE_SHARD_FALLBACK: '+String(error?.message||error)});
 }
}
