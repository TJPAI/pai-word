/* Scene1341 V188 answer presentation adapter.
 * No fabricated examples, no candidate Sense promotion, no persistent writes.
 * Allows legacy single-example cards and source-verified 1–3 example arrays.
 */
(function(global){
 'use strict';
 const clean=v=>typeof v==='string'?v.trim():'';
 const badMeta=/待独立审核|尚未独立审核|待复核|待审核|审核状态|QA状态|审核通过|发布门禁|作者草稿|待认证|未认证|release[_ -]?status|source[_ -]?rank/i;
 function examples(answer){
  const supplied=Array.isArray(answer?.examples)?answer.examples:[];
  const list=supplied.map(item=>({
   en:clean(item?.example_en),zh:clean(item?.example_zh)
  })).filter(x=>x.en&&x.zh&&!badMeta.test(x.en)&&!badMeta.test(x.zh));
  if(list.length>3)throw Error('SC1341_V188_EXAMPLES_OVER_3');
  if(list.length)return list;
  const en=clean(answer?.example_en),zh=clean(answer?.example_zh);
  return en&&zh&&!badMeta.test(en)&&!badMeta.test(zh)?[{en,zh}]:[];
 }
 function relations(answer,field){
  const values=answer?.[field];
  if(!Array.isArray(values))return [];
  if(values.length>12)throw Error('SC1341_V188_RELATION_OVER_LIMIT');
  // Candidate/unknown relationships must never appear as editorial fact.
  const approval=answer?.[field+'_status'];
  if(!['VERIFIED','QA_PASS','APPROVED'].includes(approval))return [];
  return values.map(x=>typeof x==='string'?x:clean(x?.expression||x?.word))
   .map(clean).filter(x=>x&&!badMeta.test(x));
 }
 function distinction(answer){
  const x=answer?.sense_disambiguation;
  if(!x||typeof x!=='object'||!['VERIFIED','QA_PASS','APPROVED'].includes(x.status))return '';
  const note=clean(x.note_zh);
  return note&&!badMeta.test(note)?note:'';
 }
 function project(answer){
  const result={examples:examples(answer),synonyms:relations(answer,'synonyms'),
   antonyms:relations(answer,'antonyms'),distinction:distinction(answer)};
  return Object.freeze(result);
 }
 global.PAI_SCENE1341_V188_ANSWER=Object.freeze({project});
})(window);
