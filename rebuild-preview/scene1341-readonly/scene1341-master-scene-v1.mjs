/* Scene1341 generic Master scene payload v1.
 * Frontend is schema-driven: Master may refresh content without a CG-MAIN
 * build. No QA verdict may be synthesized from Master.
 */
const ID=/^SC50-(?:0[0-9]{3}|1[0-2][0-9]{2}|13[0-3][0-9]|134[01])$/;
const ROW=/^SC1341-FINAL-SRC-[0-9a-f]{32}$/;
const SOURCE_ROW_ID=n=>'SC1341-FINAL-ROW-'+String(n).padStart(6,'0');
const SHA=/^[0-9a-f]{40}$/;
const HASH64=/^[0-9a-f]{64}$/;
const fail=x=>{throw Error('MASTER_SCENE_V1_'+x)};
const ROOT='https://raw.githubusercontent.com/TJPAI/pai-word/';
const API='https://api.github.com/repos/TJPAI/pai-word/';
const BRANCH='cg-master-kaikki-evidence-intake-20261111';
const text=x=>typeof x==='string'?x.trim():'';
const list=x=>Array.isArray(x)?x.filter(v=>typeof v==='string'&&v.trim()).map(v=>v.trim()):[];
function normalized(row){
 const q=row.question_page||{},a=row.answer_page||{};
 const expression=text(q.expression||q.english_expression||row.expression);
 const meaning=text(a.meaning_display||a.meaning_zh||q.cue_zh);
 const pos=text(a.pos);
 // Keep POS inline once, never create a separate POS row or duplicate it.
 const inlinePos=pos&&meaning.startsWith(pos+' ')?'':pos;
 if(!expression)fail('EXPRESSION_'+row.source_final_row);
 return {
  scene_ku_id:row.record_id||SOURCE_ROW_ID(row.source_final_row),
  master_record_id:row.record_id||SOURCE_ROW_ID(row.source_final_row),
  master_final_row:row.source_final_row,source_rank:row.source_final_row,
  scene_id:row.scene_id,expression,
  master_content_sha256:HASH64.test(row.content_sha256||'')?row.content_sha256:undefined,
  question:{expression,cue_zh:text(q.cue_zh||a.meaning_zh),
   ipa:text(q.ipa||q.ipa_candidate)||null,
   ipa_status:'MASTER_PROVIDED_UNREVIEWED',ipa_provisional:true,
   ipa_candidates_pending:false,ipa_source:null},
  answer:{meaning_zh:meaning,pos:inlinePos,gloss_en:text(a.gloss_en),
   example_en:text(a.example_en),example_zh:text(a.example_zh),
   examples:Array.isArray(a.examples)?a.examples:[],
   collocations:list(a.collocations),usage_note:text(a.usage_note),
   grammar_note:text(a.grammar_note),common_mistakes:text(a.common_mistakes),
   register_note:text(a.register_note),contrast_note:text(a.contrast_note),
   synonyms:Array.isArray(a.synonyms)?a.synonyms:[],
   antonyms:Array.isArray(a.antonyms)?a.antonyms:[],
   synonyms_status:text(a.synonyms_status),antonyms_status:text(a.antonyms_status),
   sense_disambiguation:a.sense_disambiguation||null,
   content_complete:a.content_complete===true},
  display:{w:expression,m:meaning},qa_status:'DEFERRED_TEST_ONLY',
  master_scene_test_only:true,production_release_allowed:false
 };
}
export function validateMasterSceneDocument(doc,sceneId){
 if(!ID.test(sceneId))fail('SCENE_ID');
 if(doc?.schema_version!=='scene1341-master-scene/v1'||doc.scene_id!==sceneId||
  doc.release_allowed!==false||doc.srs_eligible!==false||
  !Number.isSafeInteger(doc.record_count)||doc.record_count<1||
  !Array.isArray(doc.records)||doc.records.length!==doc.record_count)fail('MANIFEST');
 const seen=new Set(),rows=new Set(),cards=[];
 for(const r of doc.records){
  if(!(r?.record_id===null||ROW.test(r?.record_id||''))||r.scene_id!==sceneId||
   !Number.isSafeInteger(r.source_final_row)||r.source_final_row<1||
   seen.has(r.record_id||SOURCE_ROW_ID(r.source_final_row))||rows.has(r.source_final_row)||
   r.release_allowed!==false||r.srs_eligible===true||
   (r.content_sha256!==undefined&&!HASH64.test(r.content_sha256)))fail('ROW');
  seen.add(r.record_id||SOURCE_ROW_ID(r.source_final_row));rows.add(r.source_final_row);
  cards.push(normalized(r));
 }
 return Object.freeze({sceneId,cards,recordCount:cards.length,canWriteSrs:false,formalReady:0});
}
async function blobHash(raw,cryptoImpl){
 if(!cryptoImpl?.subtle)fail('CRYPTO');
 const enc=new TextEncoder(),bytes=enc.encode(raw),header=enc.encode('blob '+bytes.length+'\0');
 const payload=new Uint8Array(header.length+bytes.length);
 payload.set(header);payload.set(bytes,header.length);
 const hash=await cryptoImpl.subtle.digest('SHA-1',payload);
 return [...new Uint8Array(hash)].map(v=>v.toString(16).padStart(2,'0')).join('');
}
export async function resolveMasterSceneIndex({fetchImpl=fetch}={}){
 let commit=null;
 try{
  const response=await fetchImpl(API+'branches/'+BRANCH,{cache:'no-store'});
  if(response.ok){const candidate=(await response.json())?.commit?.sha;if(SHA.test(candidate||''))commit=candidate}
 }catch(_error){/* Unauthenticated GitHub API may be blocked or rate limited on iPhone. */}
 // Fallback reads the published branch index directly. Per-scene immutable
 // Git blob SHA-1 from that index is still mandatory, so branch movement
 // cannot silently mix inconsistent documents.
 const base=ROOT+(commit||BRANCH)+'/';
 const url=base+'tools/scene1341_master/production/SCENE1341_LIVE_INDEX.json';
 const r=await fetchImpl(url,{cache:'no-store'});
 if(!r.ok)fail('INDEX_NOT_PUBLISHED_'+r.status);
 const index=await r.json();
 if(index.schema_version!=='scene1341-master-index/v1'||index.scene_count!==1341||
  index.source_associations!==230289||
  index.source_master_sha256!=='62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986'||
  index.release_allowed!==false||index.srs_eligible!==false||
  !index.scenes||Object.keys(index.scenes).length!==1341)fail('INDEX_CONTRACT');
 for(const [scene,entry] of Object.entries(index.scenes)){
  if(!ID.test(scene)||!Number.isSafeInteger(entry?.records)||entry.records<1||
   !SHA.test(entry.git_blob_sha1||'')||
   typeof entry.path!=='string'||!/^tools\/scene1341_master\/production\/scenes\/SC50-\d{4}\.json$/.test(entry.path)||
   entry.path!=='tools/scene1341_master/production/scenes/'+scene+'.json')fail('INDEX_SCENE');
 }
 if(Object.values(index.scenes).reduce((sum,v)=>sum+v.records,0)!==230289)fail('INDEX_TOTAL');
 return Object.freeze({commit:commit||BRANCH,index,canWriteSrs:false,formalReady:0,branchFallback:!commit});
}
// Optional human-readable release metadata is CG-MASTER-owned. It does not
// alter the frozen source identity or any CG-QA certification state.
export function masterReleaseView(index){
 const m=index?.master_release;
 if(!m||m.metadata_schema!=='scene1341-master-release/v1'||
    !/^V[0-9]{1,8}$/.test(m.version||'')||
    !/^\d{4}-\d{2}-\d{2}$/.test(m.published_date||'')||
    m.release_allowed!==false||m.srs_eligible!==false)return null;
 const changed=new Set(Array.isArray(m.changed_scene_ids)?
  m.changed_scene_ids.filter(x=>ID.test(x)&&index.scenes?.[x]):[]);
 const safe=x=>typeof x==='string'?x.trim().slice(0,140):'';
 const changes=Array.isArray(m.changes)?m.changes.slice(0,12).filter(x=>
  typeof x?.category==='string'&&Number.isSafeInteger(x?.count)&&x.count>=0)
  .map(x=>({category:safe(x.category),count:x.count})):[];
 return Object.freeze({
  version:m.version,date:m.published_date,
  label:'Master '+m.version+' · '+m.published_date,
  headline:safe(m.headline),changed,changes,stage:'待审 · 测试数据'
 });
}
export async function fetchMasterScene(snapshot,sceneId,{fetchImpl=fetch,cryptoImpl=globalThis.crypto}={}){
 if(!(SHA.test(snapshot?.commit||'')||snapshot?.commit===BRANCH)||!ID.test(sceneId))fail('REQUEST');
 const entry=snapshot.index.scenes[sceneId];
 if(!entry)fail('MISSING_SCENE');
 const response=await fetchImpl(ROOT+snapshot.commit+'/'+entry.path,{cache:'no-store'});
 if(!response.ok)fail('SCENE_HTTP_'+response.status);
 const raw=await response.text();
 if(await blobHash(raw,cryptoImpl)!==entry.git_blob_sha1)fail('SCENE_BLOB');
 const doc=validateMasterSceneDocument(JSON.parse(raw),sceneId);
 if(doc.recordCount!==entry.records)fail('SCENE_COUNT');
 return Object.freeze({...doc,sourceCommit:snapshot.commit});
}
export function mergeMasterScene(existing,scene){
 if(!Array.isArray(existing)||!scene?.sceneId||!Array.isArray(scene.cards))fail('MERGE');
 const outside=existing.filter(c=>c.scene_id!==scene.sceneId);
 const oldByRow=new Map();
 for(const card of existing.filter(c=>c.scene_id===scene.sceneId)){
  if(Number.isSafeInteger(card.master_final_row)){
   if(oldByRow.has(card.master_final_row))fail('DUPLICATE_PRIOR_SOURCE_ROW');
   oldByRow.set(card.master_final_row,card);
  }
 }
 const cards=scene.cards.map(card=>{
  const prior=oldByRow.get(card.master_final_row);
  if(!prior)return card;
  if(prior.expression.normalize('NFKC').toLowerCase()!==card.expression.normalize('NFKC').toLowerCase())fail('IDENTITY_DRIFT');
  // Master remains authoritative for source meaning and all future populated fields.
  // Legacy authored L2/L3 enrichment survives ONLY for an exact source row,
  // expression AND matching normalized meaning. Never transplant stale semantics.
  const norm=x=>String(x||'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
  const oldMeaning=norm(prior.answer?.meaning_zh).replace(/^(?:n|v|adj|adv|prep|pron|conj|interj)\.\s*/,'');
  const newMeaning=norm(card.answer?.meaning_zh).replace(/^(?:n|v|adj|adv|prep|pron|conj|interj)\.\s*/,'');
  if(!oldMeaning||!newMeaning||oldMeaning!==newMeaning)return card;
  const oldAnswer=prior.answer||{},newAnswer=card.answer;
  const keep=(key)=>newAnswer[key]||oldAnswer[key]||'';
  const keepArray=(key)=>Array.isArray(newAnswer[key])&&newAnswer[key].length?newAnswer[key]:
   (Array.isArray(oldAnswer[key])?oldAnswer[key]:[]);
  return {...card,answer:{...newAnswer,
   gloss_en:keep('gloss_en'),example_en:keep('example_en'),example_zh:keep('example_zh'),
   examples:keepArray('examples'),collocations:keepArray('collocations'),
   usage_note:keep('usage_note'),grammar_note:keep('grammar_note'),
   common_mistakes:keep('common_mistakes'),register_note:keep('register_note'),
   contrast_note:keep('contrast_note'),
   synonyms:keepArray('synonyms'),antonyms:keepArray('antonyms'),
   synonyms_status:keep('synonyms_status'),antonyms_status:keep('antonyms_status'),
   sense_disambiguation:newAnswer.sense_disambiguation||oldAnswer.sense_disambiguation||null,
   content_complete:newAnswer.content_complete===true||oldAnswer.content_complete===true},
   // QA/IPA/release state always comes from the new verified Master projection.
   qa_status:card.qa_status,question:card.question,
   production_release_allowed:false};
 });
 return [...outside,...cards].sort((a,b)=>a.scene_id.localeCompare(b.scene_id)||
  (a.source_rank??a.master_final_row??0)-(b.source_rank??b.master_final_row??0));
}
