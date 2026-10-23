import test from 'node:test';
import assert from 'node:assert/strict';
import {filterSceneSupportedTerms as filter} from './keyword-scene-filter.mjs';
const associations={links:[{term:'酒店',scene_id:'S113'},{term:'酒店前台',scene_id:'S114'},{term:'入住',scene_id:'S114'}]};
test('candidate filter only uses scene support, not stopwords or corpus frequency',()=>{
 assert.deepEqual(filter(['酒店前台','酒店','入住','我要'],associations),['酒店前台','酒店','入住']);
 assert.deepEqual(filter(['酒店前台','酒店','入住','我要'],associations,{dropNested:true}),['酒店前台','入住']);
});
test('does not mutate source arrays or conflate term identities',()=>{
 const words=['酒店','酒店前台'];const snapshot=JSON.stringify(associations);
 filter(words,associations);assert.deepEqual(words,['酒店','酒店前台']);assert.equal(JSON.stringify(associations),snapshot);
});
