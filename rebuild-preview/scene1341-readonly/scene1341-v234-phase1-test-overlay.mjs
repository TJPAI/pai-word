/* CG-MASTER V234 Phase1 L1/L2 coverage: source-exact TEST only.
 * No unreviewed IPA selection, QA promotion or SRS writing.
 */
const REPO='https://api.github.com/repos/TJPAI/pai-word/';
const RAW='https://raw.githubusercontent.com/TJPAI/pai-word/';
const BRANCH='cg-master-kaikki-evidence-intake-20261111';
const PATH='tools/scene1341_master/qa_reports/CGMASTER_V234_ALL1241_L1_L2_SCENE_TEST_COVERAGE_20261115.json';
const ID=/^SC1341-FINAL-SRC-[a-f0-9]{32}$/;
const COMMIT=/^[a-f0-9]{40}$/;
const norm=x=>String(x||'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
const fail=x=>{throw Error('V234_PHASE1_'+x)};
async function sha1Blob(raw,cryptoImpl){
 if(!cryptoImpl?.subtle)fail('CRYPTO_UNAVAILABLE');
 const encoder=new TextEncoder(),body=encoder.encode(raw),prefix=encoder.encode('blob '+body.length+'\0');
 const bytes=new Uint8Array(prefix.length+body.length);bytes.set(prefix);bytes.set(body,prefix.length);
 const hash=await cryptoImpl.subtle.digest('SHA-1',bytes);
 return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export function validateV234FullCoverage(doc){
 if(doc?.version!=='V234'||doc.purpose!=='FULL_SC0001_0005_ALL1241_SOURCE_ROW_TEST_COVERAGE'||
 doc.release_allowed!==false||doc.qa_stage!=='待审'||doc.stats?.total!==1241||
 doc.stats?.enhanced!==258||doc.stats?.baseline!==983||doc.stats?.ipa_candidates!==374)fail('MANIFEST');
 const byId=new Map(),byRow=new Set(),counts={};
 for(let i=1;i<=5;i++){
  const scene='SC50-'+String(i).padStart(4,'0'),rows=doc.scenes?.[scene];
  if(!Array.isArray(rows)||rows.length!==doc.stats.by_scene?.[scene])fail('SCENE_COUNT_'+scene);
  counts[scene]=rows.length;
  for(const r of rows){
   if(!ID.test(r?.record_id||'')||r.scene_id!==scene||
   !Number.isSafeInteger(r.source_final_row)||r.source_final_row<1||r.source_final_row>1241||
   byId.has(r.record_id)||byRow.has(r.source_final_row)||
   typeof r.question_page?.expression!=='string'||!r.question_page.expression.trim()||
   typeof r.answer_page?.meaning_display!=='string'||!r.answer_page.meaning_display.trim()||
   r.complete!==false||r.formal_ready!==0||r.release_allowed!==false||
   r.question_page?.ipa_approved!==false||
   (r.question_page?.qa_label&&r.question_page.qa_label!=='待审')||
   (r.answer_page?.qa_label&&r.answer_page.qa_label!=='待审')||
   (r.qa_stage&&r.qa_stage!=='待审'))fail('SOURCE_ROW_'+r?.source_final_row);
   byId.set(r.record_id,r);byRow.add(r.source_final_row);
  }
 }
 if(byId.size!==1241||byRow.size!==1241||Object.keys(doc.scenes).length!==5)fail('TOTAL');
 return {byId,counts};
}
export async function fetchV234FullCoverage({fetchImpl=fetch,cryptoImpl=globalThis.crypto}={}){
 const branch=await fetchImpl(REPO+'branches/'+BRANCH,{cache:'no-store'});
 if(!branch.ok)fail('BRANCH_HTTP_'+branch.status);
 const commit=(await branch.json())?.commit?.sha;
 if(!COMMIT.test(commit||''))fail('BRANCH_COMMIT');
 const stateRes=await fetchImpl(RAW+commit+'/tools/scene1341_master/CGMASTER_CURRENT_STATE.json',{cache:'no-store'});
 if(!stateRes.ok)fail('STATE_HTTP_'+stateRes.status);
 const state=await stateRes.json();
 if(state.version?.slice(1)*1<234||state.phase1?.original_source_associations!==1241||
 state.phase1?.v234_full_coverage?.path!==PATH||
 state.phase1?.v234_full_coverage?.release_allowed!==false)fail('STATE');
 const metaRes=await fetchImpl(REPO+'contents/'+PATH+'?ref='+commit,{cache:'no-store'});
 if(!metaRes.ok)fail('META_HTTP_'+metaRes.status);
 const meta=await metaRes.json();
 if(meta.type!=='file'||meta.path!==PATH||!COMMIT.test(meta.sha||'')||
 meta.size<100||meta.size>8000000)fail('META');
 const dataRes=await fetchImpl(RAW+commit+'/'+PATH,{cache:'no-store'});
 if(!dataRes.ok)fail('DATA_HTTP_'+dataRes.status);
 const raw=await dataRes.text();
 if(new TextEncoder().encode(raw).length!==meta.size||await sha1Blob(raw,cryptoImpl)!==meta.sha)fail('BLOB_SHA1');
 const data=JSON.parse(raw),verified=validateV234FullCoverage(data);
 return {commit,rows:verified.byId,sourceVersion:'V234',onlyTest:true,canWriteSrs:false,formalReady:0};
}
export function applyV234Phase1TestOverlay(cards,feed){
 if(!Array.isArray(cards)||feed?.onlyTest!==true||feed.canWriteSrs!==false||
 feed.formalReady!==0||feed.rows?.size!==1241)fail('INPUT');
 const seen=new Set();let matched=0,baseline=0,preserved=0,held=0;
 const items=cards.map(card=>{
  const r=feed.rows.get(card.master_record_id);
  if(!r)return card;
  if(seen.has(r.record_id))fail('DUPLICATE_CARD');
  seen.add(r.record_id);
  if(card.scene_id!==r.scene_id||card.master_final_row!==r.source_final_row||
    norm(card.expression)!==norm(r.question_page.expression)){held++;return {...card,master_source_identity_hold:true,production_release_allowed:false}}
  matched++;
  // The independently content-SHA checked fresh 258 editorial cards take precedence.
  if(card.master_phase1_source==='KAIKKI_FRESH_EDITOR_TEST'){preserved++;return card}
  // L1 records carry only source expression + Chinese cue; no approved IPA or full teaching page.
  // Never copy the V234 candidate IPA or unlabeled/untranslated examples to the learner.
  const next={...card,
   question:{...card.question,expression:r.question_page.expression,ipa:null,
    ipa_status:'PHASE1_V234_TEST_IPA_HOLD',ipa_candidates_pending:true},
   answer:{...card.answer,pos:'',meaning_zh:r.answer_page.meaning_display,
    gloss_en:r.coverage_level==='L2_KAIKKI_NATIVE_CANDIDATE'?r.answer_page.gloss_en||'':'',
    examples:[],example_en:'',example_zh:'',collocations:[],usage_note:'',
    content_complete:false},
   display:{...card.display,w:r.question_page.expression,m:r.answer_page.meaning_display},
   master_phase1_source:'KAIKKI_V234_L1_L2_UNREVIEWED_TEST',master_source_identity_hold:false,
   production_release_allowed:false,qa_status:'DEFERRED_TEST_ONLY'};
  baseline++;
  return next;
 });
 if(matched===0||matched!==baseline+preserved||matched+held>1241)fail('MATCH');
 return {items,matched,baseline,preserved,held,sourceCommit:feed.commit,
  onlyTest:true,formalReady:0,canWriteSrs:false};
}
