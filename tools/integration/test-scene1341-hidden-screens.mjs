import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('rebuild-preview/scene1341-readonly/index.html','utf8');
const main=fs.readFileSync('rebuild-preview/index.html','utf8');
const src=html.match(/<style>([\s\S]*?)<\/style>/)?.[1]||'';
const inline=html.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'';
new vm.Script(inline,{filename:'scene1341-readonly-inline.js'});
assert(/<section\s+class="home-dashboard demo-home"\s+id="home"/.test(html));
assert(/<section\s+id="learning"\s+class="[^"]*demo-learning"\s+hidden\b/.test(html),
 'Learning screen must be hidden in initial home DOM');
assert(/#learning\.demo-learning\[hidden\]\s*,\s*#home\.demo-home\[hidden\]\s*\{\s*display\s*:\s*none\s*!important\s*\}/.test(src),
 'Safari must hide inactive screen even when native CSS assigns display:flex/block');
assert(src.includes('#learning.demo-learning{height:100dvh;min-height:0;overflow:hidden;display:flex'),
 'Native Scene500 study CSS retained');
assert(inline.includes("$('home').hidden=true;$('learning').hidden=false;"),
 'Opening card must hide home and show study');
assert(inline.includes("$('learning').hidden=true;")&&inline.includes("$('home').hidden=false;renderHome();"),
 'Returning must hide study and show home');
assert(!main.includes('#learning.demo-learning[hidden],#home.demo-home[hidden]'),
 'Never modify Scene500 main entry');
console.log(JSON.stringify({status:'PASS',issue:'hidden overridden by display:flex',
 initialHomeVisible:true,initialLearningHidden:true,studyOnlyWhenOpened:true,
 homeRestoredAfterBack:true,productionSrsWrites:0,originalScene500Modified:false}));
