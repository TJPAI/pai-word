import test from 'node:test';
import assert from 'node:assert/strict';
import {rankSceneKeywords} from './keyword-ranker-candidate.mjs';
const edges={links:[{term:'公交车',scene_id:'S078',score:.9},{term:'公交车',scene_id:'S092',score:.3},{term:'车票',scene_id:'S092',score:.8}]};
test('preserves unsupported term as fallback, identity and nonmutation',()=>{
 const spans=[{term:'公交车',candidates:[{term_id:'zh_A'}]},{term:'车票',candidates:[{term_id:'zh_B'}]},{term:'新词',candidates:[{term_id:'zh_C'}]}];
 const before=JSON.stringify(spans);
 const ranked=rankSceneKeywords(spans,edges,{maxTerms:2});
 assert.equal(ranked.ranked.length,3);
 assert.equal(new Set(ranked.ranked.map(x=>x.term_id)).size,3);
 assert.equal(ranked.ranked.find(x=>x.term==='新词').has_scene_support,false);
 assert.equal(JSON.stringify(spans),before);
});
test('nested spans are downweighted but not discarded',()=>{
 const r=rankSceneKeywords(['公交车','公交'],edges);
 assert.equal(r.ranked.length,2);
 assert.equal(r.ranked.find(x=>x.term==='公交').nested,true);
});
test('malformed terms fail closed',()=>assert.throws(()=>rankSceneKeywords([null],edges)));
