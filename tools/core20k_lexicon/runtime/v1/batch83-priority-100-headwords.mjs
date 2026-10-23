// Correct Batch82's 100 KU vs 100 distinct frozen-headword mixup.
// Usage: node batch83-priority-100-headwords.mjs <top1000_ku_review_2933.jsonl> <output.jsonl>
import fs from 'node:fs';import assert from 'node:assert/strict';
const [src,out]=process.argv.slice(2);if(!out)throw Error('usage: node batch83-priority-100-headwords.mjs input.jsonl output.jsonl');
const rows=fs.readFileSync(src,'utf8').trim().split('\n').map(JSON.parse);
assert.equal(rows.length,2933);
const groups=new Map();
for(const r of rows.sort((a,b)=>a.rank-b.rank||a.ku_id.localeCompare(b.ku_id))){if(!groups.has(r.headword_id))groups.set(r.headword_id,[]);groups.get(r.headword_id).push(r);}
const selected=[...groups.values()].slice(0,100).map(g=>{const r=g.find(x=>x.ku_type_legacy==='sense'&&x.sense_id&&x.gloss_zh&&x.gloss_en)||g[0];return {...r,l2_status:'PENDING_DIRECT_BILINGUAL_IPA_EVIDENCE',content_certified:false,production_ready:false};});
assert.equal(selected.length,100);assert.equal(new Set(selected.map(x=>x.headword_id)).size,100);
fs.writeFileSync(out,selected.map(x=>JSON.stringify(x)).join('\n')+'\n');
console.log('PASS 100 distinct frozen headword IDs, 100 unchanged KU IDs, zero certified');