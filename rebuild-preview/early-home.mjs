// V2.2 early home: usable before Core20K and SRS finish initializing.
// Never writes learning records. Existing runtime takes over when ready.
import {prepareLightweightHome} from './light-home-startup.mjs';
import {mountLightHome} from './light-home-view.mjs';
import {recommendScene500} from './scene-recommendation-adapter.mjs';
const app=document.getElementById('app');
const started=performance.now();
// Read homepage preferences directly from the existing IndexedDB home/settings stores.
// This does not initialize learning, mutate KU state, or create a learning session.
async function readLightHomeSnapshot(){
 if(!window.indexedDB)return null;
 const db=await new Promise((resolve,reject)=>{
  const request=indexedDB.open('pai-word-ku-durable-v1',3);
  request.onupgradeneeded=()=>{const d=request.result;for(const name of ['state','attempts','settings','home'])if(!d.objectStoreNames.contains(name))d.createObjectStore(name)};
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
  request.onblocked=()=>reject(Error('HOME_IDB_BLOCKED'));
 });
 try{
  const read=name=>new Promise((resolve,reject)=>{
   const tx=db.transaction(name,'readonly'),request=tx.objectStore(name).get('current');
   request.onsuccess=()=>resolve(request.result||null);
   request.onerror=()=>reject(request.error);
  });
  const [home,settings]=await Promise.all([read('home'),read('settings')]);
  return {home,settings};
 }finally{db.close()}
}
async function writeLightHome(snapshot){
 const db=await new Promise((resolve,reject)=>{
  const request=indexedDB.open('pai-word-ku-durable-v1',3);
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
 });
 try{await new Promise((resolve,reject)=>{
  const tx=db.transaction('home','readwrite');
  tx.objectStore('home').put(snapshot,'current');
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 })}finally{db.close()}
}
let homeWrites=Promise.resolve();

window.PAI_EARLY_HOME={ready:false,clicked:null};
try{
 const [{index},snapshot]=await Promise.all([prepareLightweightHome(),readLightHomeSnapshot().catch(error=>{window.PAI_EARLY_HOME.hydrateError=String(error);return null})]);
 if(!window.PAI_FULL_HOME_READY){
   // Restore authoritative IndexedDB home state BEFORE mounting controls.
   const storedHome=snapshot?.home||{},storedSettings=snapshot?.settings||{};
   const saved={query:'',difficulty:'all',resultIds:[],...(state.sceneSearchUi||{}),...(storedHome.sceneSearchUi||{})};
   const bootQuery=document.getElementById('scene-query')?.value;
   if(bootQuery)saved.query=bootQuery;
   state.sceneSearchUi={...saved};
   if(Array.isArray(storedHome.scene500Recent))state.scene500Recent=[...storedHome.scene500Recent];
   if(storedHome.scene500DifficultyByScene)state.scene500DifficultyByScene={...storedHome.scene500DifficultyByScene};
   const ui={sceneSearchUi:{...saved},scene500Recent:[...(state.scene500Recent||[])]};
   const fallbackSearch=(query,difficulty)=>{
     const q=query.trim().toLowerCase();
     if(!q)return [];
     return Object.entries(index.scenes).map(([id,s])=>{
       if(!s.counts[difficulty])return null;
       const hay=[s.name,s.desc,...s.tags].join(' ').toLowerCase();
       let score=hay.includes(q)?20:0;
       for(let i=0;i<q.length-1;i++)if(hay.includes(q.slice(i,i+2)))score++;
       return score?{id,score}:null;
     }).filter(Boolean).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,5);
   };
   const search=async(query,difficulty)=>{
     try{
       const {snapshot}=await recommendScene500(query,difficulty,index,{limit:100});
       window.PAI_RECOMMENDATION_MODE='alpha';
       return snapshot.results;
     }catch(error){
       window.PAI_RECOMMENDATION_MODE='fallback';
       window.PAI_RECOMMENDATION_ERROR=String(error);
       return fallbackSearch(query,difficulty);
     }
   };
   const defer=(action,scene,difficulty)=>{
     // Join concurrent user taps to the one authoritative Stage-B bootstrap.
     if(window.PAI_FULL_HOME_READY){
       if(action==='scene')window.PAI_SCENE_SEARCH?.open(scene,difficulty);
       else if(action==='stats'||action==='settings')window.openPanel?.(action);
       return;
     }
     if(window.PAI_EARLY_HOME.clicked)return;
     window.PAI_EARLY_HOME.clicked={action,scene,difficulty};
     const e=document.getElementById('pai-early-notice');
     if(e)e.textContent='正在准备学习功能…';
     const loader=window.PAI_LEARNING_RUNTIME_LOAD;
     if(typeof loader!=='function'){
       window.PAI_EARLY_HOME.clicked=null;
       if(e)e.textContent='学习模块尚未就绪，请重试。';
       return;
     }
     loader().catch(error=>{
       window.PAI_EARLY_HOME.clicked=null;
       const notice=document.getElementById('pai-early-notice');
       if(notice)notice.textContent='学习功能加载失败，请检查网络后重试。';
       console.error('Learning entry failed',error);
     });
   };
   // Budget is not yet authoritative; use last-saved scalar settings only, and label status as pending.
   const budget={pending:true,dailyCompleted:0,dailyLimit:Number(storedSettings.newPerDay)||Number(state.newPerDay)||50,roundLimit:Number(storedSettings.wordsPerRound)||Number(state.wordsPerRound)||10,due:0,reinforcementRemaining:0};
   const view=mountLightHome({element:app,index,state:ui,budget,search,
     onScene:(scene,difficulty)=>defer('scene',scene,difficulty),
     onAction:action=>defer(action),
     persist:()=>{
       state.sceneSearchUi={...ui.sceneSearchUi};
       window.PAI_EARLY_HOME.searchUi={...ui.sceneSearchUi};
       window.PAI_PREVIEW_PENDING_SEARCH={query:ui.sceneSearchUi.query,difficulty:ui.sceneSearchUi.difficulty};
       window.PAI_EARLY_HOME.edited=true;
       const home={sceneSearchUi:{...ui.sceneSearchUi},scene500Recent:[...(ui.scene500Recent||[])],scene500DifficultyByScene:{...(state.scene500DifficultyByScene||{})}};
       homeWrites=homeWrites.catch(()=>{}).then(()=>writeLightHome(home)).catch(error=>{window.PAI_EARLY_HOME.saveError=String(error)});
     }});
   // Do not present fabricated progress counts while SRS storage is still pending.
   const status=app.querySelector('.continue-card p');
   if(status)status.textContent='学习进度同步中，搜索与浏览场景已可使用';
   window.PAI_EARLY_HOME.ready=true;
   // Visible source identity for every QA screenshot; this is a source build label, not a deployed SHA.
   const stamp=document.createElement('p');
   stamp.id='pai-build-identity';
   stamp.setAttribute('aria-label','开发构建版本');
   stamp.style.cssText='font:11px system-ui;text-align:center;opacity:.65;margin:8px auto 12px';
   stamp.textContent='PAI Word V2.2 · dev core20k-rebuild-v1 · state-restore-d';
   app.appendChild(stamp);
   window.PAI_EARLY_HOME.readyMs=Math.round(performance.now()-started);
   app.insertAdjacentHTML('beforeend','<p id="pai-early-notice" style="font-size:12px;text-align:center;opacity:.6">学习统计与复习状态加载后更新</p>');
 }
}catch(error){window.PAI_EARLY_HOME.error=String(error);console.warn('Early home unavailable, using stable fallback',error)}
