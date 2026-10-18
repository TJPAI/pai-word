import test from 'node:test';import assert from 'node:assert/strict';import {adaptPreviewPack} from './core20k-preview-adapter.mjs';
const card={rank:9999,lemma:'example',pos:'n',gloss_zh:'例子',gloss_en:'an instance',evidence_locator:'e1',candidate_key:'c1',state:'preview_only',ku_id:null};
const core=()=>({byKU:new Map([['old-id',{}]]),byLemma:new Map(),byScene:new Map()});
test('preserves old KU map',()=>{const c=core(),u=adaptPreviewPack({schema:'pai-core20k-preview-pack-v1',activation_allowed:false,cards:[card]},c);assert.equal(u.length,1);assert.equal(c.byKU.size,1);assert.equal(u[0].k,null)});
test('canonical ID forbidden',()=>assert.throws(()=>adaptPreviewPack({schema:'pai-core20k-preview-pack-v1',activation_allowed:false,cards:[{...card,ku_id:'new'}]},core())));
test('legacy lemma collision blocked',()=>{const c=core();c.byLemma.set('example',[{}]);assert.throws(()=>adaptPreviewPack({schema:'pai-core20k-preview-pack-v1',activation_allowed:false,cards:[card]},c))});
test('activation blocked',()=>assert.throws(()=>adaptPreviewPack({schema:'pai-core20k-preview-pack-v1',activation_allowed:true,cards:[card]},core())));
