#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const steps = [
  ['node', ['scripts/validate-scene-taxonomy-v2.mjs']],
  ['node', ['scripts/generate-scene500-candidates.mjs']],
  ['node', ['scripts/audit-scene500-candidates.mjs']]
];

for (const [cmd, args] of steps) {
  console.log(`\n$ ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { stdio: 'inherit' });
  if (r.error) throw r.error;
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log('\nScene500 C01 pilot pipeline completed.');
console.log('Generated data/scene500-candidates-v1.json remains generated_candidate/pending only.');
console.log('Do not copy candidates into production links until sense-level review is complete.');
