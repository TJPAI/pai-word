/* CG-MAIN Scene1341 answer-only provisional intake. NOT a release gate.
 * Enforces real CG-QA source identity and rejects undeclared Master approval.
 * Does not mutate author drafts, user SRS, or existing approved runtime.
 */
const SHA=/^[0-9a-f]{40}$/, KU=/^SC1341-KU-\d{5,}$/, SC=/^SC50-\d{4}$/;
const reject=(reason)=>Object.freeze({accepted:false,stagingEligible:false,reason});
const required=['scene_ku_id','scene_id','source_sense_id','expression','source_pack_path','source_pack_blob'];
export function inspectScene1341ProvisionalRecord(record,authorization=null){
 if(!record||required.some(key=>typeof record[key]!=='string'||!record[key].trim())||
   !KU.test(record.scene_ku_id)||!SC.test(record.scene_id)||
   !Number.isSafeInteger(record.source_rank)||record.source_rank<1||
   !SHA.test(record.source_pack_blob))return reject('INVALID_SOURCE_IDENTITY');
 if(record.cg_qa!=='PASS'||record.muse_qa!=='DEFERRED_QUOTA_20261113'||
    record.release_status!=='PROVISIONAL_PENDING_MUSE'||
    record.muse_recheck_required!==true||record.author_draft!==true||
    record.production_release_allowed!==false||
    record.source_master_authorization_verified!==false)
   return reject('NOT_ELIGIBLE_FOR_PROVISIONAL_INTAKE');
 if(Object.hasOwn(record,'question')||
    typeof record.answer?.meaning_zh!=='string'||!record.answer.meaning_zh.trim()||
    typeof record.answer?.example_en!=='string'||!record.answer.example_en.trim()||
    typeof record.answer?.example_zh!=='string'||!record.answer.example_zh.trim()||
    !Array.isArray(record.answer.collocations))
   return reject('INVALID_ANSWER_ONLY_PAYLOAD');
 const display=record.display;
 if(!display||display.w!==record.expression||display.m!==record.answer.meaning_zh||
    display.e!==record.answer.example_en||display.example_zh!==record.answer.example_zh)
   return reject('DISPLAY_SOURCE_MISMATCH');
 const visible=[display.w,display.m,display.e,display.example_zh,display.x,record.answer.usage_note]
   .filter(x=>typeof x==='string').join(' ');
 if(/待独立审核|尚未独立审核|待复核|待审核|审核状态|QA状态|发布门禁|作者草稿|待认证|未认证|release[_ -]?status|source[_ -]?rank/i.test(visible))
   return reject('LEARNER_VISIBLE_EDITORIAL_NOTES');
 if(!authorization)return Object.freeze({accepted:true,stagingEligible:false,
   reason:'MASTER_AUTHORIZATION_AND_DISPLAY_QA_PENDING'});
 // Explicit external CG-MASTER approval must match THIS KU's full identity and
 // source blob; comments, verbal permission and lexical form matches never count.
 if(authorization.status!=='APPROVED_FOR_ISOLATED_STAGING'||
    authorization.ku_id!==record.scene_ku_id||
    authorization.scene_id!==record.scene_id||
    authorization.source_sense_id!==record.source_sense_id||
    authorization.source_rank!==record.source_rank||
    authorization.source_pack_blob!==record.source_pack_blob||
    !SHA.test(authorization.master_snapshot_blob||'')||
    !SHA.test(authorization.approval_evidence_blob||'')||
    authorization.display_qa_pass!==true)
   return reject('MASTER_AUTHORIZATION_MISMATCH_OR_DISPLAY_NOT_APPROVED');
 return Object.freeze({accepted:true,stagingEligible:true,reason:'STAGING_ONLY_CG_PASS_MUSE_DEFERRED'});
}
export function inspectScene1341ProvisionalShard({shard,pin,blob,masterAuthorizations={}}={}){
 if(!pin||pin.schema!=='scene1341-provisional-intake-pin-v1'||pin.not_public_release!==true||
    pin.not_production_srs!==true||pin.status!=='QUARANTINED'||pin.release_approved!==0)
   throw Error('SCENE1341_PROVISIONAL_INVALID_PIN');
 const expected=pin.shards.find(s=>s.path===shard?.__path);
 if(!expected||expected.blob!==blob||!SHA.test(blob||'')||
   shard?.schema!=='cg-qa-v51-staging-answer-provisional-shard-v1'||
   !Array.isArray(shard.records)||shard.records.length!==expected.records||
   shard.records.length!==shard.counts?.included||
   shard.source_candidate_index_blob!=='9cfcbd01ed7f2f6454d7a6559a522f2cf142248e')
   throw Error('SCENE1341_PROVISIONAL_SHARD_SOURCE_OR_COUNT_MISMATCH');
 const uniqueKu=new Set(),uniqueRank=new Set(),decisions=[];
 for(const record of shard.records){
  const key=record.scene_id+':'+record.source_rank;
  if(uniqueKu.has(record.scene_ku_id)||uniqueRank.has(key))
   throw Error('SCENE1341_PROVISIONAL_DUPLICATE_ID');
  uniqueKu.add(record.scene_ku_id);uniqueRank.add(key);
  const decision=inspectScene1341ProvisionalRecord(record,masterAuthorizations[record.scene_ku_id]||null);
  decisions.push(Object.freeze({ku_id:record.scene_ku_id,decision}));
 }
 const accepted=decisions.filter(x=>x.decision.accepted).length,
   stagingEligible=decisions.filter(x=>x.decision.stagingEligible).length;
 return Object.freeze({source:shard.__path,records:decisions.length,accepted,
  stagingEligible,quarantined:decisions.length-stagingEligible,
  formalReleaseEligible:0,decisions:Object.freeze(decisions)});
}
