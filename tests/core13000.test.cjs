// Executes the shipped loader and runtime over HTTP; this is not browser visual QA.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const zlib=require('node:zlib');
const {webcrypto}=require('node:crypto');
const root=path.resolve(__dirname,'..');
const STORAGE='pai-word-mobile-v1';
function source(file){return fs.readFileSync(path.join(root,file),'utf8')}
function session({stored,storage,compression=DecompressionStream,fetcher,failWrite}={}){
  const db=storage||new Map(stored?[[STORAGE,JSON.stringify(stored)]]:[]);
  const app={innerHTML:'',replaceChildren(){},append(){},removeAttribute(){}};
  const logs=[];
  const ctx=vm.createContext({Map,Set,Date,JSON,TextDecoder,Response,Blob,Uint8Array,crypto:webcrypto,DecompressionStream:compression,
    console:{info:(...a)=>logs.push(a),error:(...a)=>logs.push(a),warn:(...a)=>logs.push(a)},
    localStorage:{getItem:k=>db.get(k)||null,setItem:(k,v)=>{if(failWrite?.(k))throw Error('storage full');db.set(k,v)}},
    document:{getElementById:()=>app,querySelector:()=>null,addEventListener(){}},
    requestAnimationFrame(){},setTimeout:fn=>{fn();return 1},
    fetch:fetcher||(async url=>new Response(fs.readFileSync(path.join(root,url))))
  });ctx.window=ctx;
  const run=code=>vm.runInContext(code,ctx);
  const load=file=>run(source(file));
  load('mobile.js');
  if(stored?.records)for(const file of ['lexicon-core-001.js','lexicon-core-002.js','lexicon-core-003.js'])load(file);
  load('core-loader.js');
  return {ctx,db,app,run,load,logs};
}
async function boot(s){await s.ctx.loadCore13000();for(const file of ['daily.js','ipa-accent.js','app-runtime.js'])s.load(file);s.ctx.render();return s}
function plain(value){return JSON.parse(JSON.stringify(value))}

test('original Brotli and gzip fallback bytes decompress identically for all four packs',()=>{
  const m=JSON.parse(source('data/core13000-v25.5/manifest.json'));
  for(const p of m.packs){const br=zlib.brotliDecompressSync(fs.readFileSync(path.join(root,'data/core13000-v25.5',p.file)));const gz=zlib.gunzipSync(fs.readFileSync(path.join(root,'data/core13000-v25.5',p.fallback_file)));assert.equal(Buffer.compare(br,gz),0)}
});
test('HTTP load, all 13000 headwords and 16202 KUs, every answer, last word, learning/review/persistence',async()=>{
  const server=http.createServer((req,res)=>{try{res.end(fs.readFileSync(path.join(root,req.url.split('?')[0])))}catch(_){res.writeHead(404);res.end()}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
    const requests=[],s=await boot(session({fetcher:async url=>{requests.push(url);return fetch(`http://127.0.0.1:${server.address().port}/`+url)}}));
    assert.equal(s.ctx.PAI_CORE_QA.words,13000);assert.equal(s.ctx.PAI_CORE_QA.units,16202);
    assert.equal(s.ctx.PAI_CORE_QA.missingKU,30);assert.equal(s.ctx.PAI_CORE_QA.missingIPA,593);
    assert.equal(requests.length,6);assert.match(s.app.innerHTML,/13,000/);assert.doesNotMatch(s.app.innerHTML,/今天已完成/);
    let answered=0;for(const [key,u] of s.ctx.PAI_CORE.byKU){assert.equal(s.run(`unitKey(findUnitByKey('${key}').w,findUnitByKey('${key}').sid)`),key);const html=s.ctx.answerHtml(u);assert.ok(html.includes('definition'));assert.equal(u.s.e.length,3);answered++}assert.equal(answered,16202);
    assert.equal(s.run('WORDS.length'),13000);assert.equal(s.run('WORDS[12999].rank'),13000);
    const last=s.run('Object.values(WORDS[12999].s)[0].ku_id');const scene=s.ctx.PAI_CORE.byKU.get(last).s.scene;
    s.run(`queueFor('${scene}');state.daily.assigned['${scene}']=['${last}']`);s.ctx.openScene(scene);assert.ok(s.app.innerHTML.includes(s.ctx.PAI_CORE.byKU.get(last).w.w));
    s.ctx.reveal();assert.ok(s.app.innerHTML.includes('definition'));s.ctx.rateKnown(false);
    assert.equal(s.run(`state.records['${last}'].interval`),600000);assert.equal(s.run(`state.records['${last}'].reps`),1);
    s.run(`state.records['${last}'].due=0`);s.ctx.openReview();assert.match(s.app.innerHTML,/复习 ·/);s.ctx.rateReview(true);
    assert.equal(s.run(`state.records['${last}'].reps`),2);assert.ok(s.run(`state.records['${last}'].due>Date.now()`));
    s.ctx.openFreeReview();s.ctx.rateFreeReview(true);assert.equal(s.run(`state.records['${last}'].reps`),3);
    s.ctx.setVoiceAccent('gb');assert.equal(s.run('WORDS[12999].ipa'),s.run('WORDS[12999].ipaUK'));s.ctx.setVoiceAccent('us');assert.equal(s.run('WORDS[12999].ipa'),s.run('WORDS[12999].ipaUS'));
    const again=await boot(session({storage:s.db}));assert.equal(again.run(`state.records['${last}'].reps`),3);assert.equal(again.run('state.srsSchema'),'ku_id-v1');
    assert.equal(again.run('Object.keys(state.records).some(k=>k.includes("::"))'),false);
    console.log('HTTP QA:',JSON.stringify(plain(s.ctx.PAI_CORE_QA)));
  }finally{await new Promise(resolve=>server.close(resolve))}
});
test('browser without native Brotli uses verified gzip data',async()=>{
  class GzipOnly{constructor(format){if(format==='brotli')throw Error('unsupported');return new DecompressionStream(format)}}
  const s=await boot(session({compression:GzipOnly}));assert.deepEqual(plain(s.ctx.PAI_CORE_QA.formats),Array(4).fill('gzip'));assert.equal(s.run('WORDS.length'),13000);
});
test('ambiguous or unmatched legacy state retained, canonical record preserved, restart is idempotent',async()=>{
  const canonical='w_0001_the_ku01',record={due:12,interval:600000,reps:7,last:9,lastKnown:false};
  const stored={records:{'issue::work':record,'absent::daily':record,[canonical]:record},stats:{known:4,unknown:6},newPerDay:10,daily:{date:'old',assigned:{daily:['absent::daily']}},hideWord:true};
  const s=await boot(session({stored}));assert.deepEqual(plain(s.run(`state.records['${canonical}']`)),record);
  assert.deepEqual(plain(s.run('state.legacySrsPending["absent::daily"].record')),record);
  assert.equal(s.db.get(STORAGE+'::before-ku-id-v1'),JSON.stringify(stored));assert.equal(s.run('state.hideWord'),true);assert.equal(s.run('state.stats.known'),4);
  assert.equal(s.run('Object.values(state.daily.assigned).flat().every(k=>PAI_CORE.byKU.has(k))'),true);
  const before=s.db.get(STORAGE),backup=s.db.get(STORAGE+'::before-ku-id-v1');const again=await boot(session({storage:s.db}));assert.equal(again.db.get(STORAGE+'::before-ku-id-v1'),backup);assert.deepEqual(plain(again.run('state.legacySrsPending')),plain(s.run('state.legacySrsPending')));
});
test('only unique exact legacy sense matches migrate; collisions stay pending',async()=>{
  const record={due:123,interval:456,reps:5},stored={records:{'testlemma::daily':record},stats:{known:0,unknown:0}};
  const s=session({stored});s.run("WORDS.push({w:'testlemma',s:{daily:{m:'测试释义'}}})");
  const original=s.ctx.fetch;s.ctx.fetch=async url=>{if(!url.endsWith('manifest.json'))return original(url);const m=JSON.parse(source(url));return new Response(JSON.stringify(m))};
  // Use a real mapped source sense; retain its precise gloss and actual KU.
  const probe=await boot(session());const u=[...probe.ctx.PAI_CORE.byKU.values()].find(u=>u.s.scene==='daily');
  s.run(`WORDS.push({w:${JSON.stringify(u.w.w)},s:{daily:{m:${JSON.stringify(u.s.m)}}}});state.records[${JSON.stringify(u.w.w+'::daily')}]=${JSON.stringify(record)}`);
  await boot(s);assert.deepEqual(plain(s.run(`state.records[${JSON.stringify(u.k)}]`)),record);assert.ok(s.run('state.legacySrsPending["testlemma::daily"]'));
});
test('canonical/legacy collisions preserve both records regardless of insertion order',async()=>{
  const probe=await boot(session());const u=[...probe.ctx.PAI_CORE.byKU.values()].find(u=>u.s.scene==='daily');
  const oldKey=u.w.w+'::daily',oldRecord={due:1,reps:2},canonicalRecord={due:10,reps:9};
  for(const entries of [[[oldKey,oldRecord],[u.k,canonicalRecord]],[[u.k,canonicalRecord],[oldKey,oldRecord]]]){
    const s=session({stored:{records:Object.fromEntries(entries),stats:{known:0,unknown:0}}});
    s.run(`WORDS.push({w:${JSON.stringify(u.w.w)},s:{daily:{m:${JSON.stringify(u.s.m)}}}})`);
    await boot(s);assert.deepEqual(plain(s.run(`state.records[${JSON.stringify(u.k)}]`)),canonicalRecord);
    assert.deepEqual(plain(s.run(`state.legacySrsPending[${JSON.stringify(oldKey)}].record`)),oldRecord);
  }
});
test('legacy corpus audit preserves every old record even if sense mapping is unresolved',async()=>{
  const s=session({stored:{records:{},stats:{known:0,unknown:0}}});
  const count=s.run('for(const w of WORDS)for(const sid of Object.keys(w.s))state.records[w.w+"::"+sid]={due:1,reps:3,interval:100};Object.keys(state.records).length');
  await boot(s);const migrated=s.run('Object.keys(state.records).length'),pending=s.run('Object.keys(state.legacySrsPending).length');assert.equal(migrated+pending,count);console.log('Legacy corpus:',{records:count,migrated,pending});
});
test('checksum/HTTP failures reject before progress mutation',async()=>{
  for(const failure of ['checksum','http']){
    const stored={records:{'issue::work':{due:1,reps:2}},stats:{known:1,unknown:0}};
    const s=session({stored,fetcher:async url=>{const b=fs.readFileSync(path.join(root,url));if(url.endsWith('.br')){if(failure==='http')return new Response('missing',{status:404});const copy=Buffer.from(b);copy[20]^=1;return new Response(copy)}return new Response(b)}});
    const before=s.db.get(STORAGE);await assert.rejects(s.ctx.loadCore13000(),failure==='http'?/HTTP 404/:/校验失败/);assert.equal(s.db.get(STORAGE),before);assert.equal(s.ctx.PAI_CORE,undefined);
  }
});
test('backup or migration save failure leaves original storage untouched',async()=>{
  for(const target of [STORAGE,STORAGE+'::before-ku-id-v1']){
    const stored={records:{'issue::work':{reps:2}},stats:{known:0,unknown:0}},s=session({stored,failWrite:k=>k===target});
    const before=s.db.get(STORAGE);await assert.rejects(s.ctx.loadCore13000(),/storage full/);assert.equal(s.db.get(STORAGE),before);assert.equal(s.ctx.PAI_CORE,undefined);
  }
});


test('45 sense-bound comparisons have bilingual examples and do not bleed into other senses',async()=>{
  const s=await boot(session());assert.equal(s.ctx.PAI_CORE_QA.comparisonUnits,45);
  const units=[...s.ctx.PAI_CORE.byKU.values()].filter(u=>u.s.compare);
  assert.equal(units.length,45);
  for(const u of units){const html=s.ctx.answerHtml(u);assert.equal(u.s.compare.items.length,3);for(const item of u.s.compare.items){assert.ok(html.includes(item.brief_zh.replaceAll('&','&amp;')));assert.ok(html.includes(item.example_zh));assert.ok(item.example_en.length>10)}assert.equal((html.match(/class="contrast-item"/g)||[]).length,3)}
  const make=s.ctx.PAI_CORE.byKU.get('w_0048_make_ku01');assert.ok(make.s.compare);assert.equal(s.ctx.PAI_CORE.byKU.get('w_0048_make_ku02').s.compare,undefined);
  s.ctx.toggleAnswerOption('showCompare');assert.ok(!s.ctx.answerHtml(make).includes('contrast-item'));
  s.ctx.toggleAnswerOption('showCompare');s.run("state.previewKU='w_0048_make_ku01';state.view='wordPreview';state.revealed=true");const before=s.db.get(STORAGE);s.ctx.render();assert.match(s.app.innerHTML,/词条预览/);assert.match(s.app.innerHTML,/制作或产生/);assert.equal(s.db.get(STORAGE),before);
});
test('comparison corruption or incorrect sense binding rejects before SRS migration',async()=>{
  const crypto=require('node:crypto');
  for(const mode of ['hash','binding']){
    const manifest=JSON.parse(source('data/core13000-v25.5/manifest.json'));const data=JSON.parse(source('data/core13000-v25.5/comparisons-001.json'));
    data.entries[0].sense_id='wrong_sense';const bytes=Buffer.from(JSON.stringify(data));
    if(mode==='binding'){manifest.comparisons.bytes=bytes.length;manifest.comparisons.sha256=crypto.createHash('sha256').update(bytes).digest('hex')}
    const s=session({stored:{records:{'issue::work':{reps:1}},stats:{known:0,unknown:0}},fetcher:async url=>new Response(url.endsWith('manifest.json')?JSON.stringify(manifest):url.endsWith('comparisons-001.json')?bytes:fs.readFileSync(path.join(root,url)))});
    const before=s.db.get(STORAGE);await assert.rejects(s.ctx.loadCore13000(),mode==='hash'?/文件大小不符|校验失败/:/义项绑定不符/);assert.equal(s.db.get(STORAGE),before);
  }
});
