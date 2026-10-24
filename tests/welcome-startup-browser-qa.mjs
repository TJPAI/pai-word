// Real Chromium cold/warm startup smoke tests against the repository's actual static app.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.env.PAI_QA_ORIGIN||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true});
const runs=[];
const settle=async(page,timeout=60000)=>page.waitForFunction(()=>document.body.classList.contains('pai-boot-ready'),{timeout});
const collect=page=>page.evaluate(()=>{
 const timings=window.PAI_WELCOME_TIMINGS||{};
 return {firstFrameMs:timings.firstFrameMs,imageLoadedMs:timings.imageLoadedMs,
  welcomeDomMs:timings.domInsertedMs,homeReadyMs:timings.appReadyMs,
  entryRequestedMs:timings.entryRequestedMs,enteredMs:timings.enteredMs,
  bootReport:window.PAI_BOOT_TIMINGS||null,
  bootFailed:!!window.PAI_APP_BOOT_FAILED,
  comicStatus:(()=>{const e=document.querySelector('.pai-welcome-comic-image');return e?{complete:e.complete,naturalWidth:e.naturalWidth}:null})()};
});
try{
 // Fresh first visit: welcome must be visible even when main app initialization isn't done.
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/rebuild-preview/?welcome=1',{waitUntil:'domcontentloaded',timeout:30000});
 await page.locator('#pai-welcome').waitFor({timeout:10000});
 const shell=page.locator('#pai-welcome');
 assert.equal(await shell.isVisible(),true,'Welcome should show on first visit');
 const comic=page.locator('.pai-welcome-comic-image');
 await comic.evaluate(el=>el.decode().catch(()=>{}));
 const natural=await comic.evaluate(el=>el.naturalWidth);
 assert.ok(natural>=800,'Comic must load at readable resolution; missing/failed image is not a pass');
 const imageUrl=await comic.evaluate(el=>el.currentSrc);
 assert.ok(imageUrl.includes('pai-ai-mathematicians-comic.webp'),'Chromium should choose the optimized WebP');
 const dimensions=await comic.evaluate(el=>({width:el.naturalWidth,height:el.naturalHeight}));
 assert.deepEqual(dimensions,{width:1170,height:780},'WebP must preserve original comic dimensions');
 let before=await collect(page);
 assert.ok(before.welcomeDomMs!==null,'welcome insert timing recorded');
 assert.ok(before.imageLoadedMs!==null,'comic load timing recorded');
 await settle(page);
 const ready=await collect(page);
 assert.ok(!ready.bootFailed,'actual home failed to initialize');
 assert.ok(ready.homeReadyMs!==null,'home-ready event missing');
 await page.locator('.pai-welcome-comic-hotspot').click();
 await page.locator('#pai-welcome').waitFor({state:'detached',timeout:6000});
 assert.equal(await page.locator('.home-dashboard').count()>0,true,'Clicking comic should enter actual home');
 const complete=await collect(page);
 runs.push({case:'first-visit',...complete,pageErrors:errors.slice(0,4)});
 // Return-user path must skip welcome and display actual home.
 await page.goto(base+'/rebuild-preview/?welcome=0',{waitUntil:'domcontentloaded',timeout:30000});
 await settle(page);
 assert.equal(await page.locator('#pai-welcome').count(),0,'Return user should bypass welcome');
 assert.ok(await page.locator('.home-dashboard').count()>0,'Returning home is not interactive');
 runs.push({case:'returning',...await collect(page)});
 await context.close();
 // Entering before boot finishes must remain on welcome until app is available.
 const earlyContext=await browser.newContext({viewport:{width:375,height:667},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const earlyPage=await earlyContext.newPage();
 // Throttle one primary data file to create a reliably pending boot.
 await earlyPage.route('**/data/scene500-ranked-membership-policy-v1.json*',async route=>{
  await new Promise(resolve=>setTimeout(resolve,1600));await route.continue();
 });
 await earlyPage.goto(base+'/rebuild-preview/?welcome=1',{waitUntil:'domcontentloaded',timeout:30000});
 await earlyPage.locator('#pai-welcome').waitFor();
 await earlyPage.locator('.pai-welcome-comic-hotspot').click();
 assert.ok(await earlyPage.locator('#pai-welcome').count()>0,'Early click must retain welcome until ready');
 await settle(earlyPage);
 await earlyPage.locator('#pai-welcome').waitFor({state:'detached',timeout:10000});
 assert.ok(await earlyPage.locator('.home-dashboard').count()>0,'Queued early click must open actual home');
 runs.push({case:'early-click',...await collect(earlyPage)});
 await earlyContext.close();
 console.log('PASS Welcome actual-browser startup and transitions');
 console.log('Browser local-run diagnostics (not real iPhone Safari timings):',JSON.stringify(runs));
}finally{await browser.close()}
