import {mountDualCatalog,wrapLegacyEnsureUnits} from './core20k-dual-catalog.mjs';
import {injectIsolatedDailyQueue} from './core20k-isolated-queue.mjs';
const app=document.getElementById('app');
const day=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const load=src=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>no(Error('SCRIPT:'+src));document.body.append(s)});
const json=async src=>{const r=await fetch(src,{cache:'no-store'});if(!r.ok)throw Error('FETCH:'+src+':'+r.status);return r.json()};
async function start(){
 if(!window.PAI_CORE20K_TEST||!(/^(localhost|127\.0\.0\.1)$/.test(location.hostname)||location.hostname.endsWith('.pages.dev')))throw Error('ISOLATION_REQUIRED');
 await loadLearningCatalog();
 const origEnsure=window.ensureUnits;
 const pack=await json('data/core20k-v11-isolated/registered_pack.json');
 window.PAI_SCENE500_MEMBERSHIP_POLICY=await json('data/scene500-ranked-membership-policy-v1.json');
 try{window.PAI_SCENE500_MEMBERSHIP=await json('data/scene500-playable-membership-v2.json')}catch{window.PAI_SCENE500_MEMBERSHIP=await json('data/scene500-playable-membership-v1.json')}
 for(const src of ['learning-runtime.js','audio-compat.js','scene500-integrated.js','scene500-sense-review.js','scene-search.js','home-dashboard.js','round-policy.js'])await load(src);
 SCENES.unclassified='Core20K 增量测试';
 const mounted=mountDualCatalog(window.PAI_CORE,pack,{isolated:true,legacyCount:16616});
 window.ensureUnits=wrapLegacyEnsureUnits(origEnsure,window.PAI_CORE);
 const queue=injectIsolatedDailyQueue({core:window.PAI_CORE,state,scenes:SCENES,pack,dateKey:day()});
 window.PAI_CORE20K_V16_QA={mounted:mounted.incrementalUnits.length,queued:queue.keys.length,oldKU:16616,production:false,origin:location.origin};
 window.openScene('unclassified');app.removeAttribute('role');
}
start().catch(e=>{app.innerHTML='<div class="screen"><h2>隔离测试启动失败</h2><pre id="v16-error"></pre></div>';document.getElementById('v16-error').textContent=String(e.stack||e);console.error(e)});
