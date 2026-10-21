// PAI_CHROMIUM=/path/to/chromium node scripts/test-v21-browser.mjs
// Real local Chromium; fresh isolated storage. Does not access production user data.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import zlib from 'node:zlib';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
const root=process.cwd(),out=path.join(root,'docs/qa');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{
 let file=path.join(root,decodeURIComponent(new URL(req.url,'http://local').pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 if(file.endsWith('/'))file+='index.html';
 try{let data=fs.readFileSync(file);const ext=path.extname(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'})[ext]||'application/octet-stream');res.setHeader('Cache-Control','public, max-age=3600');if(['.html','.js','.mjs','.css','.json'].includes(ext)&&req.headers['accept-encoding']?.includes('gzip')){data=zlib.gzipSync(data);res.setHeader('Content-Encoding','gzip')}res.setHeader('Content-Length',data.length);res.end(data)}catch{res.writeHead(404).end()}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}/rebuild-preview/`;
const browser=await chromium.launch({executablePath:process.env.PAI_CHROMIUM||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
const report={browser:browser.version(),environment:'Local loopback HTTP; gzip text; cache max-age=3600; Chromium headless; not Safari or public Pages',checks:[],performance:[]};
const key='pai-word-core20k-rebuild-preview-v21';
const passed=name=>{report.checks.push(name);console.log('PASS',name)};
async function home(page){await page.waitForFunction(()=>window.PAI_HOME_READY_MS);await page.locator('#scene-query').fill('我要去美国参加学术会议，还要坐飞机和住酒店');await page.getByRole('button',{name:'找场景',exact:true}).click()}
async function readyQuestion(p){await p.waitForFunction(()=>window.PAI_ENGINE_READY&&state.learningSession?.currentAttempt&&!document.querySelector('.done'));}
try{
 const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Shanghai'});
 const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(key=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({newPerDay:50,wordsPerRound:10,records:{},stats:{known:0,unknown:0},autoPronounce:{question:false,swipe:false},sceneSearchUi:{query:'机场',difficulty:'high',resultIds:[]}}));localStorage.setItem('production-sentinel','unchanged');window.testWrites=[];const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){window.testWrites.push(k);return original.call(this,k,v)};},key);
 let blocked=0;
 const block=route=>{blocked++;return route.abort()};
 await p.route(/core20k-runtime\.json\.gz|scene500-top100-v40\/group-/,block);
 await p.goto(url);await p.waitForFunction(()=>window.PAI_HOME_READY_MS);
 assert.equal(await p.locator('#scene-query').inputValue(),'机场');assert.equal(await p.locator('#scene-difficulty').inputValue(),'high');assert.equal(blocked,0);
 assert.deepEqual(await p.evaluate(()=>testWrites),[]);passed('home restores query/difficulty and writes no storage; no heavy request');
 for(const level of ['all','basic','common','advanced','high']){
  await p.locator('#scene-difficulty').selectOption(level);
  const observed=await p.locator('.scene-result').evaluateAll(rows=>rows.map(r=>Number(r.querySelector('.scene-result-count b').textContent)));
  const expected=await p.evaluate(()=>PAI_SCENE_SEARCH.search('机场',state.sceneSearchUi.difficulty,5).map(r=>r.reviewedCount));assert.deepEqual(observed,expected);
 }
 passed('blocked full lexicon and 20 shards: all five difficulty counts and search work');
 await p.getByRole('button',{name:'设置',exact:true}).click();
 for(const n of ['10','25','50']){await p.locator('[data-setting="wordsPerRound"]').selectOption(n);assert.equal(await p.evaluate(()=>state.wordsPerRound),Number(n))}
 await p.locator('[data-setting="wordsPerRound"]').selectOption('10');await p.locator('[data-panel-action="home"]').click();
 await p.getByRole('button',{name:'统计',exact:true}).click();assert((await p.locator('#app').innerText()).includes('已学习义项'));await p.locator('[data-panel-action="home"]').click();assert.equal(blocked,0);passed('settings and statistics usable without full engine');
 await p.locator('#scene-difficulty').selectOption('all');
 await p.locator('.scene-result').first().click();await p.getByRole('button',{name:'重试',exact:true}).waitFor();assert.equal(await p.evaluate(()=>state.learningSession||null),null);
 await p.unroute(/core20k-runtime\.json\.gz|scene500-top100-v40\/group-/,block);
 await p.getByRole('button',{name:'重试',exact:true}).click();await readyQuestion(p);passed('failed initialization leaves no session; retry enters real study');
 const first=await p.evaluate(()=>({attempt:{...state.learningSession.currentAttempt},session:state.learningSession.sessionId,k:state.learningSession.queue[0],quota:PAI_HOME_BUDGET().dailyCompleted,total:state.learningSession.total}));assert.equal(first.quota,1);assert.equal(first.total,10);
 await p.getByRole('button',{name:'知道',exact:true}).click();
 const revealed=await p.evaluate(()=>({...state.learningSession.currentAttempt}));assert.equal(revealed.phase,'answer');assert(Number.isFinite(revealed.responseMs));
 await p.reload();await p.waitForFunction(()=>window.PAI_HOME_READY_MS);await p.getByRole('button',{name:'继续本轮',exact:true}).click();await readyQuestion(p);
 const restored=await p.evaluate(()=>({...state.learningSession.currentAttempt,phaseNow:PAI_TAP_FLOW.snapshot().phase}));assert.equal(restored.attemptId,first.attempt.attemptId);assert.equal(restored.phaseNow,'answer');assert.equal(restored.responseMs,revealed.responseMs);passed('refresh resumes same attempt and revealed answer without new recall time');
 await p.evaluate(()=>{PAI_TAP_FLOW.cancel();state.revealed=true;window.beforeFailure=JSON.stringify(state);window.realSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('QA injected save failure')};rateLearning('again',state.learningSession.queue[0]);});
 assert.equal(await p.evaluate(()=>JSON.stringify(state)),await p.evaluate(()=>beforeFailure));await p.evaluate(()=>{Storage.prototype.setItem=realSet});passed('injected scoring save failure: no half state or lost queue');
 await p.evaluate(()=>{state.revealed=true;for(let i=0;i<100;i++)rateLearning('again',state.learningSession.queue[0])});await readyQuestion(p);
 assert.equal(await p.evaluate(k=>state.records[k].reps,first.k),1);assert.equal(await p.evaluate(()=>state.learningSession.completed.length),0);passed('100 synchronous submissions score once; wrong answer reinsertion does not complete KU');
 const beforeBrowse=await p.evaluate(()=>JSON.stringify({records:state.records,queue:state.learningSession.queue,completed:state.learningSession.completed}));
 await p.evaluate(()=>browseAnswer(1));await p.waitForSelector('.previous-answer');
 await p.evaluate(()=>{chooseHistoricalRating('good');rateBrowsedLearning('good',getBrowsedUnit().k);PAI_TAP_FLOW.choose('good')});
 assert.equal(await p.evaluate(()=>JSON.stringify({records:state.records,queue:state.learningSession.queue,completed:state.learningSession.completed})),beforeBrowse);passed('history browsing and attempted grading do not alter records or progress');
 await p.evaluate(()=>goScenes());assert.equal(await p.evaluate(()=>JSON.stringify(PAI_HOME_BUDGET())),await p.evaluate(()=>JSON.stringify(studyBudgetSummary())));
 assert.equal(await p.evaluate(()=>localStorage.getItem('production-sentinel')),'unchanged');passed('home/engine statistics agree; unrelated production storage untouched');
 await p.screenshot({path:path.join(out,'v21-home-chromium.png'),fullPage:true});assert.deepEqual(errors,[]);passed('no uncaught browser errors');
 await c.close();
 // Performance uses no request routing (routing disables browser cache).
 for(let run=0;run<3;run++){
  const ctx=await browser.newContext({viewport:{width:390,height:844}}),page=await ctx.newPage();
  for(const temperature of ['cold','warm']){
   await page.goto(url);await page.waitForFunction(()=>window.PAI_HOME_READY_MS);
   const metrics=await page.evaluate(async()=>{await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const resources=performance.getEntriesByType('resource');return {homeInteractiveMs:PAI_HOME_READY_MS,completePaintObservedMs:performance.now(),transferBytes:resources.reduce((n,r)=>n+r.transferSize,0),requests:resources.length,heavyRequests:resources.filter(r=>/core20k-runtime|scene500-top100-v40|learning-runtime/.test(r.name)).length}});
   await page.locator('#scene-query').fill('机场');await page.getByRole('button',{name:'找场景',exact:true}).click();assert.equal(await page.locator('.scene-result').count(),5);assert.equal(metrics.heavyRequests,0);report.performance.push({run,temperature,...metrics});
  }
  const start=Date.now();await page.locator('.scene-result').first().click();await readyQuestion(page);report.performance.push({run,firstLearningWallMs:Date.now()-start});await ctx.close();
 }
 passed('3 cold + 3 warm actual navigations, usable search and first learning entry');
 report.safari='Not tested: no real Safari / iPhone available';report.result='PASS';
} catch(e){report.result='FAIL';report.error=e.stack;throw e}
finally{fs.writeFileSync(path.join(out,'v21-browser-results.json'),JSON.stringify(report,null,2)+'\n');await browser.close();server.close()}
