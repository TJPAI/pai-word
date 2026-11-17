/* Read-only Scene1341 Master enrichment for the source-exact Scene500
 * native answer shell. No QA verdict derivation, data mutation, SRS or release.
 * Keeps bilingual examples and source-pinned gloss/usage absent from Scene500.
 */
(function(root){
 'use strict';
 const clean=x=>typeof x==='string'?x.trim():'';
 const badMeta=/待独立审核|尚未独立审核|待复核|待审核|审核状态|QA状态|审核通过|发布门禁|作者草稿|待认证|未认证|release[_ -]?status|source[_ -]?rank/i;
 const safe=x=>{const value=clean(x);return badMeta.test(value)?'':value};
 const freeze=v=>Object.freeze(v);
 function project(answer,prefs={},validated=null){
  const a=answer&&typeof answer==='object'?answer:{};
  const view=validated||root.PAI_SCENE1341_V188_ANSWER?.project(a);
  if(!view)throw Error('SC1341_RICH_ANSWER_VALIDATOR_REQUIRED');
  const examples=prefs.showExamples===false?[]:(Array.isArray(view.examples)?view.examples:[]).slice(0,3)
   .map(e=>freeze({en:safe(e.en),zh:prefs.showExampleTranslations===false?'':safe(e.zh)}))
   .filter(e=>e.en);
  const gloss=prefs.showEnglishDefinition===false?'':safe(a.gloss_en);
  const synonyms=prefs.showRelations===false?[]:(Array.isArray(view.synonyms)?view.synonyms:[]).map(safe).filter(Boolean);
  const antonyms=prefs.showRelations===false?[]:(Array.isArray(view.antonyms)?view.antonyms:[]).map(safe).filter(Boolean);
  const distinction=prefs.showCompare===false?'':safe(view.distinction);
  // Source text fields only: independently certified QA flags are resolved elsewhere.
  return freeze({gloss,examples:freeze(examples),synonyms:freeze(synonyms),
   antonyms:freeze(antonyms),distinction,readOnly:true,srsEligible:false});
 }
 function append(slot,projected,doc=slot?.ownerDocument){
  if(!slot||!doc||!projected?.readOnly||projected.srsEligible!==false)
   throw Error('SC1341_RICH_ANSWER_NOT_QUARANTINED');
  const section=(label,kind)=>{
   const container=doc.createElement('div');container.className='answer-section';
   container.dataset.masterEnrichment=kind;
   const heading=doc.createElement('div');heading.className='answer-label';heading.textContent=label;
   container.append(heading);slot.append(container);return container;
  };
  if(projected.gloss){
   const container=section('英文释义','gloss');
   const el=doc.createElement('div');el.className='definition';el.textContent=projected.gloss;container.append(el);
  }
  if(projected.examples.length){
   const container=section('双语例句','examples');container.classList.add('examples-section');
   for(const [i,e] of projected.examples.entries()){
    const row=doc.createElement('div');row.className='example';
    const number=doc.createElement('span');number.className='example-num';number.textContent=String(i+1)+'.';
    const text=doc.createElement('div');text.className='example-text';
    const en=doc.createElement('div');en.className='example-en';en.textContent=e.en;text.append(en);
    if(e.zh){const zh=doc.createElement('div');zh.className='example-translation';zh.textContent=e.zh;text.append(zh)}
    const speak=doc.createElement('button');speak.type='button';
    speak.className='example-play';speak.dataset.exampleAudio=e.en;
    speak.dataset.speak=e.en;speak.setAttribute('aria-label','播放例句 '+(i+1));
    speak.textContent='🔊';row.append(number,text,speak);container.append(row);
   }
  }
  if(projected.synonyms.length||projected.antonyms.length){
   const container=section('相关表达','relations');
   const el=doc.createElement('div');el.className='definition';
   el.textContent=[
    projected.synonyms.length?'同义词：'+projected.synonyms.join(' · '):'',
    projected.antonyms.length?'反义词：'+projected.antonyms.join(' · '):''
   ].filter(Boolean).join('；');container.append(el);
  }
  if(projected.distinction){
   const container=section('词义辨析','distinction');
   const el=doc.createElement('div');el.className='definition';el.textContent=projected.distinction;container.append(el);
  }
  return slot;
 }
 root.PAI_SCENE1341_NATIVE_ANSWER_RICH=freeze({project,append});
})(typeof window!=='undefined'?window:globalThis);
