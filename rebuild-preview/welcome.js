// Preview welcome shell. No learning-state mutations; the app initializes behind the overlay.
(function(){
 const qs=new URLSearchParams(location.search);
 const forced=qs.get('welcome')==='1';
 const suppressed=qs.get('welcome')==='0'||qs.has('resetFresh');
 let seen=false;
 try{seen=localStorage.getItem('pai-word-welcome-seen-v1')==='1'}catch{}
 if(suppressed||(!forced&&seen))return;
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
 <div class="pai-welcome-feature"><span class="pai-welcome-feature-icon" aria-hidden="true">▣</span><div><strong>20,000 高频词</strong><small>覆盖日常学习、工作和生活场景</small></div></div>
 <div class="pai-welcome-feature"><span class="pai-welcome-feature-icon" aria-hidden="true">◎</span><div><strong>500 个真实场景</strong><small>从实际使用出发，学了就能用</small></div></div>
 <div class="pai-welcome-feature"><span class="pai-welcome-feature-icon" aria-hidden="true">✦</span><div><strong>科学的记忆系统</strong><small>基于 SRS，让记忆更持久</small></div></div>
 <div class="pai-welcome-feature"><span class="pai-welcome-feature-icon" aria-hidden="true">▥</span><div><strong>简洁专注</strong><small>无干扰设计，专注提升学习效率</small></div></div>
 </div><div class="pai-welcome-actions">
 <button type="button" class="pai-welcome-enter">开始学习 →</button>
 <button type="button" class="pai-welcome-catalog">先看看场景目录 ›</button>
 </div></div>`;
 document.body.appendChild(shell);
 window.PAI_WELCOME_VISIBLE=true;
 function close(catalog){
   try{localStorage.setItem('pai-word-welcome-seen-v1','1')}catch{}
   shell.remove();window.PAI_WELCOME_VISIBLE=false;
   if(catalog){
     if(document.body.classList.contains('pai-boot-ready'))window.PAI_OPEN_CATALOG_LAZY?.();
     else window.PAI_WELCOME_OPEN_CATALOG_ON_READY=true;
   }
 }
 shell.querySelector('.pai-welcome-enter').addEventListener('click',()=>close(false));
 shell.querySelector('.pai-welcome-catalog').addEventListener('click',()=>close(true));
})();
