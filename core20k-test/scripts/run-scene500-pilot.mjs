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
  ['node', ['scripts/validate-scene500-composed-scenes.mjs']],
  ['node', ['scripts/validate-scene500-seeds.mjs']],
  ['node', ['scripts/generate-scene500-candidates.mjs']],
  ['node', ['scripts/audit-scene500-candidates.mjs']],
  ['node', ['scripts/generate-scene500-composed-candidates.mjs']],
  ['node', ['scripts/audit-scene500-composed-candidates.mjs']]
];

for (const [cmd, args] of steps) {
  console.log(`\n$ ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { stdio: 'inherit' });
  if (r.error) throw r.error;
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log(`\nScene500 pipeline completed for ${seededScenes} semantic-seeded nodes plus 120 composed learning surfaces.`);
console.log('Node types, composed surfaces, seed coverage, source-membership policy, base candidates and composed candidates passed configured gates.');
console.log('Composed scenes are user-facing editorial surfaces only; they are not verified KU sets until reviewed composition mapping exists.');
console.log('Both base and composed generated candidates remain pending and production-ineligible.');
console.log('Do not promote links into runtime production data until sense-level and composition review are complete.');
