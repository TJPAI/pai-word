// Run: node scripts/test-v21-offline-shell.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../rebuild-preview/sw.js',import.meta.url),'utf8');
const events={},stored=new Map(),writes=[],requests=[],deleted=[];
let online=true;
const sw={
 registration:{scope:'https://example.test/pai-word/rebuild-preview/'},
 addEventListener:(name,cb)=>{events[name]=cb},
 skipWaiting:async()=>{},clients:{claim:async()=>{}}
};
const caches={
 keys:async()=>['pai-word-rebuild-preview-light-home-v21-previous'],
 delete:async key=>{deleted.push(key);return true},
 open:async()=>({
  put:async(request,response)=>{stored.set(typeof request==='string'?request:request.url,response);writes.push(typeof request==='string'?request:request.url)},
  keys:async()=>[...stored.keys()].map(url=>({url})),
  match:async (request,options)=>{assert.equal(options,undefined);return stored.get(typeof request==='string'?request:request.url)||null}
 })
};
const fetcher=async request=>{
 requests.push(request.url);
 if(!online)throw Error('offline');
 return {ok:true,type:'basic',clone(){return this},value:'network'};
};
vm.runInNewContext(source,{self:sw,caches,fetch:fetcher,URL,decodeURIComponent,Promise,Set,Response:class {constructor(value){this.value=value}}});
async function request(url,method='GET'){
 let response,waits=[];
 events.fetch({request:{method,url},clientId:'preview-client',
  respondWith(p){response=p},waitUntil(p){waits.push(p)}});
 if(!response)return null;
 const result=await response;
 await Promise.all(waits);
 return result;
}
let activated;
events.activate({waitUntil:p=>{activated=p}});
await activated;
assert.deepEqual(deleted,[], 'activation must not discard older rollback cache');
const home='https://example.test/pai-word/rebuild-preview/index.html?v=test';
assert.equal((await request(home)).value,'network');
assert.equal(writes.length,1);
online=false;
await assert.rejects(request(home),/OFFLINE_HOME_INCOMPLETE/);
const required=[
 'rebuild-preview/preview-state.js','rebuild-preview/bootstrap.js',
 'rebuild-preview/home-index.mjs','rebuild-preview/light-home-startup.mjs',
 'rebuild-preview/light-home-budget.mjs','rebuild-preview/learning-entry.mjs',
 'rebuild-preview/light-home-view.mjs','rebuild-preview/home-dashboard.js',
 'rebuild-preview/scene-search.js','rebuild-preview/data/home-scene-index-v1.json',
 'rebuild-preview/data/home-ku-metadata-v1.json.gz'
];
online=true;
for(const asset of required)await request('https://example.test/pai-word/'+asset);
online=false;
await assert.rejects(request(home),/OFFLINE_HOME_NOT_SEALED/);
let sealed;
events.message({data:{type:'PAI_HOME_BOOT_OK'},source:{url:home},waitUntil:p=>{sealed=p}});
await sealed;
assert.equal((await request(home)).value,'network');
await assert.rejects(request('https://example.test/pai-word/rebuild-preview/index.html?v=other'),/offline/);
assert.equal(await request('https://example.test/pai-word/data/core20k-runtime.json.gz'),null);
assert.equal(await request('https://example.test/pai-word/data/scene500-top100-v40/group-01.json'),null);
assert.equal(await request('https://example.test/pai-word/index.html'),null);
assert.equal(await request(home,'POST'),null);
assert.equal(await request('https://example.test/pai-word/rebuild-preview/missing.js'),null);
console.log('PASS preview offline shell: on-demand cache, offline fallback, no heavy-resource interception');
