// Run: node scripts/test-v21-offline-shell.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../rebuild-preview/sw.js',import.meta.url),'utf8');
const events={},stored=new Map(),writes=[],requests=[];
let online=true;
const sw={
 registration:{scope:'https://example.test/pai-word/rebuild-preview/'},
 addEventListener:(name,cb)=>{events[name]=cb},
 skipWaiting:async()=>{},clients:{claim:async()=>{}}
};
const caches={
 keys:async()=>[],
 delete:async()=>true,
 open:async()=>({
  put:async(request,response)=>{stored.set(request.url,response);writes.push(request.url)},
  match:async (request,options)=>{assert.equal(options,undefined);return stored.get(request.url)||null}
 })
};
const fetcher=async request=>{
 requests.push(request.url);
 if(!online)throw Error('offline');
 return {ok:true,type:'basic',clone(){return this},value:'network'};
};
vm.runInNewContext(source,{self:sw,caches,fetch:fetcher,URL,decodeURIComponent,Promise,Set});
async function request(url,method='GET'){
 let response,waits=[];
 events.fetch({request:{method,url},clientId:'preview-client',
  respondWith(p){response=p},waitUntil(p){waits.push(p)}});
 if(!response)return null;
 const result=await response;
 await Promise.all(waits);
 return result;
}
const home='https://example.test/pai-word/rebuild-preview/index.html?v=test';
assert.equal((await request(home)).value,'network');
assert.equal(writes.length,1);
online=false;
assert.equal((await request(home)).value,'network');
await assert.rejects(request('https://example.test/pai-word/rebuild-preview/index.html?v=other'),/offline/);
assert.equal(await request('https://example.test/pai-word/data/core20k-runtime.json.gz'),null);
assert.equal(await request('https://example.test/pai-word/data/scene500-top100-v40/group-01.json'),null);
assert.equal(await request('https://example.test/pai-word/index.html'),null);
assert.equal(await request(home,'POST'),null);
assert.equal(await request('https://example.test/pai-word/rebuild-preview/missing.js'),null);
console.log('PASS preview offline shell: on-demand cache, offline fallback, no heavy-resource interception');
