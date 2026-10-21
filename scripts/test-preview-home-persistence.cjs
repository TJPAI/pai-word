// node --test scripts/test-preview-home-persistence.cjs
// No external dependencies; exercises the actual browser persistence queue implementation.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../rebuild-preview/preview-state.js'),'utf8');
const begin=source.indexOf('const PAI_SETTING_KEYS=');
const end=source.indexOf('function save(){',begin);
assert(begin>=0&&end>begin,'Cannot locate actual persistence queue source');
const queueSource=source.slice(begin,end);

test('rapid A→B→A settings and home changes preserve last selection',async()=>{
  const writes={home:[],settings:[]};
  const state={sceneSearchUi:{query:'A'},autoBrowseInterval:1};
  const context={
    state,Promise,JSON,Object,console,structuredClone,
    window:{
      PAI_KU_STORAGE_READY:true,
      PAI_KU_DURABLE_DB:{},
      PAI_KU_DURABLE:{
        writeHome:async(_db,snapshot)=>{await Promise.resolve();writes.home.push(structuredClone(snapshot))},
        writeSettings:async(_db,snapshot)=>{await Promise.resolve();writes.settings.push(structuredClone(snapshot))}
      }
    },
    document:{getElementById:()=>null,createElement:()=>({style:{},setAttribute(){},remove(){}}),body:{appendChild(){}}},
    setTimeout:()=>{}
  };
  vm.createContext(context);
  vm.runInContext(queueSource,context);
  for(const [q,n] of [['A',1],['B',2],['A',1]]){
    state.sceneSearchUi={query:q};
    state.autoBrowseInterval=n;
    vm.runInContext('persistHomeState();persistIndependentSettings();',context);
  }
  await vm.runInContext('window.PAI_PERSISTENCE_FLUSH()',context);
  assert.equal(writes.home.at(-1).sceneSearchUi.query,'A');
  assert.equal(writes.settings.at(-1).autoBrowseInterval,1);
  assert.equal(writes.home.length,3);
  assert.equal(writes.settings.length,3);
});
