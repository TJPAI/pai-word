import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const bootstrap=readFileSync(new URL('../rebuild-preview/bootstrap.js',import.meta.url),'utf8');
const home=readFileSync(new URL('../rebuild-preview/home-dashboard.js',import.meta.url),'utf8');
function restoredState(previous,typed='',preboot=null){
 const state={sceneSearchUi:previous};
 const expr=bootstrap.match(/state\.sceneSearchUi=\{\.\.\.\(state\.sceneSearchUi\|\|\{\}\),query:[^;]+;/)?.[0];
 assert(expr,'boot scene restoration assignment missing');
 const ctx=vm.createContext({state,preboot,typed,difficulty:'all'});
 vm.runInContext(expr,ctx);
 return state.sceneSearchUi;
}
let s=restoredState({query:'无人机仓储盘点',difficulty:'high',resultIds:['S274']},'页面里的旧文本');
assert.equal(s.query,'无人机仓储盘点');
assert.equal(s.difficulty,'high');
assert.deepEqual(Array.from(s.resultIds),['S274']);
s=restoredState({query:'会议',difficulty:'common',resultIds:['S165']},'',{query:'酒店',difficulty:'basic'});
assert.equal(s.query,'酒店');assert.equal(s.difficulty,'basic');assert.equal(s.resultIds.length,0);
assert.match(bootstrap,/restoreScene500Recommendations\(\)/);
assert.doesNotMatch(home,/PAI_SCENE500_TOP100_READY\?\.then\(\(\)=>runSceneSearch/);
assert.match(home,/runSceneSearch\(q,s\.difficulty\|\|'all'(?:,[^)]*)?\)/);
console.log('PASS: restored query/difficulty/results, new preboot query precedence and no Top100 blocking');
