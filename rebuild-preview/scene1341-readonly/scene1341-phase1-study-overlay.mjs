/* Source-bound Phase1 TEST ONLY learning cards. Existing Scene500 UX stays intact.
 * Not an approval of editor examples, Sense or IPA; zero SRS and release.
 */
const RECORD=/^SC1341-FINAL-SRC-[a-f0-9]{32}$/;
const SHA=/^[a-f0-9]{64}$/;
const SCENE=/^SC50-000[1-5]$/;
const SOURCE='4d03b6cba283744756c57ff661c2c6cbfe34fcf8ff513a966576cf7d97e91a99';
const normalize=x=>String(x||'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
const safeIPA=x=>typeof x==='string'&&x.startsWith('/')&&x.endsWith('/')&&x.length>2&&!x.includes(String.fromCharCode(10))&&!x.includes(String.fromCharCode(13))&&x.slice(1,-1).trim().length>0;
const fail=x=>{throw Error('PHASE1_STUDY_'+x)};
function exampleRows(rows){
 if(!Array.isArray(rows))return [];
 return rows.filter(x=>x&&typeof x.example_en==='string'&&x.example_en.trim()&&
  typeof x.example_zh==='string'&&x.example_zh.trim()&&
  x.source==='CG_MASTER_NEW_EDITOR_ORIGINAL_NOT_KAIKKI_ATTESTATION'&&
  x.qa_status==='待审').map(x=>({example_en:x.example_en,example_zh:x.example_zh,
   source:'CGMASTER_EDITOR_UNREVIEWED'})).slice(0,3);
}
export function applyPhase1StudyOverlay(baseCards,fresh,{strict=true}={}){
 if(!Array.isArray(baseCards)||!Array.isArray(fresh?.rows)||
    fresh.onlyDiagnostic!==true||fresh.canWriteSrs!==false||fresh.formalReady!==0||
    fresh.rows.length<203||fresh.rows.length>1241)fail('SOURCE_CONTRACT');
 const byId=new Map(),byRow=new Map(),sourceIDs=new Set();
 for(const row of fresh.rows){
  if(!RECORD.test(row?.record_id||'')||!SCENE.test(row.scene_id||'')||
    !Number.isSafeInteger(row.source_final_row)||row.source_final_row<1||row.source_final_row>1241||
    !SHA.test(row.content_sha256||'')||sourceIDs.has(row.record_id)||
    row.source_evidence?.archive_sha256!==SOURCE||
    row.qa_stage_label!=='待审'||row.qa_first_review_verdict!==null||
    row.formal_ready!==0||row.srs_eligible!==false||row.release_allowed!==false)fail('EDITOR_ROW');
  sourceIDs.add(row.record_id);
  if(byRow.has(row.source_final_row))fail('DUPLICATE_SOURCE_ROW');
  byRow.set(row.source_final_row,row);
  byId.set(row.record_id,row);
 }
 if(byId.size!==fresh.rows.length)fail('IDENTITY_COUNT');
 const matched=new Set(),perScene={},items=baseCards.map(card=>{
  const row=byId.get(card.master_record_id);
  if(!row)return card;
  // Exact stable Master association, including original source row and phrase.
  // Invalid match is HOLD and must never use another Sense's teaching content.
  if(card.scene_id!==row.scene_id||card.master_final_row!==row.source_final_row||
     normalize(card.expression)!==normalize(row.question_page?.english_expression)||
     normalize(card.question?.cue_zh)!==normalize(row.question_page?.cue_zh)||
     normalize(card.answer?.meaning_zh)!==normalize(row.answer_page?.meaning_zh))
   return card;
  if(matched.has(row.record_id))fail('DUPLICATE_CARD_ID');
  matched.add(row.record_id);
  perScene[row.scene_id]=(perScene[row.scene_id]||0)+1;
  const q=row.question_page,a=row.answer_page,src=row.source_evidence;
  if(src.kaikki_lemma!==q.english_expression||src.kaikki_pos!==a.pos||
     src.native_gloss!==a.gloss_en||!a.gloss_en?.trim())fail('NATIVE_SOURCE_MISMATCH');
  const candidates=Array.isArray(q.ipa_native_all_phonemic_candidates)?q.ipa_native_all_phonemic_candidates:[];
  const ipa=q.ipa_source_status==='NATIVE_EXACT_PHONEMIC_SINGLE_UNREVIEWED'&&
   candidates.length===1&&q.ipa===candidates[0]&&safeIPA(q.ipa)?q.ipa:null;
  const examples=exampleRows(a.examples);
  const nextAnswer={
   meaning_zh:a.meaning_zh,gloss_en:a.gloss_en,pos:a.pos,
   examples,example_en:examples[0]?.example_en||'',example_zh:examples[0]?.example_zh||'',
   collocations:Array.isArray(a.collocations)?a.collocations.filter(x=>typeof x==='string'&&x.trim()):[],
   usage_note:typeof a.usage_note==='string'?a.usage_note:'',
   synonyms:Array.isArray(a.synonyms)?a.synonyms:[],
   antonyms:Array.isArray(a.antonyms)?a.antonyms:[],
   sense_disambiguation:a.sense_disambiguation||null,
   content_complete:a.answer_complete===true
  };
  return {...card,question:{...card.question,expression:q.english_expression,cue_zh:q.cue_zh,
     ipa,ipa_status:ipa?'PHASE1_KAIKKI_NATIVE_SINGLE_UNREVIEWED':'PHASE1_KAIKKI_IPA_HOLD',
     ipa_provisional:Boolean(ipa),ipa_source:{source_type:'PHASE1_KAIKKI_SOURCE_EXACT_TEST',
      archive_sha256:SOURCE,source_final_row:row.source_final_row,
      record_id:row.record_id,kaikki_raw_line:src.kaikki_exact_raw_line},
     ipa_candidates_pending:!ipa},
   answer:nextAnswer,display:{w:q.english_expression,m:a.meaning_zh},
   master_content_sha256:row.content_sha256,master_phase1_source:'KAIKKI_FRESH_EDITOR_TEST',
   master_phase1_version:fresh.version,production_release_allowed:false,
   qa_status:'DEFERRED_TEST_ONLY'};
 });
 const held=fresh.rows.length-matched.size;
 if(strict&&(matched.size===0||matched.size+held!==fresh.rows.length))fail('MATCH_COUNT');
 return Object.freeze({items:Object.freeze(items),matched:matched.size,held,
  perScene:Object.freeze(perScene),sourceCommit:fresh.commit,
  formalReady:0,canWriteSrs:false,onlyTest:true});
}
