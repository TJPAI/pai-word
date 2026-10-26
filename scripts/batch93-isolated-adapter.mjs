// Batch93: isolated, display-only integration into the regular PAI Word learning UI.
// Language certification B216+B218 is already complete; no re-review or grading path.
export async function installBatch93Isolated({fetcher=fetch,scope=window,core=window.PAI_CORE}={}){
 const disabled={enabled:false,accepted:new Map(),reason:'isolation_off'};
 if(new URLSearchParams(location.search).get('batch93')!=='1'){scope.PAI_BATCH93_ISOLATED=disabled;return disabled}
 if(scope.PAI_CORE_QA?.release!=='Core20K-dev'||core?.words?.length!==20000||!(core.byKU instanceof Map))throw Error('BATCH93_CORE20K_REQUIRED');
 const response=await fetcher('rebuild-preview/batch93-sixku-isolated.json',{cache:'no-store'});
 if(!response.ok)throw Error('BATCH93_ASSET_HTTP_'+response.status);
 const pack=await response.json();
 if(pack.schema!=='pai-word-batch93-main-isolated-v1'||pack.mode!=='ISOLATED_MAIN_LEARNING_FLOW'||pack.production_ready!==false||pack.language_certified!==true||pack.records?.length!==6)throw Error('BATCH93_MANIFEST_INVALID');
 const accepted=new Map();
 for(const item of pack.records){
  const unit=core.byKU.get(item.ku_id),word=core.byRank.get(item.rank);
  if(!unit||!word||unit.w!==word||word.w!==item.headword||String(word.pos).trim()!==item.pos||unit.s.kuType!=='sense'||unit.s.playable!==true||accepted.has(item.ku_id))throw Error('BATCH93_IDENTITY:'+item.ku_id);
  if(item.registration!=='KU_ANCHORED_SENSE'||item.language_review!=='DUAL_AI_PASS'||!item.example_en||!item.example_zh||!item.gloss_zh||!item.gloss_en||!item.prompt||!Array.isArray(item.accepted_zh)||!item.accepted_zh.length)throw Error('BATCH93_CONTENT:'+item.ku_id);
  // No mutation of Core20K words, SRS keys, user settings or grading policy.
  accepted.set(item.ku_id,Object.freeze({...item}));
 }
 const result={enabled:true,accepted,reason:'six_ku_isolated',production_ready:false};
 scope.PAI_BATCH93_ISOLATED=result;
 return result;
}
