#!/usr/bin/env node
import {readFileSync} from 'node:fs';
const base='experiments/scene500-ai-training/';
const load=p=>JSON.parse(readFileSync(p,'utf8'));
const jsonl=p=>readFileSync(p,'utf8').trim().split(/\r?\n/).map(JSON.parse);
const canonical=load(base+'v0.1/catalog.json').scenes;
const current=load('scene500-recommendation/catalog-v0.2.json').scenes;
const train=jsonl(base+'v0.2/weak-semantic-seeds.jsonl');
const evals=jsonl(base+'v0.6/unseen-evaluation-draft.jsonl');
const norm=s=>s.toLowerCase().normalize('NFKC').replace(/\s+/g,' ').trim();
const units=s=>(s.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*|[\u3400-\u9fff]|[0-9]|[^\s]/gu)||[]).length;
const ids=new Set(canonical.map(x=>x.id));
function assert(ok,msg){if(!ok)throw Error(msg)}
assert(canonical.length===500&&ids.size===500,'catalog-size');
assert(canonical.every(x=>current[x.id]?.name===x.name),'catalog-mismatch');
assert(train.length===2158&&evals.length===72,'data-count-mismatch');
assert(train.every(x=>x.labels.every(y=>ids.has(y.scene_id))),'train-invalid-id');
assert(evals.every(x=>x.expected_scene_ids.every(id=>ids.has(id))),'eval-invalid-id');
assert(evals.every(x=>units(x.query)>=1&&units(x.query)<=20),'query-length');
const seen=new Set(train.map(x=>norm(x.query)));
assert(seen.size===train.length,'duplicate-train');
assert(evals.every(x=>!seen.has(norm(x.query))),'exact-leakage');
const positives=evals.filter(x=>x.expected_scene_ids.length).length;
console.log(JSON.stringify({pass:true,scenes:ids.size,training:train.length,eval:evals.length,positiveDrafts:positives,emptyDrafts:evals.length-positives,warning:'Not independently reviewed gold; exact-query check only'},null,2));
