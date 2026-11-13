/* Read-only Scene1341 native answer renderer pilot.
 * SOURCE-SYNCHRONIZED exact answerHtml function extracted verbatim from
 * rebuild-preview/learning-runtime.js; CI must verify byte identity.
 * No Scene500 state, registry, SRS or study queue is loaded here.
 * DO NOT label this as shared runtime controller: only the renderer body matches.
 */
(function(root){
 'use strict';
 const state={showCollocations:true,showExamples:true,showCompare:true};
 const escapeHtml=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;')
   .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
 const contrastData=()=>({items:[]});
 // Deliberately isolated lexical window, so the original renderer's
 // approved-overlay lookup cannot read production overlays.
 const window={PAI_APPROVED_TEACHING_OVERLAY:null};
  window.answerHtml=function(u){
    const compare=contrastData(u),enabledCount=[state.showCollocations,state.showExamples,state.showCompare].filter(Boolean).length;
    const pos=(u.s.pos||u.w.pos)?`<span class="pos-chip">${escapeHtml(u.s.pos||u.w.pos)}</span>`:'';
    const otherMeanings=(u.w.allSenses||[]).filter(s=>!s[4]).map(s=>s[2]);
    const extra=otherMeanings.length?`<details class="answer-section"><summary>其他释义</summary>${otherMeanings.map(m=>`<div>${escapeHtml(m)}</div>`).join('')}</details>`:'';
    const reminder=u.s.x?`<div class="key-reminder"><span>提醒</span>${escapeHtml(u.s.x)}</div>`:'';
    const collocations=state.showCollocations&&u.s.c?`<div class="answer-section"><div class="answer-label">${u.w.allSenses?.length>1?'词条搭配（含不同义项）':'高频搭配'}</div><div class="collocations">${escapeHtml(u.s.c)}</div></div>`:'';
    const examples=state.showExamples&&Array.isArray(u.s.e)&&u.s.e.length?`<div class="answer-section examples-section"><div class="answer-label">${u.w.allSenses?.length>1?'词条例句（含不同义项）':'例句'}</div>${u.s.e.map((e,i)=>`<div class="example"><span class="example-num">${i+1}.</span><span>${escapeHtml(e)}</span><button type="button" class="example-play" data-example-audio data-speak="${escapeHtml(u.s.exampleAudio?.[i]||e)}" aria-label="播放例句 ${i+1}">🔊</button></div>`).join('')}</div>`:'';
    // Answer-only Scene1341 KU may carry the verified bilingual example pair.
    // Keep the existing answer panel, do not alter prompts or scoring.
    const scene1341ExampleZh=u.s.kuType==='scene1341'&&state.showExamples&&
      typeof u.s.example_zh==='string'&&u.s.example_zh.trim()
      ?`<div class="answer-section scene1341-example-translation"><div class="answer-label">例句翻译</div><div class="example-translation">${escapeHtml(u.s.example_zh)}</div></div>`:'';
    // B217: approved overlays add display content only; never modify KU or SRS.
    const approvedOverlay=window.PAI_APPROVED_TEACHING_OVERLAY;
    const approvedCard=approvedOverlay?.enabled===true&&approvedOverlay.accepted instanceof Map?approvedOverlay.accepted.get(u.s.ku_id):null;
    // Enrich the EXISTING answer page only; optional certified fields never alter learning state.
    const certifiedText=(key)=>typeof approvedCard?.[key]==='string'?approvedCard[key].trim():'';
    const runtimeGloss=typeof u.s.definition==='string'?u.s.definition.trim():'';
    const approvedGlossText=certifiedText('gloss_en')||(/^core modern learner use of\s*[“"']/i.test(runtimeGloss)?'':runtimeGloss);
    const approvedGloss=approvedGlossText?`<div class="answer-section" data-approved-gloss-ku="${escapeHtml(u.s.ku_id)}"><div class="answer-label">英文释义</div><div class="definition">${escapeHtml(approvedGlossText)}</div></div>`:'';
    const approvedExamples=approvedCard&&state.showExamples&&certifiedText('example_en')?`<div class="answer-section examples-section" data-approved-teaching-ku="${escapeHtml(u.s.ku_id)}"><div class="answer-label">认证教学例句</div><div class="example"><span class="example-num">1.</span><div class="example-text"><div class="example-en">${escapeHtml(certifiedText('example_en'))}</div>${certifiedText('example_zh')?`<div class="example-translation">${escapeHtml(certifiedText('example_zh'))}</div>`:''}</div><button type="button" class="example-play" data-example-audio data-speak="${escapeHtml(certifiedText('example_en'))}" aria-label="播放例句 1">🔊</button></div></div>`:'';
    const approvedUsage=approvedCard&&state.showCollocations&&certifiedText('collocation')?`<div class="answer-section" data-approved-collocation-ku="${escapeHtml(u.s.ku_id)}"><div class="answer-label">典型搭配</div><div class="collocations">${escapeHtml(certifiedText('collocation'))}</div></div>`:'';
    const approvedGrammar=certifiedText('grammar_note')?`<div class="answer-section" data-approved-grammar-ku="${escapeHtml(u.s.ku_id)}"><div class="answer-label">语法与用法</div><div class="definition">${escapeHtml(certifiedText('grammar_note'))}</div></div>`:'';
    const approvedContrast=state.showCompare&&certifiedText('contrast_note')?`<div class="answer-section" data-approved-contrast-ku="${escapeHtml(u.s.ku_id)}"><div class="answer-label">易混词提示</div><div class="definition">${escapeHtml(certifiedText('contrast_note'))}</div></div>`:'';

    const comparison=state.showCompare&&compare.items.length?`<div class="answer-section"><div class="answer-label">近义 / 易混词辨析</div>${compare.items.length?`<div class="contrast-examples">${compare.items.map(item=>`<div class="contrast-item"><div class="contrast-summary"><span class="contrast-word">${escapeHtml(item.word)}</span><span>：${escapeHtml(item.brief)}</span></div><div class="contrast-sentence">${escapeHtml(item.text)}${item.zh?`<div class="contrast-translation">${escapeHtml(item.zh)}</div>`:''}</div></div>`).join('')}</div>`:'<span class="muted">待补充</span>'}</div>`:'';
    return `<div class="answer density-${enabledCount}" onclick="event.stopPropagation()"><div class="answer-section"><div class="answer-label">释义</div><div class="definition-line">${pos}<div class="definition">${escapeHtml(u.s.m)}</div></div>${u.w.root?`<div class="root merged-root">${escapeHtml(u.w.root)}</div>`:''}${reminder}</div>${extra}${approvedGloss}${collocations}${approvedUsage}${examples}${scene1341ExampleZh}${approvedExamples}${approvedGrammar}${comparison}${approvedContrast}</div>`;
  };

 root.PAI_SCENE1341_NATIVE_ANSWER=Object.freeze({
  source:'rebuild-preview/learning-runtime.js::window.answerHtml',
  render(unit,prefs={}){
   if(!unit||unit.readOnly!==true||unit.canWriteSrs!==false||
      unit.productionReleaseAllowed!==false||unit.s?.playable!==false)
     throw Error('SC1341_NATIVE_ANSWER_REJECT_NONQUARANTINED');
   for(const key of ['showCollocations','showExamples','showCompare'])
    state[key]=prefs[key]!==false;
   return window.answerHtml(unit);
  }
 });
})(typeof window!=='undefined'?window:globalThis);
