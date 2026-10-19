import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../rebuild-preview/migration-probe.mjs',import.meta.url),'utf8')
 .replace(/^import .*$/gm,'').replace(/^export /gm,'');
const legacy=JSON.stringify({records:{ku1:{lastGrade:'good'}}});
async function run(baseline,changeSource=false){
 let closeCount=0,seedCount=0,readCount=0;
 const db={close(){closeCount++}};
 const storage={getItem(){readCount++;return changeSource&&readCount>1?legacy+' ':legacy}};
 const context=vm.createContext({localStorage:storage,structuredClone,JSON,Object,Promise,
  openPreviewDB:async()=>db,readSnapshot:async()=>baseline,
  initializeSnapshot:async()=>{seedCount++;return {status:'initialized',version:0}}});
 vm.runInContext(source+';globalThis.inspect=inspectAndSeedPreview',context);
 const result=await context.inspect({storage});
 assert.equal(closeCount,1,'database must close');
 return {result,seedCount};
}
const old={version:4,state:{records:{ku1:{lastGrade:'hard'}}},committedAttempts:{}};
let x=await run(old);assert.equal(x.result.status,'existing-indexeddb');assert.equal(x.seedCount,0);
const empty={version:0,state:null,committedAttempts:{}};
x=await run(empty,true);assert.equal(x.result.status,'legacy-changed-retry');assert.equal(x.seedCount,0);
x=await run(empty);assert.equal(x.result.status,'seeded-readonly');assert.equal(x.seedCount,1);
x=await run({...empty,version:2});assert.equal(x.result.status,'invalid-indexeddb-baseline');assert.equal(x.seedCount,0);
console.log('PASS: existing, changed source, empty, invalid baseline; connections closed');
