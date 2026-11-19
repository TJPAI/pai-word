import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const root={};
vm.runInNewContext(readFileSync(new URL('../../rebuild-preview/scene1341-readonly/scene500-native-cycle-exact.js',import.meta.url),'utf8'),{window:root,globalThis:root});
const next=root.PAI_SCENE1341_NATIVE_CYCLE.nextIndex;
const rows=Array.from({length:63},(_,i)=>({scene_ku_id:'SC1341-KU-'+i}));
for(const size of [10,25,50]){
 assert.equal(next(rows,0,-1,size),Math.min(size,rows.length)-1,'first round wraps backward');
 assert.equal(next(rows,size-1,1,size),0,'first round wraps forward');
 assert.equal(next(rows,size, -1,size),Math.min(size*2,rows.length)-1,'second round wraps backward');
 assert.equal(next(rows,rows.length-1,1,size),Math.floor((rows.length-1)/size)*size,'short last round wraps forward');
 assert.equal(next(rows,size+1,1,size),size+2,'normal navigation stays in round');
}
assert.equal(next(rows,0,1,10),1);
assert.equal(next(rows,0,1,25),1);
assert.equal(next([],0,1,10),-1);
assert.throws(()=>next([{scene_ku_id:'duplicate'},{scene_ku_id:'duplicate'}],0,1,10),/SC1341_NATIVE_CYCLE_BAD_KU_IDENTITY/);
console.log('PASS: Scene500 native cycle 10/25/50, partial final round, reverse and identity guard');
