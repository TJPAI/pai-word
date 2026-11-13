/* Source-exact Scene500 learning-question hero.
 * Both template literal and auto-switch HTML are verbatim source snippets
 * from rebuild-preview/learning-runtime.js; checked against source in CI.
 * Isolated read-only Scene1341 adapter: never loads native app state/SRS.
 */
(function(root){
 'use strict';
 const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;')
   .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
 function render(question){
  if(!question||question.readOnly!==true||
     question.canWriteSrs!==false||question.productionReleaseAllowed!==false)
   throw Error('SC1341_NATIVE_QUESTION_REJECT_NONQUARANTINED');
  const state={revealed:!!question.revealed,hideWord:!!question.hideWord,
    autoBrowseEnabled:!!question.autoBrowseEnabled};
  const u={w:{w:String(question.expression||''),ipaUS:''}};
  if(!u.w.w.trim())throw Error('SC1341_NATIVE_QUESTION_EMPTY_EXPRESSION');
  const hidden=state.hideWord&&!state.revealed?' listen-only':'';
  const repeat=false;
  const label=state.hideWord&&!state.revealed?'听音回忆知识点':'回忆词义';
  const autoSwitch=`<label class="auto-word-toggle" title="自动切词：点击开启或关闭"><input type="checkbox" ${state.autoBrowseEnabled?'checked':''} onchange="setAutoBrowse(this.checked)" aria-label="自动切词" aria-description="勾选后按照设置速度自动切换词卡"><span class="auto-word-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 0 0-14.9-4L3 9"/><path d="M3 4v5h5"/><path d="M4 13a8 8 0 0 0 14.9 4L21 15"/><path d="M16 15h5v5"/></svg></span></label>`;
  const html=`<div class="word-hero${hidden}"><div class="word-line"><div class="word">${esc(u.w.w)}</div></div><div class="ipa-line"><span class="ipa">${esc(u.w.ipaUS)}</span><button class="speak-btn" data-word-audio data-speak="${esc(u.w.w)}" aria-label="播放单词">🔊</button></div>${/^(the|a|an|and|to|of)$/.test(u.w.w)?'<small class="muted">功能词读音会随重读与连读语境变化。</small>':''}<div class="recall-controls-row"><p class="recall-cue">${repeat?'本轮再回忆 · ':''}${esc(label)}</p>${autoSwitch}</div></div>`;
  return html;
 }
 root.PAI_SCENE1341_NATIVE_QUESTION=Object.freeze({
  render,source:'rebuild-preview/learning-runtime.js::learning-question-hero'
 });
})(typeof window!=='undefined'?window:globalThis);
