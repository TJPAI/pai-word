// Preview welcome shell. No learning-state mutations; the app initializes behind the overlay.
(function(){
 const qs=new URLSearchParams(location.search);
 const forced=qs.get('welcome')==='1';
 const resetLanding=qs.has('resetFresh');
 const suppressed=qs.get('welcome')==='0';
 let seen=false;
 try{seen=localStorage.getItem('pai-word-welcome-seen-v1')==='1'}catch{}
 if(suppressed||(!forced&&seen&&!resetLanding))return;
 function showWelcome(){
 const shell=document.createElement('section');
 shell.className='pai-welcome';
 shell.id='pai-welcome';
 shell.setAttribute('aria-label','PAI Word 产品介绍');
 shell.innerHTML=`<div class="pai-welcome-inner">
 <div class="pai-welcome-landscape" aria-hidden="true"></div>
 <header class="pai-welcome-head"><h1>PAI Word</h1>
 <p class="pai-welcome-tagline">最适合你的高效词汇APP</p>
 <p class="pai-welcome-sub">在真实场景中，高效掌握最有用的英语词汇</p></header>
 <div class="pai-welcome-scenery" aria-hidden="true"></div>
 <div class="pai-welcome-features" aria-label="产品特点">
 <div class="pai-welcome-feature"><span class="pai-welcome-feature-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="M12 7c-2.5-1.6-5.2-1.8-9-1v13c3.8-.8 6.5-.6 9 1m0-13c2.5-1.6 5.2-1.8 9-1v13c-3.8-.8-6.5-.6-9 1m0-13v13"/></svg></span><div><strong>20,000 高频词</strong><small>覆盖日常学习、工作和生活场景</small></div></div>
 <div class="pai-welcome-feature"><span class="pai-welcome-feature-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" focusable="false"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg></span><div><strong>500 个真实场景</strong><small>从实际使用出发，学了就能用</small></div></div>
 <div class="pai-welcome-feature"><span class="pai-welcome-feature-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="M12 5c-1.6-2.2-5.5-1.7-6.2 1.2C2.9 6 2 10 4.7 11.6 3 14.5 5 18 8 17.8c.4 2.2 3.1 3.5 4 1.4.9 2.1 3.6.8 4-1.4 3 .2 5-3.3 3.3-6.2C22 10 21.1 6 18.2 6.2 17.5 3.3 13.6 2.8 12 5Z"/><path d="M12 5v14M8 9l4 3 4-3M8 15l4-3 4 3"/></svg></span><div><strong>科学的记忆系统</strong><small>基于 SRS，让记忆更持久</small></div></div>
 <div class="pai-welcome-feature"><span class="pai-welcome-feature-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="M4 19h16M6 16v-4m6 4V8m6 8V5" stroke-linecap="round"/><path d="m4 10 6-4 4 3 6-6"/></svg></span><div><strong>简洁专注</strong><small>无干扰设计，专注提升学习效率</small></div></div>
 </div><div class="pai-welcome-comic-slot">
 <div class="pai-welcome-comic-frame">
 <picture class="pai-welcome-comic-picture"><source type="image/webp" srcset="rebuild-preview/assets/pai-ai-mathematicians-comic.webp?v=comic-webp-q88-v1"><img class="pai-welcome-comic-image" fetchpriority="high" loading="eager" src="rebuild-preview/assets/pai-ai-mathematicians-comic.jpg?v=comic-v2" alt="数学家面对AI解开数学猜想的漫画，右侧对白写着：这……这怎么可能！一切AI都是反动派！" decoding="async"></picture>
 <button type="button" class="pai-welcome-comic-hotspot" aria-label="点击漫画对白：一切AI都是反动派！进入系统" title="进入 PAI Word"><span class="pai-visually-hidden">进入系统</span></button>
 </div>
<p class="pai-welcome-comic-hint">点击「一切AI都是反动派！」进入 阿.莲 系统</p>
 </div><div class="pai-welcome-actions">
 <button type="button" class="pai-welcome-enter pai-welcome-fallback" hidden>进入系统 →</button>
<button type="button" class="pai-welcome-catalog">浏览 阿.莲 目录 ›</button>
 </div></div>`;
 document.body.appendChild(shell);
 window.PAI_WELCOME_VISIBLE=true;
 // Diagnostics are read-only. DOM insertion is not the same as a painted frame.
 const diagnostics=window.PAI_WELCOME_TIMINGS={
   domInsertedMs:Math.round(performance.now()),firstFrameMs:null,
   imageLoadedMs:null,appReadyMs:null,entryRequestedMs:null,enteredMs:null
 };
 // A double RAF observes the earliest opportunity to paint without forcing layout.
 requestAnimationFrame(()=>requestAnimationFrame(()=>{diagnostics.firstFrameMs=Math.round(performance.now())}));
 window.addEventListener('pai-home-ready',()=>{diagnostics.appReadyMs=Math.round(performance.now())},{once:true});
 shell.querySelector('.pai-welcome-comic-image').addEventListener('load',()=>{diagnostics.imageLoadedMs=Math.round(performance.now())},{once:true});
 let entering=false;
 function close(catalog){
   if(entering)return;
   entering=true;
   diagnostics.entryRequestedMs=Math.round(performance.now());
   const finish=()=>{
     try{localStorage.setItem('pai-word-welcome-seen-v1','1')}catch{}
     shell.remove();window.PAI_WELCOME_VISIBLE=false;
     diagnostics.enteredMs=Math.round(performance.now());
     if(catalog&&!window.PAI_APP_BOOT_FAILED)window.PAI_OPEN_CATALOG_LAZY?.();
   };
   // Keep the welcome visible until the actual app is interactive.
   if(!document.body.classList.contains('pai-boot-ready')){
     shell.querySelector('.pai-welcome-comic-hint').textContent='正在准备系统…';
     window.addEventListener('pai-home-ready',finish,{once:true});
   }else finish();
 }
 // Transparent hot area tracks the lower-right comic speech bubble at all image widths.
 shell.querySelector('.pai-welcome-comic-hotspot').addEventListener('click',()=>close(false));
 shell.querySelector('.pai-welcome-enter').addEventListener('click',()=>close(false));
 const comicImage=shell.querySelector('.pai-welcome-comic-image');
 comicImage.addEventListener('error',()=>{
  // Do not strand first-time visitors when an image asset has not deployed.
  shell.querySelector('.pai-welcome-comic-frame').hidden=true;
  shell.querySelector('.pai-welcome-comic-hint').textContent='漫画图片暂未加载，可直接进入系统';
  shell.querySelector('.pai-welcome-fallback').hidden=false;
 });
 shell.querySelector('.pai-welcome-catalog').addEventListener('click',()=>close(true));
 }
 // Reset landing is displayed only after durable reset QA confirms an empty system.
 if(resetLanding){window.PAI_SHOW_WELCOME_AFTER_RESET=()=>{if(window.PAI_LAST_RESET_QA?.passed)showWelcome()};return;}
 showWelcome();
})();
