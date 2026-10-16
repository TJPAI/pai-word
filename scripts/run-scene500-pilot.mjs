#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const seedManifest = JSON.parse(fs.readFileSync('data/scene500-seed-manifest-v1.json', 'utf8'));
let seededScenes = 0;
for (const file of seedManifest.files || []) {
  const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
  seededScenes += Object.keys(doc.scenes || {}).length;
}

const steps = [
  ['node', ['scripts/validate-scene-taxonomy-v2.mjs']],
  ['node', ['scripts/validate-scene500-node-types.mjs']],
  ['node', ['scripts/validate-scene500-seeds.mjs']],
  ['node', ['scripts/generate-scene500-candidates.mjs']],
  ['node', ['scripts/audit-scene500-candidates.mjs']]
];

for (const [cmd, args] of steps) {
  console.log(`\n$ ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { stdio: 'inherit' });
  if (r.error) throw r.error;
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log(`\nScene500 seeded-scene pipeline completed for ${seededScenes} scenes.`);
console.log('Node types, seed coverage, source-membership policy, candidates and QA all passed their configured gates.');
console.log('Generated data/scene500-candidates-v1.json remains generated_candidate/pending only.');
console.log('Do not copy candidates into production links until sense-level review is complete.');
