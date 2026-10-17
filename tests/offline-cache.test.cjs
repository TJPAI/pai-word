const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');

test('Core-13000 loader is local-first but still verifies cached bytes',()=>{
  const src=read('core-loader.js');
  assert.match(src,/pai-word-lexicon-v1/);
  assert.match(src,/indexedDB\.open/);
  const body=src.match(/async function fetchBytes\(file,bytes,sha\)\{([\s\S]*?)\n  \}/)?.[1]||'';
  assert.ok(body.indexOf('idbGet(ASSET_STORE,key)')>=0&&body.indexOf('idbGet(ASSET_STORE,key)')<body.indexOf('fetchNetworkBytes(file,bytes,sha)'));
  assert.match(src,/verifyBytes\(cached\.bytes,bytes,sha,file\)/);
  assert.match(src,/crypto\.subtle\.digest\('SHA-256'/);
  assert.match(src,/manifestCached/);
  assert.match(src,/offlineReady=localStatus\.supported&&localStatus\.manifestCached/);
});

test('current app shell is versioned and caches only bootstrap-critical Scene500 data',()=>{
  const sw=read('sw.js');
  const boot=read('core-bootstrap.js');
  const index=read('index.html');
  const swVersion=sw.match(/pai-word-shell-(tap-[^']+)/)?.[1];
  const bootVersion=boot.match(/const VERSION='([^']+)'/)?.[1];
  assert.ok(swVersion&&bootVersion);
  assert.equal(swVersion,bootVersion);
  assert.match(index,new RegExp('core-bootstrap\\.js\\?v='+bootVersion.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(sw,/MEMBERSHIP='\.\/data\/scene500-playable-membership-v1\.json'/);
  assert.match(sw,/SHELL=.*MEMBERSHIP/);
  assert.match(sw,/u\.pathname\.includes\('\/data\/'\)&&!membership/);
  assert.match(sw,/if\(membership\)/);
  assert.match(sw,/c\.match\(MEMBERSHIP\)/);
  assert.match(sw,/fetch\(e\.request,\{cache:'no-store'\}\)/);
  assert.match(boot,/PAI_SCENE500_MEMBERSHIP=await json\('data\/scene500-playable-membership-v1\.json'\)/);
});

test('an already-open older shell reloads when a different service-worker version activates',()=>{
  const boot=read('core-bootstrap.js');
  assert.match(boot,/e\.data\?\.type!==['"]PAI_SHELL_UPDATED['"]/);
  assert.match(boot,/next===VERSION/);
  assert.match(boot,/location\.reload\(\)/);
});
