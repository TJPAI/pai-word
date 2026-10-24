// P0 welcome regression: runnable with node --test tests/welcome-first-paint.test.mjs.
// Static boundary contract only; browser FCP/network metrics require real Safari E2E.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=source('rebuild-preview/index.html');
const welcome=source('rebuild-preview/welcome.js');
const bootstrap=source('rebuild-preview/bootstrap.js');

test('welcome runs before state and core initialization',()=>{
 assert.ok(html.indexOf('rebuild-preview/welcome.js?v=')<html.indexOf('rebuild-preview/preview-state.js?v='));
 assert.ok(html.indexOf('rebuild-preview/welcome.css?v=')<html.indexOf('pai-first-paint-gate'));
});
test('non-welcome styles are loaded without blocking welcome CSS first paint',()=>{
 assert.match(html,/window\.PAI_APP_STYLES_READY=window\.PAI_WELCOME_FAST/);
 assert.match(html,/requestAnimationFrame/);
 for(const href of ['mobile.css','ux-fix.css','product-v2.css','learning.css','home-dashboard.css'])
   assert.ok(html.includes(href));
 assert.match(html,/el\.media='print'/);
 assert.match(bootstrap,/await window\.PAI_APP_STYLES_READY/);
 assert.ok(bootstrap.indexOf('await window.PAI_APP_STYLES_READY')<bootstrap.indexOf("mark('homeRendered')"));
});
test('heavy preloads stay active for existing users but not welcome-first visits',()=>{
 assert.ok(html.includes('if(window.PAI_WELCOME_FAST)return;'));
 assert.ok(html.includes('"data/core20k-runtime.json.gz"'));
 assert.ok(html.includes('"scripts/core20k-unified-runtime-adapter.mjs"'));
 assert.ok(!/<link rel="(?:preload|modulepreload)"/.test(html));
});
test('first welcome renders before heavy bootstrap and premature entrance waits',()=>{
 assert.ok(html.includes('requestAnimationFrame(()=>requestAnimationFrame(()=>'));
 assert.ok(welcome.includes('pai-home-ready'));
 assert.ok(welcome.includes('window.PAI_WELCOME_VISIBLE=true'));
 assert.ok(welcome.includes("window.addEventListener('pai-home-ready',finish,{once:true})"));
 assert.ok(bootstrap.includes("window.dispatchEvent(new Event('pai-home-ready'))"));
});
test('welcome reset and SRS boundaries remain safe',()=>{
 assert.ok(welcome.includes("if(window.PAI_LAST_RESET_QA?.passed)showWelcome()"));
 assert.ok(bootstrap.includes("localStorage.removeItem('pai-word-welcome-seen-v1')"));
 assert.ok(welcome.includes('fetchpriority="high" loading="eager"'));
 assert.ok(!welcome.includes('PAI_KU_DURABLE'));
});

test('comic preload has first priority; returning visitor app styles remain immediate',()=>{
 assert.ok(html.includes("comic.rel='preload';comic.as='image'"));
 assert.ok(html.includes("comic.type='image/webp'"));
 assert.ok(html.includes('pai-ai-mathematicians-comic.webp?v=comic-webp-q88-v1'));
 assert.ok(welcome.includes('<picture class="pai-welcome-comic-picture">'));
 assert.ok(welcome.includes('type="image/webp"'));
 assert.ok(welcome.includes('pai-ai-mathematicians-comic.jpg?v=comic-v2'));

 assert.ok(html.includes("comic.fetchPriority='high'"));
 assert.ok(html.includes(":loadAppStyles()"));
});
