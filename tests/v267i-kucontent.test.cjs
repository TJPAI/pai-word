const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const zlib=require('node:zlib');
const ROOT=path.resolve(__dirname,'..');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function decodeOverlay(dir){
  const m=JSON.parse(fs.readFileSync(path.join(ROOT,dir,'manifest.json'),'utf8'));
  let b64='';
  for(const p of m.parts){const text=fs.readFileSync(path.join(ROOT,dir,p.file),'utf8').trim();assert.equal(text.length,p.chars,p.file+' chars');assert.equal(sha(Buffer.from(text)),p.sha256,p.file+' sha256');b64+=text}
  const gz=Buffer.from(b64,'base64');assert.equal(gz.length,m.gzip_bytes);assert.equal(sha(gz),m.gzip_sha256);
  const raw=zlib.gunzipSync(gz);assert.equal(raw.length,m.json_bytes);assert.equal(sha(raw),m.json_sha256);
  return {m,payload:JSON.parse(raw.toString('utf8'))};
}
test('V26.7I KU content overlay is intact and maps to runtime KUs',()=>{
  const content=decodeOverlay('data/core13000-v26.7i-kucontent');
  assert.equal(content.m.ku_content_count,510);
  assert.equal(content.payload.schema,'pai-word-v267i-ku-content-v1');
  assert.equal(content.payload.ku_content.length,510);
  const ids=content.payload.ku_content.map(x=>x.ku_id);
  assert.equal(new Set(ids).size,510);
  assert.ok(content.payload.ku_content.every(x=>String(x.content_zh||'').trim()));
  const lite=decodeOverlay('data/core13000-v26.7i-lite').payload;
  const runtimeIds=new Set(lite.ku_meta.map(x=>x[1]));
  assert.ok(ids.every(id=>runtimeIds.has(id)),'every content KU must exist in runtime KU metadata');
});
test('KU content is optional and does not redefine SRS identity',()=>{
  const loader=fs.readFileSync(path.join(ROOT,'ku-content.js'),'utf8');
  const ui=fs.readFileSync(path.join(ROOT,'ku-content-ui.js'),'utf8');
  const bootstrap=fs.readFileSync(path.join(ROOT,'core-bootstrap.js'),'utf8');
  assert.match(loader,/unit\.kuContent=/);
  assert.doesNotMatch(loader,/unit\.k\s*=/);
  assert.doesNotMatch(loader,/ku_id\s*=/);
  assert.match(loader,/status='fallback'/);
  assert.match(bootstrap,/KU content enhancement skipped/);
  assert.match(ui,/type==='sense'/);
});
