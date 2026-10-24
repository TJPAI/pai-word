import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {verifyScene500V0101} from './verify-scene500-v0101.mjs';

const term='天气', id='zh_'+createHash('sha256').update(term).digest('hex').slice(0,20);
const runtime=()=>({data_version:'0.10.1-evidence-compat',runtime_version:'0.9.4-rc.2-compatible',contract_version:'1.1',integration_ready:true,production_ready:false,terms:[{term_id:id,term,normalized_term:term}]});
const associations=()=>({source:{lexicon_version:'0.9.4-rc.2',lexicon_sha256:'9be43c35c1e0d1b1926c11726acb2d707bb052634e1ebc60ed445e4b35c63335'},links:[{term_id:id,term,scene_id:'S001'}]});
const codes=(r,a)=>verifyScene500V0101(r,a).errors.map(e=>e.code);
test('rejects missing count and bad release flags',()=>{const r=runtime();r.production_ready=true;const e=codes(r,associations());assert(e.includes('RUNTIME_CONTRACT'));assert(e.includes('TERM_COUNT'));});
test('detects association foreign key',()=>{const a=associations();a.links[0].term_id='zh_'+'0'.repeat(20);assert(codes(runtime(),a).includes('MISSING_FOREIGN_KEY'));});
test('detects association term mismatch',()=>{const a=associations();a.links[0].term='气候';assert(codes(runtime(),a).includes('TERM_SURFACE_MISMATCH'));});
test('rejects out-of-range scene id',()=>{const a=associations();a.links[0].scene_id='S501';assert(codes(runtime(),a).includes('SCENE_ID_INVALID'));});
test('rejects duplicate edge',()=>{const a=associations();a.links.push({...a.links[0]});assert(codes(runtime(),a).includes('DUPLICATE_ASSOCIATION'));});
test('rejects term identity mismatch',()=>{const r=runtime();r.terms[0].term_id='zh_'+'f'.repeat(20);assert(codes(r,associations()).includes('TERM_ID_HASH_MISMATCH'));});
test('rejects wrong baseline provenance',()=>{const a=associations();a.source.lexicon_version='unknown';assert(codes(runtime(),a).includes('ASSOCIATION_PROVENANCE'));});
