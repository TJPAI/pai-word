// Layout regression in a real Chromium engine using the committed styles.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';

const root=new URL('../',import.meta.url);
const load=p=>readFileSync(new URL(p,root),'utf8');
const html=load('rebuild-preview/index.html');
const inline=[...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(x=>x[1]).join('\n');
const styles=['mobile.css','ux-fix.css','product-v2.css','learning.css'].map(load).join('\n');
const css=styles+'\n'+inline;
const browser=await chromium.launch({headless:true});
const targets=[{width:320,height:650},{width:375,height:667},{width:390,height:844},{width:430,height:932}];
try{
 for(const viewport of targets){
  const page=await browser.newPage({viewport,deviceScaleFactor:2,hasTouch:true,isMobile:true});
  await page.setContent(`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style></head><body>
   <div id="app"><div class="screen study-screen learning-screen">
    <div class="study-top"><button class="back-btn">‹</button><div class="study-scene">日常生活</div><div class="study-progress">本批已学习 1/10</div></div>
    <div class="word-hero listen-only">
     <div class="word-line"><div class="word">extraterrestrial</div></div>
     <div class="ipa-line"><span class="ipa">/ˌekstrətəˈrestriəl/</span><button class="speak-btn">🔊</button></div>
     <div class="recall-controls-row"><p class="recall-cue">回忆词义</p>
      <label class="auto-word-toggle"><input type="checkbox" aria-label="自动切词" checked>
       <span class="auto-word-symbol"><svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 0 0-14.9-4L3 9"/></svg></span>
      </label></div>
    </div>
    <div class="study-body"></div>
    <div class="recall-correction"><button>不知道</button><button>模糊</button><button>知道</button></div>
    <p class="recall-note">点击空白处显示答案</p>
   </div></div></body></html>`);
  const take=()=>page.evaluate(()=>{
   const selectors={top:'.study-top',word:'.word',ipa:'.ipa',speaker:'.speak-btn',switch:'.auto-word-toggle',cue:'.recall-cue',ratings:'.recall-correction',row:'.recall-controls-row'};
   const o={};for(const [key,s] of Object.entries(selectors)){const e=document.querySelector(s);const r=e.getBoundingClientRect();const c=getComputedStyle(e);o[key]={x:r.x,y:r.y,width:r.width,height:r.height,display:c.display,visibility:c.visibility};}return o;
  });
  const question=await take();
  assert.equal(question.word.visibility,'hidden',`word should be hidden: ${viewport.width}`);
  assert.equal(question.ipa.visibility,'hidden',`ipa should be hidden: ${viewport.width}`);
  await page.evaluate(()=>{
   document.querySelector('.learning-screen').classList.add('revealed');
   document.querySelector('.word-hero').classList.remove('listen-only');
   document.querySelector('.study-body').innerHTML='<div class="answer"><div class="answer-section"><p>释义</p><p>大量词义与例句</p>'.repeat(10)+'</div></div>';
  });
  const answer=await take();
  assert.equal(answer.word.visibility,'visible');
  assert.equal(answer.ipa.visibility,'visible');
  for(const key of ['top','word','ipa','speaker','switch','cue','ratings','row']){
   for(const coord of ['x','y','width','height'])assert.ok(Math.abs(question[key][coord]-answer[key][coord])<=1.1,
    `${viewport.width}x${viewport.height} ${key}.${coord} moved ${question[key][coord]} -> ${answer[key][coord]}`);
  }
  await page.evaluate(()=>{
   document.querySelector('.learning-screen').classList.remove('revealed');
   document.querySelector('.word-hero').classList.add('listen-only');
   document.querySelector('.study-body').innerHTML='';
  });
  const again=await take();
  for(const key of ['word','ipa','speaker','switch','cue','ratings']){
   assert.ok(Math.abs(question[key].y-again[key].y)<=1.1,`reverse toggle moved ${key} at ${viewport.width}`);
  }
  console.log('PASS stable learning faces',viewport.width,viewport.height);
  await page.close();
 }
}finally{await browser.close()}
