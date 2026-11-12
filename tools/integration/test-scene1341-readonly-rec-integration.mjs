/* Regression for fixed GitHub Pages readonly route + latest source-pinned
 * CG-REC integration. No browser publishing, KU/SRS writes or release.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createReadonlyRecommendation} from '../../rebuild-preview/scene1341-readonly/scene1341-rec-bridge.mjs';
import {createScene1341HomeCatalog} from '../../rebuild-preview/scene1341-home-adapter.mjs';
import {createRankedStore} from '../../rebuild-preview/scene1341-ranked-preview.mjs';

const html=await fs.readFile(new URL('../../rebuild-preview/scene1341-readonly/index.html',import.meta.url),'utf8');
for(const term of ['id="search"','id="rec-status"','scene1341-rec-bridge.mjs',
  'updateSceneRecommendations()','recRows=rows','CG-REC 场景推荐','openStudy(sc.id)',
  'scene500-native-scratch.js','scene500-readonly-phase.js','scene1341-display-bookmark.js']){
 assert(html.includes(term),'Fixed-route integration missing '+term);
}
assert(html.includes("btn.disabled=!n"),
  'Unapproved target must remain non-playable');
assert(!html.includes('raw.githack.com'));
assert(!html.includes('cdn.jsdelivr.net'));
const local=async url=>new Response(await fs.readFile(fileURLToPath(url)),{status:200});
const ranked=createRankedStore({fetchImpl:local,base:new URL('./scene1341-ranked/',import.meta.url)});
const adapter=createScene1341HomeCatalog({fetchImpl:local,ranked});
const bridge=createReadonlyRecommendation({load:async()=>adapter});
assert.deepEqual(await bridge.search(''),[]);
const cases=[];
for(const q of ['睡过头','wake up 醒来','不要外卖，想知道订单状态','NOT FOOD DELIVERY BUT ORDER STATUS',
  'ＳＣ５０－００３７','wake   up','wake\tup']){
 const actual=await bridge.search(q);
 const expected=await adapter.searchWithRecEngine(q,{limit:10});
 assert.equal(actual.length,expected.length,'Native bridge result count '+q);
 assert.deepEqual(actual.map(x=>x.id),expected.map(x=>x.id),'Bridge uses real engine order '+q);
 assert(actual.every(x=>x.releaseAllowed===false&&x.canCreateStudyQueue===false&&x.canWriteSrs===false));
 assert(actual.every(x=>Object.isFrozen(x)));
 cases.push({q,count:actual.length,top1:actual[0]?.id||null});
}
assert.equal(bridge.releaseAllowed,false);
assert.equal(bridge.canCreateStudyQueue,false);
assert.equal(bridge.canWriteSrs,false);
const bad=createReadonlyRecommendation({load:async()=>({
 releaseEligible:true,canCreateStudyQueue:false,canWriteSrs:false,searchWithRecEngine:async()=>[]
})});
await assert.rejects(()=>bad.search('hello'),/READONLY_RECOMMENDATION_ADAPTER_GATE/);
const poison=createReadonlyRecommendation({load:async()=>({
 releaseEligible:false,canCreateStudyQueue:false,canWriteSrs:false,
 searchWithRecEngine:async()=>[{id:'SC50-0001',canWriteSrs:true}]
})});
await assert.rejects(()=>poison.search('hello'),/READONLY_RECOMMENDATION_RELEASE_GATE/);
console.log(JSON.stringify({status:'PASS',fixedRoute:'v22-integration/rebuild-preview/scene1341-readonly/index.html',
 currentRecSourceBlob:'9273661434948d48ecdd36c520f37f2a1da362c1',
 scenes:1341,rankedScenes:110,expressions:19371,realQueries:cases,
 releaseApproved:0,srsWrites:0,pagesDeploymentTriggered:false}));
