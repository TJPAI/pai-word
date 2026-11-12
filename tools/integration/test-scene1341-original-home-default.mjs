import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const html=read('../../rebuild-preview/index.html');
const home=read('../../rebuild-preview/home-dashboard.js');
const welcome=read('../../rebuild-preview/welcome.js');
const bootstrap=read('../../rebuild-preview/bootstrap.js');
const rec=read('../../rebuild-preview/scene1341-search-core.mjs');
assert(html.includes('rebuild-preview/welcome.js'),'Original Scene500 welcome shell must remain');
assert(html.includes('rebuild-preview/bootstrap.js'),'Original Scene500 boot must remain');
assert(html.includes('rebuild-preview/learning-runtime.js'),'Original Scene500 learner preload must remain');
assert(welcome.includes('1,341 个真实场景'),'Welcome scene count must describe active Scene1341');
assert(html.includes('rebuild-preview/welcome.js?v=scene1341-welcome-20261113'),'Welcome cache version must update');
assert(html.includes('rebuild-preview/bootstrap.js?v=scene1341-original-scene500-ui-20261113'),'Old HTML must fetch the new bootstrap');
assert(bootstrap.includes("const VERSION='scene1341-original-scene500-ui-20261113'"),'Bootstrap must refresh native home script cache');
assert(welcome.includes('PAI Word'),'Original welcome identity retained');
assert(!home.includes('切换到 Scene1341 场景'),'Remove abandoned debug switch');
assert(!home.includes('scene1341=1'),'No hidden query-flag link for catalog activation');
assert(home.includes('const scene1341Mode=true;'),'Original homepage must default to Scene1341');
assert(home.includes('const scene1341RecExperiment=true;'),'CG-REC must be selected by default');
assert(home.includes('searchWithRecEngine(q,{limit:10})'),'Original homepage must use CG-REC');
assert(home.includes('PAI_SCENE1341_OPEN'),'Existing scene result card handler must remain');
assert(home.includes('Scene1341推荐表达与教学KU分层'),'Uncertified KU release gate visible');
const gitBlob=crypto.createHash('sha1').update('blob '+Buffer.byteLength(rec)+'\0').update(rec).digest('hex');
assert.equal(gitBlob,'9273661434948d48ecdd36c520f37f2a1da362c1',
 'Browser search source must be exact independently tested CG-REC revision');
const state={view:'scenes',records:{},sceneSearchUi:{query:'stale',difficulty:'all',resultIds:['S001'],page:0},newPerDay:20,wordsPerRound:10};
const window={render:()=>'<legacy>',PAI_CORE:{byKU:new Map()}};
const document={};
const context={window,document,state,SCENES:{},console,URLSearchParams,location:{search:''},Set,Map,
 requestIdleCallback:()=>{},setTimeout:()=>{}};
vm.runInNewContext(home,context,{timeout:1800,filename:'original-home-dashboard.js'});
const native=window.PAI_HOME_DASHBOARD_RENDER();
assert(native.includes('<h1>PAI Word</h1>'));
assert(native.includes('Scene1341'));
assert(native.includes('你现在想学什么？'));
assert(native.includes('找场景'));
assert(native.includes('浏览场景目录'));
assert(native.includes('CG-REC')===false,'Search engine status is added after render, not a duplicated homepage');
assert(!native.includes('切换到 Scene1341'));
assert(!native.includes('Scene500 场景词池'));
assert(!native.includes('onclick="continueScene500('),'Old Scene500 session not presented as Scene1341');
assert.equal(state.sceneSearchUi.query,'','Stale Scene500 search must be cleared');
assert.equal(typeof window.PAI_SCENE1341_OPEN,'function');
assert.equal(typeof window.PAI_SCENE1341_BROWSE,'function');
assert.equal(typeof window.findScene500,'function','Original homepage search action retained');
assert.equal(typeof window.render,'function');
assert(home.includes("!/^SC50-\\d{4}$/.test(id)"),'Readonly result handler must validate canonical SC50 id');
console.log(JSON.stringify({status:'PASS',
 checks:['original welcome','original Scene500 homepage DOM','Scene1341 default search','CG-REC default',
 'debug switch removed','old Scene500 sessions hidden','stale search reset','source-pinned recommender',
 'source-only nonrelease gate'],deployed:false,srsWrites:0,unapprovedKUActivated:0}));
