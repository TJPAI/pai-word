import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createRankedStore} from '../../rebuild-preview/scene1341-ranked-preview.mjs';

// Simulate the GitHub Pages v22-integration subdirectory with only repo files.
// No deployment or browser rendering is implied by this HTTP route smoke test.
const ROOT=path.resolve(fileURLToPath(new URL('../../',import.meta.url)));
const PREFIX='/v22-integration/';
const server=http.createServer(async(req,res)=>{
  const parsed=new URL(req.url,'http://localhost');
  if(!parsed.pathname.startsWith(PREFIX)){res.writeHead(404);res.end();return;}
  const relative=decodeURIComponent(parsed.pathname.slice(PREFIX.length));
  if(relative.includes('..')||relative.startsWith('/')){res.writeHead(403);res.end();return;}
  const requested=relative.endsWith('/')?relative+'index.html':relative;
  const target=path.resolve(ROOT,requested);
  if(!target.startsWith(ROOT+path.sep)){res.writeHead(403);res.end();return;}
  try{
    const bytes=await fs.readFile(target);
    res.writeHead(200,{'content-type':target.endsWith('.json')?'application/json':target.endsWith('.csv')?'text/csv; charset=utf-8':target.endsWith('.mjs')?'text/javascript':'text/html; charset=utf-8'});
    res.end(bytes);
  }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try{
  const origin='http://127.0.0.1:'+server.address().port+PREFIX;
  const shell=await fetch(origin+'rebuild-preview/scene1341-ranked/index.html');
  assert.equal(shell.status,200,'isolated nested shell must serve');
  const html=await shell.text();
  assert(html.includes('../scene1341-ranked-ui.mjs'));
  assert(html.includes('scope:"./"'));
  for(const p of [
    'rebuild-preview/scene1341-ranked/sw.js',
    'rebuild-preview/scene1341-ranked-ui.mjs',
    'rebuild-preview/scene1341-ranked-preview.mjs',
    'tools/integration/scene1341-ranked/manifest.json',
    'tools/integration/scene1341-ranked/index.json'
  ])assert.equal((await fetch(origin+p)).status,200,'missing static asset '+p);
  const store=createRankedStore({base:new URL(origin+'tools/integration/scene1341-ranked/')});
  const index=await store.initialize();
  assert.equal(index.scenes.length,110);
  const first=await store.scene('SC50-0001');
  const last=await store.scene('SC50-0110');
  assert(first.rows.length>0&&last.rows.length>0);
  assert.equal((await store.scene('SC50-0111')).status,'NOT_DELIVERED');
  assert.equal(store.productionEligible,false);
  console.log(JSON.stringify({status:'PASS',mode:'HTTP_PREFIX_SMOKE',prefix:PREFIX,scenes:index.scenes.length,first:first.rows.length,last:last.rows.length,productionEligible:false}));
}finally{await new Promise(resolve=>server.close(resolve));}
