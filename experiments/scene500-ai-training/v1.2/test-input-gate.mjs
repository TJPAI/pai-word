import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {checkQuery} from './input-gate.mjs';
const samples=[
 ['???','INVALID_INPUT'],['🍎🍎🍎','INVALID_INPUT'],['000000000000','INVALID_INPUT'],
 ['ㅎㅇㅂㅈㄷ','UNSUPPORTED_LANGUAGE'],['','INVALID_INPUT'],
 ['我想学高等数学','PASS'],['I need to learn calculus','PASS'],
 ['What is dark matter','PASS'],['AI','PASS'],['C++','PASS'],
 ['形而上学是什么','PASS'],['宏观经济模型里的通货膨胀','PASS'],
 ['我要让聊天机器人回答得更好','PASS'],
];
for(const [q,expected] of samples)assert.equal(checkQuery(q).status,expected,q);
const rows=readFileSync('experiments/scene500-ai-training/v0.6/unseen-evaluation-draft.jsonl','utf8').trim().split(/\r?\n/).map(JSON.parse);
const counts={PASS:0,INVALID_INPUT:0,UNSUPPORTED_LANGUAGE:0};
for(const r of rows){const v=checkQuery(r.query);counts[v.status]=(counts[v.status]||0)+1;}
assert.equal(rows.length,72);
console.log(JSON.stringify({tests:samples.length,rows:rows.length,counts,note:'This is syntax filtering, not semantic no-match calibration'},null,2));
