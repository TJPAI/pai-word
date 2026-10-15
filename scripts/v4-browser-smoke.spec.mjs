import { test, expect } from '@playwright/test';

test('PAI Word v4 real-browser smoke', async ({ page }) => {
  const pageErrors=[];
  const consoleErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e.message||e)));
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});

  await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.PAI_MANIFEST?.release==='pai-word-20000-v4',{timeout:30000});
  await page.waitForFunction(()=>document.querySelector('.scene-screen')&&window.PAI_CORE?.words?.length===20000,{timeout:30000});

  const snapshot=await page.evaluate(()=>({
    release:window.PAI_MANIFEST.release,
    words:window.PAI_MANIFEST.wordCount,
    kus:window.PAI_MANIFEST.kuCount,
    coreWords:window.PAI_CORE.words.length,
    coreKU:window.PAI_CORE.byKU.size,
    majors:Object.keys(window.PAI_TAXONOMY.majors).length,
    minors:Object.keys(window.PAI_TAXONOMY.minors).length,
    tracks:Object.keys(window.PAI_TRACK_KU_COUNTS).length,
    storageKey:window.PAI_STORAGE_KEY,
    selectedScene:window.state.selectedScene,
    sceneOptions:document.querySelectorAll('#scene-choice option').length,
    taxonomy:!!document.querySelector('#v4-taxonomy')
  }));

  expect(snapshot.release).toBe('pai-word-20000-v4');
  expect(snapshot.words).toBe(20000);
  expect(snapshot.kus).toBe(35659);
  expect(snapshot.coreWords).toBe(20000);
  expect(snapshot.coreKU).toBe(35659);
  expect(snapshot.majors).toBe(16);
  expect(snapshot.minors).toBe(319);
  expect(snapshot.tracks).toBe(7);
  expect(snapshot.storageKey).toContain('pai-word-20000-v4');
  expect(snapshot.sceneOptions).toBe(326);
  expect(snapshot.taxonomy).toBeTruthy();

  await page.evaluate(()=>window.selectLearningScene('travel.taxi'));
  await page.waitForFunction(()=>window.state.selectedScene==='travel.taxi');
  await page.evaluate(()=>window.openScene('travel.taxi'));
  await page.waitForFunction(()=>window.state.view==='learning',{timeout:10000});
  await page.waitForSelector('.word',{timeout:30000});
  await page.waitForFunction(()=>{
    const u=window.currentUnit?.();
    return !!u&&u.s?.scene==='travel.taxi'&&u.w?.loaded===true;
  },{timeout:30000});

  const learned=await page.evaluate(()=>{
    const u=window.currentUnit();
    return {scene:u.s.scene,ku:u.k,lemma:u.w.w,loaded:u.w.loaded,chunk:u.s.chunkFile||null};
  });
  expect(learned.scene).toBe('travel.taxi');
  expect(learned.loaded).toBeTruthy();
  expect(learned.ku).toMatch(/^w_\d{5}_.+_ku_s\d+$/);

  expect(pageErrors,`page errors: ${pageErrors.join(' | ')}`).toEqual([]);
  const seriousConsole=consoleErrors.filter(x=>!/favicon|apple-touch-icon/i.test(x));
  expect(seriousConsole,`console errors: ${seriousConsole.join(' | ')}`).toEqual([]);
});
