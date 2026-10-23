import assert from 'node:assert/strict';
import {auditSemanticOverlayQuality} from './semantic-overlay-quality-audit.mjs';
const r=auditSemanticOverlayQuality({scenes:[
{scene_id:'S001',name:'晨起',expressions:['我想学习晨起相关的英语表达','在晨起的情况下如何沟通','闹钟响了怎么办']},
{scene_id:'S002',name:'刷牙',expressions:['牙膏挤不出来怎么办','牙刷掉进水池了']}
]});
assert.equal(r.scene_count,2);
assert.equal(r.expression_count,5);
assert.equal(r.generic_template_count,2);
assert.deepEqual(r.high_template_scene_ids,['S001']);
assert.equal(r.requires_independent_relevance_review,true);
assert.equal(auditSemanticOverlayQuality(null).expression_count,0);
console.log('PASS semantic overlay quality audit smoke tests');
