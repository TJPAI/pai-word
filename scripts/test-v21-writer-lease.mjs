// node scripts/test-v21-writer-lease.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const src=fs.readFileSync(new URL('../rebuild-preview/preview-state.js',import.meta.url),'utf8');
const from=src.indexOf('// One exclusive preview writer.');
const to=src.indexOf('\nfunction unitKey(',from);
assert.ok(from>=0&&to>from);
async function make(){
 let stored='{}',held=false,released=0,writerResolve,events={};
 const window={addEventListener:(name,fn)=>{events[name]=fn}};
 const navigator={locks:{request:async (name,opts,cb)=>{
  assert.equal(opts.ifAvailable,true);
  if(held)return cb(null);
  held=true;
  await cb({name});
  held=false;released++;
 }}};
 const localStorage={getItem:()=>stored,setItem:(k,v)=>{stored=v}};
 const context={window,navigator,localStorage,savedSnapshot:'{}',STORAGE:'preview-test',state:{stats:{}},Error,Promise};
 vm.runInNewContext(src.slice(from,to),context);
 return {window,events,localStorage,context,held:()=>held,released:()=>released,change:v=>{stored=v}};
}
const a=await make();
assert.equal(await a.window.acquirePreviewWriter(),true);
assert.equal(a.window.PAI_PREVIEW_WRITABLE,true);
a.change('{"changed":true}');
assert.throws(()=>vm.runInNewContext('save()',a.context),/其他页面更新/);
await Promise.resolve();
assert.equal(a.window.PAI_PREVIEW_WRITABLE,false);
assert.equal(a.released(),1);
const b=await make();
assert.equal(await b.window.acquirePreviewWriter(),true);
b.events.pagehide();
await Promise.resolve();
assert.equal(b.window.PAI_PREVIEW_WRITABLE,false);
assert.equal(b.released(),1);
const c=await make();
assert.equal(await c.window.acquirePreviewWriter(),true);
c.events.pageshow({persisted:true});
await Promise.resolve();
assert.equal(c.window.PAI_PREVIEW_WRITABLE,false);
assert.match(c.window.PAI_PREVIEW_WRITE_REASON,/刷新/);
console.log('PASS writer lease: stale release, pagehide release, bfcache read-only');
