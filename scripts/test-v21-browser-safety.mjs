import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
const root=process.cwd();let rollback=false;
const server=http.createServer((req,res)=>{let p=path.join(rollback?process.env.PAI_ROLLBACK_ROOT:root,new URL(req.url,'http://local').pathname);if(p.endsWith('/'))p+='index.html';try{res.setHeader('Content-Type',/\.m?js$/.test(p)?'text/javascript':p.endsWith('.html')?'text/html':p.endsWith('.css')?'text/css':'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(fs.readFileSync(p))}catch{res.writeHead(404).end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}/rebuild-preview/`,key='pai-word-core20k-rebuild-preview-v21';
const b=await chromium.launch({executablePath:process.env.PAI_CHROMIUM,args:['--no-sandbox']});
const result={browser:b.version(),checks:[]};
try{
 const c=await b.newContext(),a=await c.newPage(),other=await c.newPage();
 await a.goto(url);await a.waitForFunction(()=>window.PAI_HOME_READY_MS);
 await other.goto(url);await other.waitForFunction(()=>window.PAI_HOME_READY_MS);
 await a.evaluate(()=>{state.stats.known=7;save()});
 const attempt=await other.evaluate(()=>{state.stats.unknown=3;try{save();return 'wrote'}catch(e){return e.message}});
 assert.notEqual(attempt,'wrote','stale second tab overwrote first tab');
 assert.equal(await a.evaluate(key=>JSON.parse(localStorage.getItem(key)).stats.known,key),7);
 result.checks.push('second tab cannot overwrite active writer');
 await a.close();await other.reload();await other.waitForFunction(()=>window.PAI_HOME_READY_MS);
 await other.evaluate(()=>{state.stats.unknown=3;save()});
 assert.deepEqual(await other.evaluate(key=>JSON.parse(localStorage.getItem(key)).stats,key),{known:7,unknown:3});result.checks.push('closing writer and reloading permits safe handover');
 await other.evaluate(()=>{state.autoPronounce={question:false,swipe:false};save();return PAI_SCENE_SEARCH.open('S001','all')});await other.waitForFunction(()=>state.learningSession?.currentAttempt&&!document.querySelector('.done'));await other.getByRole('button',{name:'知道',exact:true}).click();
 const savedAttempt=await other.evaluate(()=>({...state.learningSession.currentAttempt}));
 // A client predating the lock contract is still detected before overwriting it.
 await other.evaluate(key=>{const newer=JSON.parse(localStorage.getItem(key));newer.stats.known=9;localStorage.setItem(key,JSON.stringify(newer))},key);
 const stale=await other.evaluate(()=>{try{save();return 'wrote'}catch(e){return e.message}});assert.notEqual(stale,'wrote');result.checks.push('out-of-band state changes reject stale save');
 await c.setOffline(true);let offlineNavigation=true;try{await other.reload({timeout:5000});await other.waitForFunction(()=>window.PAI_HOME_READY_MS,{},{timeout:3000})}catch{offlineNavigation=false}
 result.offlineReload={supported:offlineNavigation,conditions:'browser HTTP cache disabled by no-store; current network-only scoped worker'};
 await c.setOffline(false);await other.close();
 if(process.env.PAI_ROLLBACK_ROOT){
  rollback=true;const old=await c.newPage();await old.goto(url);await old.waitForFunction(()=>window.PAI_HOME_READY_MS);await old.getByRole('button',{name:'继续本轮',exact:true}).click();await old.waitForFunction(()=>window.PAI_ENGINE_READY&&state.learningSession?.currentAttempt&&!document.querySelector('.done'));
  const recovered=await old.evaluate(()=>({...state.learningSession.currentAttempt}));assert.equal(recovered.attemptId,savedAttempt.attemptId);assert.equal(recovered.phase,'answer');assert.equal(recovered.responseMs,savedAttempt.responseMs);result.checks.push('rollback to f2ac8c5 after closing new clients preserves attempt and answer');await old.close();rollback=false;
 }
 const unsupported=await c.newPage();await unsupported.addInitScript(()=>Object.defineProperty(navigator,'locks',{value:undefined}));await unsupported.goto(url);await unsupported.waitForFunction(()=>window.PAI_HOME_READY_MS);assert.equal(await unsupported.evaluate(()=>PAI_PREVIEW_WRITABLE),false);await unsupported.evaluate(()=>PAI_SCENE_SEARCH.open('S001'));assert.equal(await unsupported.evaluate(()=>!!window.PAI_ENGINE_READY),false);result.checks.push('unsupported lock API: readable home, explicit message, no unsafe learning write');
 result.result='PASS';
}catch(e){result.result='FAIL';result.error=e.message;throw e}
finally{fs.writeFileSync('docs/qa/v21-browser-safety.json',JSON.stringify(result,null,2)+'\n');await b.close();server.close();console.log(JSON.stringify(result))}
