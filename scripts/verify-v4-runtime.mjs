import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const fail=(msg)=>{throw new Error('[v4 runtime QA] '+msg)};
const must=(ok,msg)=>{if(!ok)fail(msg)};

const bootstrap=read('core-bootstrap.js');
const loader=read('lazy-loader.js');
const daily=read('daily.js');
const storage=read('v4-storage.js');
const ui=read('v4-ui.js');
const sw=read('sw.js');

must(!bootstrap.includes("script('learning-runtime.js')"),'core-bootstrap still loads legacy bundled learning-runtime.js');
for(const f of ['daily.js','app-runtime.js','ku-content-ui.js','tap-flow.js','scene-review-v4.js','learning-app.js'])must(bootstrap.includes(`'${f}'`),`core-bootstrap does not load ${f}`);
must(bootstrap.includes("script('v4-ui.js')"),'v4-ui adapter is not loaded');

must(loader.includes("manifest.wordCount"),'loader does not use manifest.wordCount');
must(loader.includes("manifest.kuCount"),'loader does not use manifest.kuCount');
must(loader.includes("manifest.taxonomy"),'loader does not use manifest.taxonomy');
must(loader.includes("manifest.chunks"),'loader does not use manifest.chunks');
must(!loader.includes('rows.length!==13000'),'loader still hard-codes 13,000 words');
must(!loader.includes('core.byKU.size!==16616'),'loader still hard-codes old KU count');
must(!loader.includes('totalChunks:52'),'loader still hard-codes old chunk count');

must(daily.includes('PAI_MANIFEST?.wordCount'),'daily policy does not derive lexicon limit from the manifest');
must(!daily.includes('scopeLimit=()=>13000'),'daily policy still hard-codes 13,000');

must(storage.includes("'pai-word-mobile-v1::'+release"),'progress storage is not release-scoped');
must(storage.includes("state.voiceAccent='us'"),'v4 storage does not force current US speech policy');
must(!storage.includes('legacySrsPending'),'v4 storage should not migrate legacy SRS records');

must(ui.includes('PAI_SCENE_KU_COUNTS'),'scene counts are not manifest-driven');
must(ui.includes('PAI_TRACK_KU_COUNTS'),'track counts are not manifest-driven');
must(ui.includes("state.voiceAccent='us'"),'v4 UI does not lock speech to US');
must(ui.includes("split('\\n')"),'bilingual example rendering adapter missing');
must(ui.includes('u.w.allSenses=senses.map'),'v4 multisense compatibility adapter missing');

must(!sw.includes("'./learning-runtime.js'"),'service-worker shell still caches legacy bundled runtime');
must(sw.includes("'./scene-review-v4.js'"),'service-worker shell is missing v4 scene-review compatibility layer');
must(sw.includes("'./v4-storage.js'"),'service-worker shell is missing release-scoped storage bridge');
must(sw.includes("'./v4-ui.js'"),'service-worker shell is missing v4 UI adapter');

console.log(JSON.stringify({status:'PASS',checks:'v4 runtime/data-boundary invariants',files:['core-bootstrap.js','lazy-loader.js','daily.js','v4-storage.js','v4-ui.js','sw.js']},null,2));
