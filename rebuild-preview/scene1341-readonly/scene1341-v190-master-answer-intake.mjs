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
const digest=async(data,algorithm)=>Array.from(new Uint8Array(await crypto.subtle.digest(algorithm,data)),x=>x.toString(16).padStart(2,'0')).join('');
const clean=v=>typeof v==='string'?v.trim():'';
const normalize=s=>clean(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ');
const stablePair=x=>x&&typeof x==='object'&&clean(x.example_en)&&clean(x.example_zh);
export async function applyV190MasterAnswerIntake(cards,{fetchImpl=fetch}={}){
 if(!Array.isArray(cards)||cards.length!==2873)throw Error('V190_BASE_CARD_DRIFT');
 if(!globalThis.crypto?.subtle||typeof DecompressionStream==='undefined')throw Error('V190_GZIP_CRYPTO_UNSUPPORTED');
 const byId=new Map(cards.map(c=>[c.master_record_id,c]));
 if(byId.size!==2873)throw Error('V190_BASE_DUPLICATE_IDS');
 const all=[];
 for(let p=0;p<PARTS.length;p++){
  const [name,gitSha,sha256]=PARTS[p],response=await fetchImpl(BASE+name,{cache:'no-store'});
  if(!response.ok)throw Error('V190_HTTP_'+response.status+'_'+name);
  const bytes=new Uint8Array(await response.arrayBuffer());
  const head=new TextEncoder().encode('blob '+bytes.length+'\0');
  const combined=new Uint8Array(head.length+bytes.length);
  combined.set(head);combined.set(bytes,head.length);
  if(await digest(combined,'SHA-1')!==gitSha||await digest(bytes,'SHA-256')!==sha256)
   throw Error('V190_IMMUTABLE_SOURCE_HASH_MISMATCH_'+name);
  const decoded=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  const lines=decoded.trimEnd().split('\n');
  if(lines.length!==1000)throw Error('V190_SHARD_ROW_COUNT_'+name);
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
 if(all.length!==3000||unique.size!==3000||counts.examples!==1461||counts.ipa!==1478||
  counts.usage!==1461||counts.collocations!==1461)
  throw Error('V190_COVERAGE_MANIFEST_DRIFT_'+JSON.stringify(counts));
 let exact=0,held=0,enriched=0,preserved=0,examplesAdded=0;
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
  const old=card.answer||{},next={...old};
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
  if(changed){enriched++;track(card.scene_id,'enriched');return {...card,answer:next,master_latest_answer_source:'V190_TEST_ONLY',
     production_release_allowed:false};}
  preserved++;track(card.scene_id,'preserved');return card;
 });
 const unmatchedSourceRows=3000-touchedSourceIds.size,legacyOutsideBatch=2873-touchedSourceIds.size;
 if(exact+held>2873||new Set(result.map(x=>x.master_record_id)).size!==2873||
    unmatchedSourceRows!==502||legacyOutsideBatch!==375)throw Error('V190_MERGE_IDENTITY_DRIFT');
 return Object.freeze({items:result,sourceRows:3000,exact,held,enriched,preserved,
  examplesAdded,unmatchedSourceRows,legacyOutsideBatch,
  perScene:Object.freeze(Object.fromEntries([...perScene.entries()].sort((a,b)=>a[0].localeCompare(b[0])))),
  sourceCommit:PIN,formalReady:0,canWriteSrs:false,releaseAllowed:false});
}
