#!/usr/bin/env node
// Audit the pre-E5 input gate against a real E5 report; never relabel examples.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {checkQuery} from './input-gate.mjs';
const input=process.argv[2];
if(!input)throw Error('Usage: node audit-e5-gate.mjs path/to/scene500-e5-results.json [output.json]');
const report=JSON.parse(readFileSync(input,'utf8'));
assert.equal(report.schema,'scene500-e5-offline-evaluation-v1');
assert.equal(report.results.length,72);
const counts={PASS:0,INVALID_INPUT:0,UNSUPPORTED_LANGUAGE:0};
const details=report.results.map(r=>{
 const gate=checkQuery(r.query);
 counts[gate.status]=(counts[gate.status]||0)+1;
 return {id:r.id,query:r.query,gate_status:gate.status,reason:gate.reason,
  original_top1:r.top10[0],expected_scene_ids:r.expected_scene_ids};
});
const rejected=details.filter(x=>x.gate_status!=='PASS');
const invalidNegatives=rejected.filter(x=>x.expected_scene_ids.length===0);
const invalidPositives=rejected.filter(x=>x.expected_scene_ids.length>0);
const provisionalNegatives=details.filter(x=>x.expected_scene_ids.length===0);
const output={schema:'scene500-input-gate-audit-v1',sourceReport:input,
  counts,invalidPositives:invalidPositives.map(x=>x.id),
  provisionalNegatives:provisionalNegatives.length,
  provisionalNegativesRejected:invalidNegatives.length,
  provisionalNegativesRemaining:provisionalNegatives.length-invalidNegatives.length,
  rejected,warning:'Syntax gate only; provisional no-match labels are unverified. No semantic abstention established.'};
assert.deepEqual(counts,{PASS:68,INVALID_INPUT:3,UNSUPPORTED_LANGUAGE:1});
assert.equal(invalidPositives.length,0);
assert.deepEqual(rejected.map(x=>x.id),['H066','H067','H068','H069']);
if(process.argv[3])writeFileSync(process.argv[3],JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output,null,2));
