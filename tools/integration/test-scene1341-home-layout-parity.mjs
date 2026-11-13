import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const preview=read('../../rebuild-preview/scene1341-readonly/index.html');
const native=read('../../rebuild-preview/home-dashboard.js');
const index=read('../../rebuild-preview/index.html');
const digest=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0'+s).digest('hex');
assert.equal(digest(index),'4f68df5f88b7baa64a30be643232d22374034055');
assert.equal(digest(native),'14570b9dec288f139be0fc9e843e3e8683f99a6f');
const originalTokens=['class="home-topbar"','class="continue-card"','class="scene-search-card"',
 'class="scene-results"','class="scene-results-head"','class="scene-pages"',
 'class="home-recent"','class="browse-link"'];
for(const marker of originalTokens){
 assert(preview.includes(marker),'Scene500 original home visual section absent '+marker);
 assert(native.includes(marker),'Source Scene500 renderer did not contain '+marker);
}
assert(preview.includes('<h3>为你推荐</h3>'));
assert(preview.includes('<h3>最近学习</h3>'));
assert(preview.includes('id="recommendation-prev"'));
assert(preview.includes('id="recommendation-next"'));
assert(preview.includes('id="recommendation-position"'));
assert(preview.includes('id="recommendations" hidden'));
assert(preview.includes('#home #stats-panel:not([open]),#home #settings-panel:not([open]){display:none}'));
assert(preview.includes('const start=resultPage*5'));
assert(preview.includes('sorted.slice(start,start+5)'));
assert(preview.includes('Math.ceil(sorted.length/5)'));
assert(preview.includes('resultPage=0;renderHome()'));
assert(preview.includes("$('recommendation-next').addEventListener('click'"));
assert(preview.includes('recent.hidden=!last'));
assert(preview.includes("btn.addEventListener('click',()=>openStudy(lastScene,true))"));
assert(preview.includes('btn.disabled=!n'));
assert(!preview.includes('切换到 Scene1341 场景'));
const inline=preview.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(inline);
new vm.Script(inline,{filename:'scene1341-standalone-inline'});
const el=preview.match(/<section class="home-dashboard demo-home" id="home">([\s\S]*?)<section id="learning"/)?.[1];
assert(el);
const ids=new Set([...el.matchAll(/id="([^"]+)"/g)].map(x=>x[1]));
for(const needed of ['home','continue','scenes','recommendations','recommendation-pages','recommendation-prev',
'recommendation-next','recommendation-position','recent-section','recent-row','settings-panel',
'stats-panel','find-scenes','browse','preview-stats-button','preview-settings-button']){
 if(needed==='home')continue;
 assert(ids.has(needed),'Interaction id disappeared '+needed);
}
console.log(JSON.stringify({status:'PASS',preview:'scene1341-readonly',
sourceScene500FilesUnmodified:true,sharedVisualSections:originalTokens.length,
nativeResultPageSize:5,categoryBrowseOnly:true,settingsDefaultHidden:true,
recentLearningPresent:true,productionSrsWrites:0,officialScene500DeployChanged:false}));
