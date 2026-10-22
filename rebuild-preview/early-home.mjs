// V2.2 early home: usable before Core20K and SRS finish initializing.
// Never writes learning records. Existing runtime takes over when ready.
import {prepareLightweightHome} from './light-home-startup.mjs';
import {mountLightHome} from './light-home-view.mjs';
const app=document.getElementById('app');
const started=performance.now();
window.PAI_EARLY_HOME={ready:false,clicked:null};
try{
 const {index}=await prepareLightweightHome();
 if(!window.PAI_FULL_HOME_READY){
   const saved=state.sceneSearchUi||{query:'',difficulty:'all',resultIds:[]};
   const bootQuery=document.getElementById('scene-query')?.value||'';
   const ui={sceneSearchUi:{...saved,query:saved.query||bootQuery},scene500Recent:state.scene500Recent||[]};
   const search=(query,difficulty)=>{
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
   const defer=(action,scene,difficulty)=>{
     // Join concurrent user taps to the one authoritative Stage-B bootstrap.
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
   const budget={dailyCompleted:0,dailyLimit:Number(state.newPerDay)||50,roundLimit:Number(state.wordsPerRound)||10,due:0,reinforcementRemaining:0};
   mountLightHome({element:app,index,state:ui,budget,search,
     onScene:(scene,difficulty)=>defer('scene',scene,difficulty),
     onAction:action=>defer(action),
     persist:()=>{state.sceneSearchUi={...ui.sceneSearchUi};window.PAI_EARLY_HOME.searchUi={...ui.sceneSearchUi};window.PAI_PREVIEW_PENDING_SEARCH={query:ui.sceneSearchUi.query,difficulty:ui.sceneSearchUi.difficulty};}});
   // Do not present fabricated progress counts while SRS storage is still pending.
   const status=app.querySelector('.continue-card p');
   if(status)status.textContent='学习进度同步中，搜索与浏览场景已可使用';
   window.PAI_EARLY_HOME.ready=true;
   window.PAI_EARLY_HOME.readyMs=Math.round(performance.now()-started);
   app.insertAdjacentHTML('beforeend','<p id="pai-early-notice" style="font-size:12px;text-align:center;opacity:.6">学习统计与复习状态加载后更新</p>');
 }
}catch(error){window.PAI_EARLY_HOME.error=String(error);console.warn('Early home unavailable, using stable fallback',error)}
