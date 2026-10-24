import assert from 'node:assert/strict';
const instances=[];
class FakeWorker{
 constructor(){this.sent=[];this.terminated=false;instances.push(this)}
 postMessage(msg){this.sent.push(msg)}
 terminate(){this.terminated=true}
 respond(data){this.onmessage({data})}
}
globalThis.Worker=FakeWorker;
const {createE5Encoder}=await import('./runtime/scene500-e5-encoder.mjs');
const encoder=createE5Encoder();const worker=instances[0];
const controller=new AbortController();
const aborted=encoder.encode('query: test',{signal:controller.signal});
assert.equal(worker.sent.length,1);
controller.abort();
await assert.rejects(aborted,{name:'AbortError'});
worker.respond({id:1,ok:true,vector:[1]});
const pending=encoder.warmup();
encoder.dispose();
await assert.rejects(pending,/disposed/);
assert.equal(worker.terminated,true);
await assert.rejects(encoder.encode('query: test'),/disposed/);
encoder.dispose();
console.log('PASS abort, late result ignored, pending promise rejected on dispose, idempotent dispose');
