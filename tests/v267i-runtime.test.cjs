const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');

test('V26.7I overlay is byte-verified and expands canonical KU inventory exactly',()=>{
  const base=path.join(root,'data/core13000-v25.5'),over=path.join(root,'data/core13000-v26.7i-lite');
  const bm=JSON.parse(fs.readFileSync(path.join(base,'manifest.json'))),om=JSON.parse(fs.readFileSync(path.join(over,'manifest.json')));
  let b64='';for(const p of om.parts){const s=fs.readFileSync(path.join(over,p.file),'utf8').trim();assert.equal(s.length,p.chars);assert.equal(sha(s),p.sha256);b64+=s}
  const gz=Buffer.from(b64,'base64');assert.equal(gz.length,om.gzip_bytes);assert.equal(sha(gz),om.gzip_sha256);
  const raw=zlib.gunzipSync(gz);assert.equal(raw.length,om.json_bytes);assert.equal(sha(raw),om.json_sha256);
  const overlay=JSON.parse(raw);assert.equal(overlay.word_count,13000);assert.equal(overlay.ku_count,16616);assert.equal(overlay.ipa_pos.length,983);assert.equal(overlay.ku_meta.length,510);
  const rows=bm.packs.flatMap(p=>JSON.parse(zlib.brotliDecompressSync(fs.readFileSync(path.join(base,p.file)))).words);
  const oldKU=new Set(rows.flatMap(r=>r[5].map(s=>s[4]).filter(Boolean))),metaKU=new Set(overlay.ku_meta.map(x=>x[1]));
  let overlap=0;for(const k of metaKU)if(oldKU.has(k))overlap++;
  assert.equal(oldKU.size,16202);assert.equal(overlap,96);assert.equal(metaKU.size-overlap,414);assert.equal(new Set([...oldKU,...metaKU]).size,16616);
  const byRank=new Map(rows.map(r=>[r[0],r]));for(const [rank,pos,us] of overlay.ipa_pos){const r=byRank.get(rank);r[2]=pos||r[2];r[4]=us||r[4]}
  assert.equal(rows.filter(r=>!String(r[4]||'').trim()).length,0);
});

test('shipped loader activates V26.7I overlay and ku_id-v2 without legacy comparison draft',()=>{
  const src=fs.readFileSync(path.join(root,'core-loader.js'),'utf8');
  assert.match(src,/core13000-v26\.7i-lite/);assert.match(src,/ku_id-v2/);assert.match(src,/16616/);assert.match(src,/comparisonUnits:0/);
  assert.doesNotMatch(src,/loadComparisons\(/);
});
