/* CG-MASTER V193 verified selected-IPA risk quarantine.
 * The immutable V190 row 506 'take off' is incorrectly labelled with
 * /ˌpʊt ˈɒn/ ('put on'). Suppress, do not guess a new pronunciation.
 * Applies AFTER any version/fallback intake, before learner rendering.
 */
const ROW506=Object.freeze({
 record_id:'SC1341-FINAL-SRC-a0b391ca46f5d231e41d1e8205d62ccd',
 source_final_row:506,
 scene_id:'SC50-0003',
 expression:'take off'
});
const norm=v=>String(v??'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
export function applyMasterSelectedIpaQuarantine(cards){
 if(!Array.isArray(cards))throw Error('MASTER_QUARANTINE_INVALID_CARDS');
 let suppressed=0;
 const items=cards.map(card=>{
  if(card?.master_record_id!==ROW506.record_id)return card;
  // Never apply a source risk finding to another identity. If a record is
  // suspiciously remapped, hide IPA rather than accidentally certifying it.
  if(card.master_final_row!==ROW506.source_final_row||card.scene_id!==ROW506.scene_id||
     norm(card.expression)!==ROW506.expression)
   throw Error('MASTER_QUARANTINE_IDENTITY_DRIFT');
  suppressed++;
  return {...card,question:{...card.question,ipa:'',
   ipa_status:'HOLD_MASTER_V193_SELECTED_IPA_MISMATCH',
   ipa_provisional:true,master_live_ipa_test:false,
   master_live_ipa_quarantine:true,
   ipa_source:{source_type:'CGMASTER_V193_QUARANTINE',
    source_final_row:ROW506.source_final_row,record_id:ROW506.record_id,
    reason:'WRONG_HEADWORD_PUT_ON_SELECTED_FOR_TAKE_OFF',
    qa_approved:false,sense_match_approved:false}},
   production_release_allowed:false};
 });
 if(suppressed>1)throw Error('MASTER_QUARANTINE_DUPLICATE_RECORD');
 return Object.freeze({items,suppressed,formalReady:0,canWriteSrs:false});
}
