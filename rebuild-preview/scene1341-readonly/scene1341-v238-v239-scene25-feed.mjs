/* CG-MASTER V238/V239 scene-first L1 TEST feed.
 * Exact association IDs, immutable Git blob SHA1 and cohort totals checked;
 * never turn CMU composed IPA into Kaikki/native/approved IPA.
 */
const REPO='https://api.github.com/repos/TJPAI/pai-word/';
const RAW='https://raw.githubusercontent.com/TJPAI/pai-word/';
const BRANCH='cg-master-kaikki-evidence-intake-20261111';
const PREFIX='tools/scene1341_master/qa_reports/';
const SHA40=/^[0-9a-f]{40}$/, RECORD=/^SC1341-FINAL-SRC-[0-9a-f]{32}$/;
const COHORTS=[{version:'V239',numbers:[6,7,8,9,10,15,16],count:1686},
 {version:'V238',numbers:[17,18,19,20,21,22,23,24,25],count:2256}];
const ROOT_MASTER='62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986';
const ROOT_KAIKKI='4d03b6cba283744756c57ff661c2c6cbfe34fcf8ff513a966576cf7d97e91a99';
const fail=s=>{throw Error('SCENE25_TEST_'+s)};
const normalize=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
function pathFor(cohort,n){return PREFIX+'CGMASTER_'+cohort.version+'_SC50-'+String(n).padStart(4,'0')+'_L1_TEST_PAGES_20261115.json'}
async function blobHash(raw,cryptoImpl){
 if(!cryptoImpl?.subtle)fail('CRYPTO');
 const enc=new TextEncoder(),body=enc.encode(raw),prefix=enc.encode('blob '+body.length+'\0');
 const bytes=new Uint8Array(prefix.length+body.length);bytes.set(prefix);bytes.set(body,prefix.length);
 const sha=await cryptoImpl.subtle.digest('SHA-1',bytes);
 return [...new Uint8Array(sha)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export function validateScene25Documents(docs){
 if(!Array.isArray(docs)||docs.length!==16)fail('DOC_COUNT');
 const rows=new Map(),sourcePositions=new Set(),perScene={};let count238=0,count239=0;
 for(const d of docs){
  const scene=d?.scene_id,version=d?.version;
  const group=COHORTS.find(x=>x.version===version);
  if(!group||!group.numbers.some(n=>'SC50-'+String(n).padStart(4,'0')===scene)||
     d.qa_stage!=='待审'||d.release_allowed!==false||
     !Number.isSafeInteger(d.record_count)||d.record_count!==d.records?.length||
     perScene[scene]!==undefined)fail('DOC');
  perScene[scene]=d.records.length;
  for(const r of d.records){
   if(!RECORD.test(r?.record_id||'')||r.scene_id!==scene||
    !Number.isSafeInteger(r.source_final_row)||r.source_final_row<1242||
    rows.has(r.record_id)||sourcePositions.has(r.source_final_row)||
    !r.question_page?.expression?.trim()||!r.answer_page?.meaning_zh?.trim()||
    r.question_page.ipa_approved!==false||r.question_page.qa_label!=='待审'||
    r.answer_page.qa_label!=='待审'||r.complete!==false||
    r.formal_ready!==0||r.release_allowed!==false||
    r.coverage_level!=='L1_SOURCE_CUE_WITH_TEST_IPA'||
    !Array.isArray(r.answer_page.examples)||r.answer_page.examples.length!==0)fail('ROW_'+r?.source_final_row);
   rows.set(r.record_id,r);sourcePositions.add(r.source_final_row);
  }
  if(version==='V238')count238+=d.records.length;else count239+=d.records.length;
 }
 if(count238!==2256||count239!==1686||rows.size!==3942||
    Object.keys(perScene).length!==16)fail('COHORT_TOTAL');
 return {rows,perScene,sourceCount:3942};
}
export async function fetchScene25TestFeed({fetchImpl=fetch,cryptoImpl=globalThis.crypto}={}){
 const res=await fetchImpl(REPO+'branches/'+BRANCH,{cache:'no-store'});
 if(!res.ok)fail('BRANCH_HTTP_'+res.status);
 const commit=(await res.json())?.commit?.sha;
 if(!SHA40.test(commit||''))fail('BRANCH_SHA');
 const stateRes=await fetchImpl(RAW+commit+'/tools/scene1341_master/CGMASTER_CURRENT_STATE.json',{cache:'no-store'});
 if(!stateRes.ok)fail('STATE_HTTP_'+stateRes.status);
 const state=await stateRes.json(),phase=state.phase1;
 if(state.schema!=='cgmaster-current-state/v1'||state.role!=='CG-MASTER'||
  state.branch!==BRANCH||state.sources?.original_final_master_sha256!==ROOT_MASTER||
  state.sources?.raw_kaikki_archive_sha256!==ROOT_KAIKKI||
  phase?.v238_scene_first_test_pages?.rows!==2256||
  phase?.v239_scene_first_test_pages?.rows!==1686||
  phase.v238_scene_first_test_pages.release_allowed!==false||
  phase.v239_scene_first_test_pages.release_allowed!==false)fail('STATE');
 const docs=await Promise.all(COHORTS.flatMap(c=>c.numbers.map(async n=>{
  const path=pathFor(c,n);
  const metaResponse=await fetchImpl(REPO+'contents/'+path+'?ref='+commit,{cache:'no-store'});
  if(!metaResponse.ok)fail('META_HTTP_'+metaResponse.status+'_'+n);
  const meta=await metaResponse.json();
  if(meta.type!=='file'||meta.path!==path||!SHA40.test(meta.sha||'')||
     meta.size<100||meta.size>1500000)fail('META_'+n);
  const dataRes=await fetchImpl(RAW+commit+'/'+path,{cache:'no-store'});
  if(!dataRes.ok)fail('DATA_HTTP_'+dataRes.status+'_'+n);
  const raw=await dataRes.text();
  if(new TextEncoder().encode(raw).length!==meta.size||
   await blobHash(raw,cryptoImpl)!==meta.sha)fail('BLOB_'+n);
  const doc=JSON.parse(raw);
  if(doc.version!==c.version||doc.scene_id!=='SC50-'+String(n).padStart(4,'0'))fail('SCENE_'+n);
  return doc;
 })));
 return {...validateScene25Documents(docs),commit,onlyTest:true,canWriteSrs:false,formalReady:0};
}
export function applyScene25TestFeed(baseCards,feed){
 if(!Array.isArray(baseCards)||feed?.onlyTest!==true||feed.canWriteSrs!==false||
 feed.formalReady!==0||feed.rows?.size!==3942)fail('INPUT');
 const oldById=new Map(baseCards.map(x=>[x.master_record_id,x]));
 if(oldById.size!==baseCards.length)fail('DUPLICATE_BASE');
 const oldPositions=new Set(baseCards.map(x=>x.master_final_row));
 const extra=[];let matched=0,appended=0;
 for(const r of feed.rows.values()){
  const existing=oldById.get(r.record_id);
  if(existing){
   if(existing.scene_id!==r.scene_id||existing.master_final_row!==r.source_final_row||
    normalize(existing.expression)!==normalize(r.question_page.expression))fail('BASE_IDENTITY_'+r.source_final_row);
   matched++;continue; // Preserve richer V116/V171/V190 existing data.
  }
  if(oldPositions.has(r.source_final_row))fail('SOURCE_ROW_CONFLICT_'+r.source_final_row);
  oldPositions.add(r.source_final_row);
  const word=r.question_page.expression,meaning=r.answer_page.meaning_zh;
  extra.push({scene_ku_id:r.record_id,master_record_id:r.record_id,
   master_final_row:r.source_final_row,scene_id:r.scene_id,
   source_rank:r.source_final_row,expression:word,
   question:{expression:word,cue_zh:meaning,ipa:null,
    ipa_status:'CMU_TEST_IPA_HOLD_NOT_NATIVE',ipa_candidates_pending:true,
    ipa_provisional:false,ipa_source:null},
   answer:{meaning_zh:meaning,pos:'',gloss_en:'',examples:[],example_en:'',example_zh:'',
    collocations:[],usage_note:'',content_complete:false},
   display:{w:word,m:meaning},qa_status:'DEFERRED_TEST_ONLY',
   production_release_allowed:false,master_scene_test_only:true});
  appended++;
 }
 if(matched+appended!==3942||appended<1)fail('MATCH_TOTAL');
 const items=[...baseCards,...extra].sort((a,b)=>
   a.scene_id.localeCompare(b.scene_id)||a.source_rank-b.source_rank);
 return {items,matched,appended,total:items.length,sourceCommit:feed.commit,
   onlyTest:true,canWriteSrs:false,formalReady:0};
}
