import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('rebuild-preview/scene1341-ranked/sw.js','utf8');
const handlers=new Map();
const host='https://example.test/v22-integration/rebuild-preview/scene1341-ranked/';
let connected=true,networkCount=0;
const objects=new Map();
const absolute=u=>new URL(typeof u==='string'?u:u.url,host+'sw.js').href;
const fetchImpl=async input=>{
  if(!connected)throw Error('SIMULATED_OFFLINE');
  networkCount++;
  return new Response('source:'+absolute(input),{status:200});
};
const cachesMock={
  async open(name){
    if(!objects.has(name))objects.set(name,new Map());
    const items=objects.get(name);
    return {
      async addAll(urls){for(const url of urls){const key=absolute(url);items.set(key,(await fetchImpl(url)).clone());}},
      async match(input){const r=items.get(absolute(input));return r?.clone();},
      async put(input,response){items.set(absolute(input),response.clone());}
    };
  }
};
const selfMock={
  location:{href:host+'sw.js'},
  clients:{claim:async()=>{}},
  skipWaiting:async()=>{},
  addEventListener:(type,handler)=>handlers.set(type,handler)
};
vm.runInNewContext(source,{
  self:selfMock,caches:cachesMock,URL,Response,fetch:fetchImpl
},{filename:'scene1341-ranked/sw.js'});
assert(handlers.has('install')&&handlers.has('activate')&&handlers.has('fetch'));
let installation;
handlers.get('install')({waitUntil:p=>{installation=p;}});
await installation;
assert.equal(objects.get('pai-word-scene1341-ranked-shell-v1').size,6);
let activation;
handlers.get('activate')({waitUntil:p=>{activation=p;}});
await activation;
const invoke=async url=>{
  let promise;
  handlers.get('fetch')({request:new Request(url),respondWith:p=>{promise=p;}});
  return promise?await promise:null;
};
const shell=host+'index.html';
const external='https://example.test/v22-integration/rebuild-preview/index.html';
assert.equal(await invoke(external),null,'normal study app must never be intercepted');
const before=networkCount;
connected=false;
let response=await invoke(shell);
assert.equal(response.status,200);
assert.equal(networkCount,before);
connected=true;
const batch='https://example.test/v22-integration/tools/integration/scene1341-ranked/v61-ranked.csv';
response=await invoke(batch);
assert.equal(response.status,200);
connected=false;
response=await invoke(batch);
assert.equal(response.status,200);
const missing='https://example.test/v22-integration/tools/integration/scene1341-ranked/v60-ranked.csv';
response=await invoke(missing);
assert.equal(response.status,503,'uncached data must never masquerade as available');
assert.equal(await invoke(external),null);
console.log('PASS isolated service worker install/cache/offline; unrelated PAI Word app untouched');
