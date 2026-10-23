#!/usr/bin/env node
// Validate editorial audit overlay without modifying frozen v0.6 labels.
import {readFileSync} from 'node:fs';
const root='experiments/scene500-ai-training/';
const read=p=>readFileSync(root+p,'utf8').trim().split(/\r?\n/).map(JSON.parse);
const original=read('v0.6/unseen-evaluation-draft.jsonl');
const audit=read('v0.9/annotation-audit.jsonl');
const catalog=JSON.parse(readFileSync(root+'v0.1/catalog.json','utf8')).scenes;
const ids=new Set(catalog.map(x=>x.id));
const lookup=new Map(original.map(x=>[x.id,x]));
const checked=new Set();
for(const row of audit){
 if(!lookup.has(row.id))throw Error('Unknown evaluation case '+row.id);
 if(checked.has(row.id))throw Error('Duplicate audit id '+row.id);
 checked.add(row.id);
 if(row.review_status!=='editorial_second_pass_not_independent')throw Error('Invalid review status');
 if(!Array.isArray(row.plausible_scene_ids)||row.plausible_scene_ids.some(x=>!ids.has(x)))throw Error('Invalid scene');
 if(!row.reason||row.reason.length<12)throw Error('Missing reasoning');
}
console.log(JSON.stringify({pass:true,frozenCases:original.length,auditedCases:audit.length,canonicalScenes:ids.size,independentlyGoldReviewed:0},null,2));
