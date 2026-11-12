import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {loadScene1341QAProvisional} from '../../rebuild-preview/scene1341-readonly/scene1341-qa-preview-loader.mjs';

if(!globalThis.crypto?.subtle)globalThis.crypto=crypto.webcrypto;
const html=await fs.readFile(new URL('../../rebuild-preview/scene1341-readonly/index.html',import.meta.url),'utf8');
const main=await fs.readFile(new URL('../../rebuild-preview/index.html',import.meta.url),'utf8');
const welcome=await fs.readFile(new URL('../../rebuild-preview/scene1341-readonly/scene1341-welcome.js',import.meta.url),'utf8');
const originalWelcome=await fs.readFile(new URL('../../rebuild-preview/welcome.js',import.meta.url),'utf8');
const homeStyle=await fs.readFile(new URL('../../rebuild-preview/scene1341-readonly/scene500-home.css',import.meta.url),'utf8');
const inline=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(inline,'Scene1341 uses own inline learning interaction');
new vm.Script(inline,{filename:'scene1341-standalone-inline.js'});
for(const id of ['home','learning','scene-title','continue','search','find-scenes','browse','preview-stats-button',
 'preview-settings-button','scenes','stats-panel','settings-panel','rec-status','expression','answer',
 'speak','example-speak','auto-toggle','collocations','example','translation']){
 assert(html.includes('id="'+id+'"'),'Missing native compatible UI identifier '+id);
}
for(const token of ['home-dashboard','home-topbar','home-brand','home-actions','continue-card',
 'scene-search-card','scene-query','scene-search-controls','scene-result','browse-link',
 'screen study-screen learning-screen demo-learning','recall-correction','pai-scratch-area']){
 assert(html.includes(token),'Scene500 UI contract missing '+token);
}
assert(html.includes('../welcome.css'),'Native Scene500 welcome stylesheet reused');
assert(html.includes('scene1341-welcome.js'),'Standalone welcome must be scoped to this route');
assert(welcome.includes('1,341 个真实场景'));
assert(welcome.includes('pai-word-scene1341-welcome-seen-v1'));
assert(!welcome.includes('pai-word-welcome-seen-v1'),'Must not change Scene500 welcome seen status');
assert(welcome.includes('../assets/pai-ai-mathematicians-comic.webp'));
assert(originalWelcome.includes('500 个真实场景'),'Original Scene500 welcome remains unmodified');
assert(homeStyle.includes('.home-topbar'),'Original Scene500 homepage CSS reused');
assert(inline.includes('scene1341-qa-preview-loader.mjs'),'Newest 1778 CG-QA preview loader wired');
assert(inline.includes('items.length!==1778'));
assert(inline.includes('scene1341-rec-bridge.mjs'),'Native recommendation adapter kept');
assert(inline.includes('recRows=rows'),'Search must render real CG-REC result order');
assert(inline.includes('window.PAI_SCENE1341_SCRATCH_RESET'));
assert(inline.includes('autoBrowse.pause()'));
assert(inline.includes('function renderCard()'));
assert(!html.includes('切换到 Scene1341 场景'),'Legacy debug switch not permitted');
assert(!html.includes('raw.githack'));
assert(!html.includes('cdn.jsdelivr'));
assert(html.includes('data-srs-write="disabled"'),'No regular SRS write allowed');
assert(html.includes('data-grade="again" disabled'));
assert(html.includes('data-grade="hard" disabled'));
assert(html.includes('data-grade="good" disabled'));
const shell=await fs.readFile(new URL('../../rebuild-preview/home-dashboard.js',import.meta.url),'utf8');
assert(shell.includes("get('scene1341')==='1'"),'Original Scene500 home remains opt-in and unchanged');
assert(main.includes('rebuild-preview/welcome.js'),'Native main still uses original welcome script');
function blob(s){const b=Buffer.from(s);return createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex')}
assert.equal(blob(main),'4f68df5f88b7baa64a30be643232d22374034055','Original Scene500 main index cannot change');
assert.equal(blob(shell),'14570b9dec288f139be0fc9e843e3e8683f99a6f','Original Scene500 homepage cannot change');

const qaDir=process.env.SCENE1341_QA_SOURCE_DIR;
if(qaDir){
 const sourceCommit='79ad2a35a3922b70cea00976627935c7d34a3630';
 const fetchImpl=async url=>{
   const rest=new URL(url).pathname.split('/'+sourceCommit+'/')[1];
   if(!rest||!rest.startsWith('tools/core20k_lexicon/qa/'))throw Error('OFF_REPO_QA_FETCH');
   return new Response(await fs.readFile(path.join(qaDir,rest)),{status:200});
 };
 const qa=await loadScene1341QAProvisional({fetchImpl});
 assert.equal(qa.total,1778);
 assert.equal(qa.scenes,10);
 assert.equal(qa.excludedBlocked,260);
 assert.equal(qa.productionRelease,false);
 assert.equal(qa.canWriteSrs,false);
 assert.equal(new Set(qa.items.map(x=>x.scene_ku_id)).size,1778);
 assert.equal(new Set(qa.items.map(x=>x.scene_id)).size,10);
 assert(qa.items.every(x=>x.cg_qa==='PASS'&&x.source_master_authorization_verified===false));
 // Tampered blob must fail closed even if JSON parses and counts are unchanged.
 let mutated=false;
 const tamper=async url=>{
  const res=await fetchImpl(url),text=await res.text();
  if(!mutated&&String(url).endsWith('.v2.json')&&!String(url).includes('MANIFEST')){
   mutated=true;return new Response(text+' ',{status:200});
  }
  return new Response(text,{status:200});
 };
 await assert.rejects(()=>loadScene1341QAProvisional({fetchImpl:tamper}),/PREVIEW_SOURCE_BLOB_MISMATCH/);
 console.log(JSON.stringify({status:'PASS',route:'scene1341-readonly/index.html',
  qaShards:7,qaPreviewKU:qa.total,blocked:qa.excludedBlocked,
  realQAHashVerified:true,tamperBlocked:true,scenes:1341,learningScopes:qa.scenes,
  nativeScene500Untouched:true,productionSrsWrites:0}));
}else{
 console.log(JSON.stringify({status:'SOURCE_STATIC_PASS',route:'scene1341-readonly/index.html',
 nativeScene500Untouched:true,productionSrsWrites:0,qaRuntimeNetworkTestPending:true}));
}
