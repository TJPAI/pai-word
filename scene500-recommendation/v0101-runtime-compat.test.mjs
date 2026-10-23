import test from 'node:test';
import assert from 'node:assert/strict';
import {adaptChineseV0101} from './v0101-runtime-compat.mjs';
const payload=()=>({data_version:'0.10.1-evidence-compat',
 runtime_version:'0.9.4-rc.2-compatible',contract_version:'1.1',
 integration_ready:true,production_ready:false,
 terms:Array.from({length:20000},(_,i)=>({term_id:'zh_'+i.toString(16).padStart(20,'0'),
 term:'词'+i,normalized_term:'词'+i,source_version:'historic'}))});
test('valid V0.10.1 preserves every term ID and provenance',()=>{
 const raw=payload(),out=adaptChineseV0101(raw);
 assert.equal(out.terms.length,20000);
 assert.equal(out.terms[100].term_id,raw.terms[100].term_id);
 assert.equal(out.terms[100].source_version,'historic');
 assert.equal(out.terms[100].frequency_rank,null);
});
test('rejects premature production and illegal identities',()=>{
 const raw=payload();raw.production_ready=true;
 assert.throws(()=>adaptChineseV0101(raw),/CONTRACT/);
 const again=payload();again.terms[1].term_id=again.terms[0].term_id;
 assert.throws(()=>adaptChineseV0101(again),/IDENTITY/);
});
