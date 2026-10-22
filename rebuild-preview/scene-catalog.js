// Scene500 catalog: lightweight navigation; all learning remains in PAI_SCENE_SEARCH.open.
(function(){
const names=["日常起居与家庭生活","餐饮与食品","购物与消费","出行与城市交通","旅行与旅游","学校与学习","大学与学术研究","工作与职场","求职与职业发展","商务与企业经营","数字生活与互联网","科技、AI与工程","医疗与健康","运动与健身","娱乐、文化与休闲","社交、人际与情感","公共服务、法律与社会生活","语言功能与沟通任务","自然、环境与世界","认知、表达与高级思维"];
const esc=x=>String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const levels={all:'全部',basic:'基础',common:'常用',advanced:'进阶',high:'高阶'};
const original=window.render;
if(typeof original!=='function')return;
const catalog=()=>{state.sceneCatalogUi=state.sceneCatalogUi||{category:0,query:''};return state.sceneCatalogUi};
const specs=()=>new Map((window.PAI_SCENE500?.specs||[]).map(s=>[s.id,s]));
function scene(id){
const light=window.PAI_LIGHT_HOME_INDEX?.scenes?.[id],s=specs().get(id);
return light?{...s,...light,id}:s||null;
}
function count(id,d){const c=window.PAI_LIGHT_HOME_INDEX?.scenes?.[id]?.counts;if(c&&Number.isInteger(c[d]))return c[d];const n=window.PAI_SCENE_SEARCH?.inventory?.(id,d)?.reviewedCount;return Number.isInteger(n)?n:null}
function rows(d,q,category){
const query=q.trim().toLowerCase(),out=[];
for(let i=1;i<=500;i++){const id='S'+String(i).padStart(3,'0');const s=scene(id);if(!s)continue;
if(!query&&Math.floor((i-1)/25)!==category)continue;
if(query&&!([id,s.name,s.desc,...(s.tags||[])].join(' ').toLowerCase().includes(query)))continue;
out.push({id,name:s.name,desc:s.desc||'',count:count(id,d)});}
return out;
}
function view(){
const c=catalog(),d=levels[state.sceneSearchUi?.difficulty]?state.sceneSearchUi.difficulty:'all';
const list=rows(d,c.query,c.category);
return `<style>
.scene-catalog{max-width:820px;margin:0 auto;padding:18px 16px 52px;color:inherit}
.scene-catalog .catalog-head{display:flex;align-items:center;gap:14px;margin-bottom:14px}
.scene-catalog .catalog-back,.scene-catalog .catalog-group,.scene-catalog .catalog-item{cursor:pointer;font:inherit;color:inherit}
.scene-catalog .catalog-back{border:1px solid #9996;border-radius:10px;padding:9px 12px;background:transparent}
.scene-catalog h2{margin:0;font-size:23px}
.scene-catalog .catalog-tools{display:flex;gap:10px;margin:12px 0}
.scene-catalog input,.scene-catalog select{box-sizing:border-box;padding:11px;border:1px solid #8886;border-radius:10px;background:transparent;color:inherit;font:inherit}
.scene-catalog input{flex:1;min-width:100px}
.scene-catalog .catalog-cats{display:grid;grid-template-columns:repeat(auto-fill,minmax(175px,1fr));gap:7px;margin-bottom:14px}
.scene-catalog .catalog-group{padding:10px;text-align:left;border:1px solid #8885;border-radius:10px;background:transparent;font-size:13px}
.scene-catalog .catalog-group[aria-pressed=true]{border-color:currentColor;background:#8882}
.scene-catalog .catalog-items{display:grid;gap:6px}
.scene-catalog .catalog-item{width:100%;padding:12px;text-align:left;display:flex;align-items:center;gap:10px;justify-content:space-between;border:1px solid #8884;border-radius:10px;background:transparent}
.scene-catalog .catalog-item:focus-visible,.scene-catalog .catalog-group:focus-visible{outline:2px solid #3887df;outline-offset:2px}
.scene-catalog small{color:inherit;opacity:.65}
.scene-catalog .catalog-note{font-size:12px;opacity:.65;margin:12px 0}
@media(max-width:480px){.scene-catalog .catalog-tools{flex-wrap:wrap}.scene-catalog select{width:120px}.scene-catalog .catalog-cats{grid-template-columns:repeat(2,minmax(0,1fr))}}
</style><section class="scene-catalog"><header class="catalog-head"><button class="catalog-back" data-cat-back>← 返回</button><h2>浏览场景目录</h2></header><p class="catalog-note">Scene500 · 20大类 × 25小类 · 共享首页难度，点击场景进入现有学习流程</p><div class="catalog-tools"><input id="catalog-query" type="search" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="搜索场景" placeholder="搜索500个场景" value="${esc(c.query)}"><button type="button" class="catalog-back" data-cat-search>搜索</button><select id="catalog-difficulty" aria-label="难度">${Object.entries(levels).map(([v,l])=>`<option value="${v}" ${d===v?'selected':''}>${l}</option>`).join('')}</select></div><nav class="catalog-cats" aria-label="场景大类">${names.map((n,i)=>`<button class="catalog-group" data-cat-index="${i}" aria-pressed="${!c.query&&i===c.category}">${String(i+1).padStart(2,'0')} ${esc(n)}</button>`).join('')}</nav><p class="catalog-note">${c.query?`匹配场景：${list.length}个`:`${esc(names[c.category])} · ${list.length}个场景`}</p><div class="catalog-items">${list.length?list.map(s=>`<button class="catalog-item" data-cat-scene="${s.id}"><span><b>${s.id} · ${esc(s.name)}</b>${s.desc?`<small style="display:block">${esc(s.desc)}</small>`:''}</span><small>${s.count===null?'数量待加载':s.count+' 可学KU'} →</small></button>`).join(''):'<p>没有匹配场景；可尝试其它关键词。</p>'}</div></section>`;
}
// Refresh only results: never replace a focused text input during typing or IME composition.
function refreshMatches(){
 const app=document.getElementById('app');if(!app)return;
 const template=document.createElement('template');template.innerHTML=view();
 const currentList=app.querySelector('.scene-catalog .catalog-items');
 const nextList=template.content.querySelector('.scene-catalog .catalog-items');
 const currentNote=app.querySelector('.scene-catalog .catalog-items')?.previousElementSibling;
 const nextNote=template.content.querySelector('.scene-catalog .catalog-items')?.previousElementSibling;
 if(currentList&&nextList)currentList.replaceChildren(...nextList.childNodes);
 if(currentNote&&nextNote)currentNote.textContent=nextNote.textContent;
 app.querySelectorAll('.catalog-group').forEach(b=>b.setAttribute('aria-pressed',String(!catalog().query&&Number(b.dataset.catIndex)===catalog().category)));
}
function repaint(focus=false){const a=document.getElementById('app');if(!a)return;a.innerHTML=view();if(focus){const el=a.querySelector('#catalog-query');el?.focus();el?.setSelectionRange(el.value.length,el.value.length)}}
window.openSceneCatalog=function(){state.view='scene-catalog';render();};
window.render=function(){if(state.view==='scene-catalog'){repaint();return;}return original();};
document.addEventListener('click',e=>{
if(state.view!=='scene-catalog')return;
if(e.target.closest('[data-cat-back]')){state.view='scenes';render();return}
const group=e.target.closest('[data-cat-index]');if(group){const c=catalog();c.category=Number(group.dataset.catIndex);c.query='';repaint();return}
const button=e.target.closest('[data-cat-scene]');if(button){window.PAI_SCENE_SEARCH?.open(button.dataset.catScene,state.sceneSearchUi?.difficulty||'all');}
});
// Safari Chinese IME: never update the DOM while typing, composing, or choosing candidates.
// Search only on an explicit button tap or the input's committed change (blur).
function commitCatalogSearch(){
 const el=document.getElementById('catalog-query');
 if(!el||state.view!=='scene-catalog')return;
 catalog().query=el.value;
 refreshMatches();
}
document.addEventListener('click',e=>{
 if(state.view==='scene-catalog'&&e.target.closest('[data-cat-search]'))commitCatalogSearch();
});
document.addEventListener('change',e=>{
 if(state.view==='scene-catalog'&&e.target.id==='catalog-query')commitCatalogSearch();
});
document.addEventListener('change',e=>{if(state.view==='scene-catalog'&&e.target.id==='catalog-difficulty'){state.sceneSearchUi=state.sceneSearchUi||{};state.sceneSearchUi.difficulty=e.target.value;save();repaint()}});
})();
