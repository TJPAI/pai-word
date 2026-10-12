const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');

test('Core-13000 loader is local-first but still verifies cached bytes',()=>{
  const src=read('core-loader.js');
  assert.match(src,/pai-word-lexicon-v1/);
  assert.match(src,/indexedDB\.open/);
  assert.ok(src.indexOf('idbGet(ASSET_STORE,key)')<src.indexOf('fetchNetworkBytes(file,bytes,sha)'));
  assert.match(src,/verifyBytes\(cached\.bytes,bytes,sha,file\)/);
  assert.match(src,/crypto\.subtle\.digest\('SHA-256'/);
  assert.match(src,/manifestCached/);
  assert.match(src,/offlineReady=localStatus\.supported&&localStatus\.manifestCached/);
});

test('app shell service worker provides network-first offline fallback without duplicating lexicon packs',()=>{
  const src=read('sw.js');
  assert.match(src,/pai-word-shell-v1/);
  assert.match(src,/cache\.addAll\(SHELL\)/);
  assert.match(src,/url\.pathname\.includes\('\/data\/core13000-v25\.5\/'\)/);
  assert.match(src,/caches\.match\(event\.request,\{ignoreSearch:true\}\)/);
  assert.match(src,/event\.request\.mode==='navigate'/);
});
