/* Scene1341 staging card preview inside the EXISTING PAI Word home / card UI.
 * Uncertified author drafts are read-only: NO learning queue, SRS, KU registry
 * or user state writes. The real learning layout is reused via CSS classes
 * and the already installed window.answerHtml legacy renderer.
 */
import {createScene1341TeachingAdapter} from './scene1341-teaching-consumption.mjs';
const BASE=new URL('../tools/integration/scene1341-teaching/',import.meta.url);
const PACKS=Object.freeze([
  ['enteach-v51-first20-answer-only-v2.json','b6c39ebcebf4d6ce9848122cc60ecc899274c74f'],
  ['scene1341-v51-sc0001-answer-only-021-050.v2.json','f55b61c241d615f7c1f8285b332d1ea795e2b75b'],
  ['scene1341-v51-sc0001-answer-only-051-100.v2.json','fa6bdba1c4f799871758b02c5391e61c8ef9cb8a'],
  ['scene1341-v51-sc0001-answer-only-101-130.v2.json','6bf55d6e8d4c01542d51213a4d70fe1c09fdfa22'],
  ['scene1341-v51-sc0001-answer-only-131-180.v2.json','78a58e8cffb265f98550ff34289a961b0bee0e3c'],
  ['scene1341-v51-sc0001-answer-only-181-234.v2.json','b78235ebf6bcfda0ee5f5e48d9a7976c04ac403e'],
  ['scene1341-v51-sc0002-answer-only-001-020.v2.json','d153f196e30a1b31a157050fb5f91eaedc94ccce']
]);
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;')
 .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
async function blobSha(bytes){
  if(!globalThis.crypto?.subtle)throw Error('SCENE1341_CRYPTO_REQUIRED');
  const header=new TextEncoder().encode('blob '+bytes.byteLength+'\0');
  const encoded=new Uint8Array(header.length+bytes.byteLength);
  encoded.set(header);encoded.set(bytes,header.length);
  const digest=new Uint8Array(await crypto.subtle.digest('SHA-1',encoded));
  return [...digest].map(x=>x.toString(16).padStart(2,'0')).join('');
}
let loadPromise=null;
// Per-tab read-only browsing position; never persisted to IndexedDB, localStorage or SRS.
const previewCursor=new Map();
export function readScene1341PreviewCursor(sceneId){return previewCursor.get(sceneId)||null;}
export function setScene1341PreviewCursor(sceneId,kuId){
  if(!/^SC50-\d{4}$/.test(sceneId||'')||!/^SC1341-KU-\d{5,}$/.test(kuId||''))throw Error('SCENE1341_PREVIEW_CURSOR_INVALID');
  previewCursor.set(sceneId,kuId);
}

export async function loadScene1341AuthorPreview({fetchImpl=fetch,base=BASE,strict=true}={}){
  const items=[];
  for(const [name,sha] of PACKS){
    const response=await fetchImpl(new URL(name,base));
    if(!response.ok)throw Error('SCENE1341_PACK_HTTP_'+response.status);
    const bytes=new Uint8Array(await response.arrayBuffer());
    if(strict&&(await blobSha(bytes))!==sha)throw Error('SCENE1341_PACK_SHA_MISMATCH_'+name);
    const pack=JSON.parse(new TextDecoder().decode(bytes));
    if(pack.release_status!=='EDITORIAL_STAGING_ONLY')throw Error('SCENE1341_PACK_NOT_STAGING');
    const adapter=createScene1341TeachingAdapter(pack);
    if(adapter.activationAllowed||adapter.canWriteSrs||adapter.canCreateStudyQueue)
      throw Error('SCENE1341_PREVIEW_ACCIDENTAL_ACTIVATION');
    for(const r of pack.records)items.push({
      id:r.scene_ku_id,sceneId:r.scene_id,rank:r.source_rank,
      expression:r.expression,unit:adapter.toLegacyAnswerUnit(r.scene_ku_id)
    });
  }
  if(items.length!==254||new Set(items.map(x=>x.id)).size!==254)
    throw Error('SCENE1341_PREVIEW_SOURCE_SCOPE_INVALID');
  items.sort((a,b)=>a.sceneId.localeCompare(b.sceneId)||a.rank-b.rank);
  const byScene=new Map();
  for(const item of items){
    const expected=(byScene.get(item.sceneId)||0)+1;
    if(item.rank!==expected)throw Error('SCENE1341_PREVIEW_RANK_GAP');
    byScene.set(item.sceneId,expected);
  }
  if(byScene.size!==2||byScene.get('SC50-0001')!==234||byScene.get('SC50-0002')!==20)
    throw Error('SCENE1341_PREVIEW_SCENE_COUNTS_INVALID');
  return Object.freeze(items);
}
export function createScene1341ReadOnlySession(items){
  const cards=[...items];let index=0,revealed=false;
  const view=()=>Object.freeze({
    index,total:cards.length,revealed,
    card:cards[index]||null,readOnly:true,canRate:false,
    canSaveProgress:false,approvedForProduction:false
  });
  return Object.freeze({
    view,reveal(){revealed=true;return view()},
    next(){index=Math.min(cards.length-1,index+1);revealed=false;return view()},
    previous(){index=Math.max(0,index-1);revealed=false;return view()},
    jump(i){if(!Number.isInteger(i)||i<0||i>=cards.length)throw Error('SCENE1341_PREVIEW_INDEX');index=i;revealed=false;return view()}
  });
}
export function renderScene1341ReadOnlyCard(view,{answerHtml}={}){
  const card=view.card;
  if(!card)return '<p>当前没有教学草稿。</p>';
  if(!view.readOnly||view.canRate||view.canSaveProgress)
    throw Error('SCENE1341_PREVIEW_WRITABLE_REJECTED');
  const answer=view.revealed&&typeof answerHtml==='function'?answerHtml(card.unit):'';
  return `<div class="screen study-screen learning-screen ${view.revealed?'revealed':''}" data-scene1341-draft="true" data-srs-write="disabled">
  <div class="study-top"><div class="study-scene">${esc(card.sceneId)} · 答案型KU审核预览</div>
    <div class="study-progress">${view.index+1} / ${view.total}</div></div>
  <div class="word-hero"><div class="word-line"><div class="word">${esc(card.expression)}</div></div>
    <p class="recall-cue">自主回忆词义和用法（草稿预览）</p></div>
  <div class="study-body">${answer||'<p class="tap-hint">点击“显示答案”查看教学内容</p>'}</div>
  <div class="recall-correction read-only" role="group" aria-label="未认证KU不可评分">
    <button disabled>不知道</button><button disabled>模糊</button><button disabled>知道</button></div>
  <p class="recall-note" role="status">作者草稿 · 只读预览 · 不计入学习记录</p></div>`;
}
export async function openScene1341ReadOnlyPreview({panel,sceneId,answerHtml}){
  if(!['SC50-0001','SC50-0002'].includes(sceneId))throw Error('SCENE1341_PREVIEW_NOT_AUTHORED');
  if(!panel||typeof panel.replaceChildren!=='function')throw Error('SCENE1341_PREVIEW_PANEL_REQUIRED');
  const loading=document.createElement('p');loading.textContent='正在校验教学草稿…';
  panel.replaceChildren(loading);
  try{
    const cards=await (loadPromise||(loadPromise=loadScene1341AuthorPreview().catch(e=>{loadPromise=null;throw e})));
    if(!panel.isConnected)return;
    const sceneCards=cards.filter(x=>x.sceneId===sceneId);
    if(!sceneCards.length)throw Error('SCENE1341_PREVIEW_NO_SCENE_KU');
    const session=createScene1341ReadOnlySession(sceneCards);
    const savedCursor=readScene1341PreviewCursor(sceneId);
    const restoreIndex=sceneCards.findIndex(card=>card.id===savedCursor);
    if(restoreIndex>=0)session.jump(restoreIndex);
    const wrapper=document.createElement('div');
    const bar=document.createElement('div');
    bar.style.cssText='display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 0;position:sticky;top:0;background:#fff;z-index:1';
    function button(label,handler){
      const element=document.createElement('button');element.type='button';element.textContent=label;
      element.style.cssText='padding:10px 12px;border:1px solid #cbd5e1;border-radius:9px;background:white;color:#243347';
      element.addEventListener('click',handler);return element;
    }
    const back=button('返回场景搜索',()=>panel.remove());
    const prev=button('上一条',()=>{session.previous();paint()});
    const reveal=button('显示答案',()=>{session.reveal();paint()});
    const next=button('下一条',()=>{session.next();paint()});
    bar.append(back,prev,reveal,next);
    function paint(){
      const view=session.view();
      if(view.card)setScene1341PreviewCursor(sceneId,view.card.id);
      wrapper.innerHTML=renderScene1341ReadOnlyCard(view,{answerHtml});
      prev.disabled=view.index===0;next.disabled=view.index===view.total-1;
      reveal.disabled=view.revealed;reveal.textContent=view.revealed?'已显示答案':'显示答案';
    }
    panel.replaceChildren(bar,wrapper);paint();
  }catch(error){
    if(panel.isConnected){loading.textContent='草稿预览不可用：'+String(error.message||error);
      const close=document.createElement('button');close.textContent='返回';close.onclick=()=>panel.remove();panel.append(close);}
  }
}
