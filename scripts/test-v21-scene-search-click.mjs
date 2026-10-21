import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../scene-search.js',import.meta.url),'utf8');
const opened=[],state={scene500Recent:[]};
const window={PAI_CORE20K_ROOT:true,PAI_SCENE500:{specs:[
 {id:'S104',name:'机场值机',desc:'航班登机',tags:['机场','值机']},
 {id:'S113',name:'预订酒店',desc:'住宿订房',tags:['酒店','订房']}
]},PAI_LIGHT_HOME_INDEX:{scenes:{
 S104:{counts:{all:20,basic:7}},S113:{counts:{all:18,basic:5}}
}},PAI_DEFERRED_LEARNING_ENTRY:{enter(id,d){opened.push([id,d]);return true}}};
const context={window,state,location:{search:''},allUnits:()=>[],save(){}};
vm.createContext(context);vm.runInContext(source,context);
const search=window.PAI_SCENE_SEARCH;
const flight=search.search('我要坐飞机在机场值机','all',5);
const hotel=search.search('住酒店订房','basic',5);
assert.equal(flight[0]?.id,'S104');
assert.equal(flight[0]?.reviewedCount,20);
assert.equal(hotel[0]?.id,'S113');
assert.equal(hotel[0]?.reviewedCount,5);
assert.equal(search.inventory('S113','basic').reviewedCount,5);
assert.equal(search.open(flight[0].id,'all'),true);
assert.deepEqual(opened,[['S104','all']],'click must enter deferred engine');
assert.deepEqual(state.scene500Recent,[],'deferred click must not save history before engine loads');
console.log('PASS: Scene500 search relevance, difficulty counts, deferred click routing');
