import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {loadHomeSources} from './build-v21-home-ku-metadata.mjs';
import {inspectHomeBudget,countDueFromHomeMetadata} from '../rebuild-preview/light-home-budget.mjs';
const {core}=await loadHomeSources();
const metadata=JSON.parse(fs.readFileSync('rebuild-preview/data/home-ku-metadata-v1.json'));
const source=fs.readFileSync('rebuild-preview/learning-runtime.js','utf8');
const daily=source.split('// SOURCE: app-runtime.js')[0];
const due=source.match(/const due=\(\)=>Object.entries\(state.records\).*?;/)[0];
const entries=[...core.byKU.keys()];let cases=0;
for(const scene of ['daily','S001','S123'])for(const quota of [25,50,100,200])for(const stale of [false,true]){
 const state={newPerDay:quota,wordsPerRound:25,selectedScene:scene,records:{}};
 entries.forEach((k,i)=>{if(i%7===0)state.records[k]={due:i%2?Date.now()+999999:0};if(i%13===0)state.records[k]={due:Date.now()+999999,learningPending:true};if(i%17===0)state.records[k]={due:Date.now()+999999,lastKnown:false}});
 state.records.orphan={due:0};
 const c={state,window:{PAI_CORE:core},SCENES:globalThis.SCENES,save:()=>{},findUnitByKey:k=>core.byKU.get(k),unitKey:(w,sid)=>sid,queueFor:null,todayCount:null,byKey:k=>core.byKU.get(k),Date,console};
 vm.createContext(c);vm.runInContext(daily+'\n'+due+'\nglobalThis.expectedDue=due;',c);
 c.window.rebuildDailyAssignments();
 if(stale)state.daily.date='2000-01-01';
 const before=JSON.stringify(state),projected=inspectHomeBudget(state,{kuMetadata:metadata});
 assert.equal(JSON.stringify(state),before,'projection writes state');
 assert.equal(projected.due,c.expectedDue().length);
 assert.equal(projected.reinforcementRemaining,c.window.globalReinforcementRemaining());
 assert.equal(projected.dailyCompleted,c.window.globalNewCompleted());cases++;
}
const repeated=metadata.sceneOccurrences.find(([,n])=>n>1)[0];
assert.equal(countDueFromHomeMetadata({[repeated]:{due:0}},metadata),1);
assert.equal(inspectHomeBudget({records:{}},{kuMetadata:metadata}).complete,true);
console.log('PASS real-runtime budget parity',cases,'cases; distinct KU due, stale rebuild, read-only');
