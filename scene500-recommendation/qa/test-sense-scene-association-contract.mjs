import assert from 'node:assert/strict';
import {validateAssociationRows} from './sense-scene-association-contract.mjs';
const valid=[
 {source_kind:'en_sense',source_id:'sense-A',scene_namespace:'scene50',scene_id:'SC50-0001',status:'candidate',release_eligible:false},
 {source_kind:'zh_term',source_id:'term-B',scene_namespace:'scene500',scene_id:'S113',status:'candidate',release_eligible:false}
];
const refs={sceneIds:['scene50:SC50-0001','scene500:S113'],senseIds:['sense-A'],termIds:['term-B']};
const ok=validateAssociationRows(valid,refs);
assert.equal(ok.accepted.length,2);assert.equal(ok.errors.length,0);
const bad=validateAssociationRows([...valid,valid[0],{...valid[0],scene_namespace:'scene500'},{...valid[0],release_eligible:true},{...valid[0],source_id:'unknown'}],refs);
assert.equal(bad.accepted.length,2);
assert.deepEqual(bad.errors.map(x=>x.code),['DUPLICATE_ASSOCIATION','UNKNOWN_NAMESPACED_SCENE','DUPLICATE_ASSOCIATION','UNKNOWN_SENSE']);
assert.equal(validateAssociationRows([],refs).accepted.length,0);
console.log('PASS isolated Sense/zh-term -> namespaced Scene contract');
